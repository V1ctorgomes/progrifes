import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  @Public()
  @Post("refresh")
  refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException("Sessão expirada. Faça login novamente");
    }

    return this.authService.refreshByToken(refreshToken, res);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  logout(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    return this.authService.logout(user.id, refreshToken, res);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user);
  }
}
