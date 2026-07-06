import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import { UserRole } from "@prisma/client";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get("dashboard")
  getDashboard(@CurrentUser() user: AuthUser) {
    return {
      message: "Área administrativa protegida",
      user,
    };
  }

  @Get("produtos")
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE, UserRole.FUNCIONARIO)
  getProdutos() {
    return { message: "Módulo de produtos — em desenvolvimento" };
  }

  @Get("categorias")
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE, UserRole.FUNCIONARIO)
  getCategorias() {
    return { message: "Módulo de categorias — em desenvolvimento" };
  }

  @Get("pedidos")
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE, UserRole.FUNCIONARIO)
  getPedidos() {
    return { message: "Módulo de pedidos — em desenvolvimento" };
  }

  @Get("clientes")
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE)
  getClientes() {
    return { message: "Módulo de clientes — em desenvolvimento" };
  }

  @Get("estoque")
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE)
  getEstoque() {
    return { message: "Módulo de estoque — em desenvolvimento" };
  }

  @Get("financeiro")
  @Roles(UserRole.ADMINISTRADOR)
  getFinanceiro() {
    return { message: "Módulo financeiro — em desenvolvimento" };
  }
}
