import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Weekday } from "@prisma/client";

export class DeliveryBusinessHourDto {
  @IsIn([
    "DOMINGO",
    "SEGUNDA_FEIRA",
    "TERCA_FEIRA",
    "QUARTA_FEIRA",
    "QUINTA_FEIRA",
    "SEXTA_FEIRA",
    "SABADO",
  ])
  weekday!: Weekday;

  @IsBoolean()
  isOpen!: boolean;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime!: string;
}

export class UpdateDeliverySettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minimumOrderValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  averageDeliveryTime?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  message?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  closedMessage?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(7)
  @ValidateNested({ each: true })
  @Type(() => DeliveryBusinessHourDto)
  businessHours?: DeliveryBusinessHourDto[];

  @IsOptional()
  @IsBoolean()
  restoreDefaults?: boolean;
}
