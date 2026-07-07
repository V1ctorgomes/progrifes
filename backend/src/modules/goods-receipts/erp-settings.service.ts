import { Injectable } from "@nestjs/common";
import { PayableGenerationMode } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const PAYABLE_MODE_KEY = "payable_generation_mode";

@Injectable()
export class ErpSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPayableGenerationMode(): Promise<PayableGenerationMode> {
    const setting = await this.prisma.erpSetting.findUnique({
      where: { key: PAYABLE_MODE_KEY },
    });
    if (setting?.value === PayableGenerationMode.AT_COMPLETION) {
      return PayableGenerationMode.AT_COMPLETION;
    }
    return PayableGenerationMode.PER_RECEIPT;
  }

  async setPayableGenerationMode(mode: PayableGenerationMode) {
    await this.prisma.erpSetting.upsert({
      where: { key: PAYABLE_MODE_KEY },
      create: { key: PAYABLE_MODE_KEY, value: mode },
      update: { value: mode },
    });
    return { payableGenerationMode: mode };
  }
}
