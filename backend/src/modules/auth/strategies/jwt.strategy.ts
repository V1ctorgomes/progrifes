import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersRepository } from "../../users/users.repository";
import { AuthUser, JwtPayload } from "../../common/interfaces/jwt-payload.interface";

function extractAccessToken(req: Request): string | null {
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private readonly usersRepository: UsersRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => extractAccessToken(req),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.usersRepository.findById(payload.sub);

    if (!user || !user.ativo) {
      throw new UnauthorizedException("Usuário inválido ou inativo");
    }

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
    };
  }
}
