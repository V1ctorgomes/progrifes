import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { DeliveryPersonStatus } from "@prisma/client";

export class ListDeliveryPersonsQueryDto {
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
  @IsEnum(DeliveryPersonStatus)
  status?: DeliveryPersonStatus;
}

export class CreateDeliveryPersonDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsEnum(DeliveryPersonStatus)
  status?: DeliveryPersonStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDeliveryPersonDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsEnum(DeliveryPersonStatus)
  status?: DeliveryPersonStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDeliveryPersonStatusDto {
  @IsEnum(DeliveryPersonStatus)
  status!: DeliveryPersonStatus;
}
