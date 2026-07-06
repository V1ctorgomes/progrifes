import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "E-mail inválido" })
  @IsNotEmpty({ message: "E-mail é obrigatório" })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "Senha é obrigatória" })
  @MinLength(8, { message: "Senha deve ter no mínimo 8 caracteres" })
  senha!: string;
}
