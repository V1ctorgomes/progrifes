import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { Response } from "express";
import { AuthUser, JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { getPermissionsForRole } from "../../common/permissions/role-permissions";
import { UsersRepository } from "../users/users.repository";
import { AuthRepository } from "./auth.repository";
import { LoginDto } from "./dto/login.dto";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, res: Response) {
    const user = await this.usersRepository.findByEmail(
      dto.email.toLowerCase().trim(),
    );

    if (!user || !user.ativo) {
      throw new UnauthorizedException("E-mail ou senha inválidos");
    }

    const senhaValida = await bcrypt.compare(dto.senha, user.senha);

    if (!senhaValida) {
      throw new UnauthorizedException("E-mail ou senha inválidos");
    }

    await this.usersRepository.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id, user.email, user.cargo);
    this.setAuthCookies(res, tokens);

    return {
      user: this.toAuthUser(user),
      permissions: getPermissionsForRole(user.cargo),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshByToken(refreshToken: string, res: Response) {
    const stored = await this.authRepository.findRefreshToken(refreshToken);

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Sessão expirada. Faça login novamente");
    }

    if (!stored.user.ativo) {
      throw new UnauthorizedException("Usuário inativo");
    }

    await this.authRepository.deleteRefreshToken(refreshToken);

    const tokens = await this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.cargo,
    );
    this.setAuthCookies(res, tokens);

    return {
      user: this.toAuthUser(stored.user),
      permissions: getPermissionsForRole(stored.user.cargo),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string, refreshToken: string | undefined, res: Response) {
    if (refreshToken) {
      await this.authRepository.deleteRefreshToken(refreshToken).catch(() => undefined);
    } else {
      await this.authRepository.deleteAllUserRefreshTokens(userId);
    }

    this.clearAuthCookies(res);
    return { message: "Logout realizado com sucesso" };
  }

  async getProfile(user: AuthUser) {
    const dbUser = await this.usersRepository.findById(user.id);

    if (!dbUser || !dbUser.ativo) {
      throw new UnauthorizedException("Usuário inválido ou inativo");
    }

    return {
      user: this.toAuthUser(dbUser),
      permissions: getPermissionsForRole(dbUser.cargo),
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    cargo: string,
  ): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, email, cargo };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    });

    const refreshToken = randomBytes(48).toString("hex");
    const expiresAt = this.getRefreshExpirationDate();

    await this.authRepository.createRefreshToken(userId, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }

  private getRefreshExpirationDate(): Date {
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    const now = Date.now();

    if (!match) {
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      d: 24 * 60 * 60 * 1000,
      h: 60 * 60 * 1000,
      m: 60 * 1000,
      s: 1000,
    };

    return new Date(now + value * (multipliers[unit] ?? multipliers.d));
  }

  private setAuthCookies(res: Response, tokens: TokenPair) {
    const secure = process.env.COOKIE_SECURE === "true";
    const sameSite = (process.env.COOKIE_SAME_SITE ?? "lax") as
      | "lax"
      | "strict"
      | "none";

    const common = {
      httpOnly: true,
      secure,
      sameSite,
      path: "/",
    };

    res.cookie("access_token", tokens.accessToken, {
      ...common,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", tokens.refreshToken, {
      ...common,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });
  }

  private toAuthUser(user: {
    id: string;
    nome: string;
    email: string;
    cargo: string;
  }): AuthUser {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
    };
  }
}
