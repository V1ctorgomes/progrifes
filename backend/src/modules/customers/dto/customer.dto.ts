import { Type, Transform } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

export class CustomerAddressDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty()
  cep!: string;

  @IsString()
  @IsNotEmpty()
  rua!: string;

  @IsString()
  @IsNotEmpty()
  numero!: string;

  @IsOptional()
  @IsString()
  complemento?: string;

  @IsString()
  @IsNotEmpty()
  bairro!: string;

  @IsString()
  @IsNotEmpty()
  cidade!: string;

  @IsString()
  @IsNotEmpty()
  estado!: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;
}

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
  telefone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsDateString()
  dataNascimento?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerAddressDto)
  enderecos?: CustomerAddressDto[];
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsDateString()
  dataNascimento?: string | null;

  @IsOptional()
  @IsString()
  observacoes?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerAddressDto)
  enderecos?: CustomerAddressDto[];
}

export class UpdateCustomerCrmDto {
  @IsOptional()
  @IsString()
  origem?: string | null;

  @IsOptional()
  @IsString()
  canalAtendimento?: string | null;

  @IsOptional()
  @IsUUID()
  responsavelId?: string | null;

  @IsOptional()
  @IsString()
  observacoesComerciais?: string | null;
}

export class CreateCustomerNoteDto {
  @IsString()
  @IsNotEmpty()
  descricao!: string;
}

export class CreateCustomerTagDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  cor?: string;
}

export class AssignCustomerTagDto {
  @IsOptional()
  @IsUUID()
  tagId?: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  cor?: string;
}

export class ListCustomersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsBoolean()
  ativo?: boolean;
}

export class ListCustomerOrdersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class UpsertCustomerFromCheckoutDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
  telefone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  cep!: string;

  @IsString()
  @IsNotEmpty()
  rua!: string;

  @IsString()
  @IsNotEmpty()
  numero!: string;

  @IsString()
  @IsNotEmpty()
  bairro!: string;

  @IsString()
  @IsNotEmpty()
  cidade!: string;

  @IsString()
  @IsNotEmpty()
  estado!: string;

  @IsOptional()
  @IsString()
  complemento?: string;

  @IsOptional()
  @IsString()
  referencia?: string;
}

export class CreateCustomerAddressDto {
  @IsString()
  @IsNotEmpty()
  cep!: string;

  @IsString()
  @IsNotEmpty()
  rua!: string;

  @IsString()
  @IsNotEmpty()
  numero!: string;

  @IsOptional()
  @IsString()
  complemento?: string;

  @IsString()
  @IsNotEmpty()
  bairro!: string;

  @IsString()
  @IsNotEmpty()
  cidade!: string;

  @IsString()
  @IsNotEmpty()
  estado!: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;
}

export class UpdateCustomerAddressDto extends CreateCustomerAddressDto {}
