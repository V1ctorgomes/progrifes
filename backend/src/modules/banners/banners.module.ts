import { Module } from "@nestjs/common";
import { BannersController } from "./banners.controller";
import { BannersRepository } from "./banners.repository";
import { BannersService } from "./banners.service";

@Module({
  controllers: [BannersController],
  providers: [BannersService, BannersRepository],
  exports: [BannersService, BannersRepository],
})
export class BannersModule {}
