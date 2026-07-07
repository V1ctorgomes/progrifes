import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import { DeliveryBusinessHour, Weekday } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { UpdateDeliverySettingsDto } from "./dto/delivery-settings.dto";
import {
  decimal,
  DEFAULT_AVERAGE_DELIVERY_TIME,
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_CLOSED_MESSAGE,
  DEFAULT_DELIVERY_MESSAGE,
  getCurrentMinutes,
  getWeekdayFromDate,
  isValidTime,
  timeToMinutes,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
} from "./delivery.utils";

type CachedSettings = Awaited<ReturnType<DeliverySettingsService["loadSettings"]>>;

@Injectable()
export class DeliverySettingsService implements OnModuleInit {
  private cache: CachedSettings | null = null;
  private cacheExpiresAt = 0;
  private readonly cacheTtlMs = 60_000;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureDefaults();
  }

  async getSettings() {
    return this.getCachedSettings();
  }

  async updateSettings(dto: UpdateDeliverySettingsDto, usuarioId?: string) {
    if (dto.restoreDefaults) {
      return this.restoreDefaults(usuarioId);
    }

    if (dto.businessHours) {
      this.validateBusinessHours(dto.businessHours);
    }

    if (
      dto.averageDeliveryTime !== undefined &&
      (dto.averageDeliveryTime < 1 || dto.averageDeliveryTime > 24 * 60)
    ) {
      throw new BadRequestException("Tempo médio de entrega inválido");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.deliverySettings.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          enabled: dto.enabled ?? true,
          minimumOrderValue: dto.minimumOrderValue ?? 0,
          averageDeliveryTime: dto.averageDeliveryTime ?? DEFAULT_AVERAGE_DELIVERY_TIME,
          message: dto.message ?? DEFAULT_DELIVERY_MESSAGE,
          closedMessage: dto.closedMessage ?? DEFAULT_CLOSED_MESSAGE,
        },
        update: {
          ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
          ...(dto.minimumOrderValue !== undefined
            ? { minimumOrderValue: dto.minimumOrderValue }
            : {}),
          ...(dto.averageDeliveryTime !== undefined
            ? { averageDeliveryTime: dto.averageDeliveryTime }
            : {}),
          ...(dto.message !== undefined ? { message: dto.message } : {}),
          ...(dto.closedMessage !== undefined ? { closedMessage: dto.closedMessage } : {}),
        },
      });

      if (dto.businessHours) {
        for (const hour of dto.businessHours) {
          await tx.deliveryBusinessHour.upsert({
            where: {
              settingsId_weekday: {
                settingsId: "default",
                weekday: hour.weekday,
              },
            },
            create: {
              settingsId: "default",
              weekday: hour.weekday,
              isOpen: hour.isOpen,
              startTime: hour.startTime,
              endTime: hour.endTime,
            },
            update: {
              isOpen: hour.isOpen,
              startTime: hour.startTime,
              endTime: hour.endTime,
            },
          });
        }
      }

      await tx.deliverySettingsHistory.create({
        data: {
          settingsId: "default",
          operacao: "ATUALIZACAO",
          descricao: "Configurações de entrega atualizadas",
          usuarioId,
        },
      });
    });

    this.invalidateCache();
    return this.getSettings();
  }

  async restoreDefaults(usuarioId?: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.deliverySettings.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          enabled: true,
          minimumOrderValue: 0,
          averageDeliveryTime: DEFAULT_AVERAGE_DELIVERY_TIME,
          message: DEFAULT_DELIVERY_MESSAGE,
          closedMessage: DEFAULT_CLOSED_MESSAGE,
        },
        update: {
          enabled: true,
          minimumOrderValue: 0,
          averageDeliveryTime: DEFAULT_AVERAGE_DELIVERY_TIME,
          message: DEFAULT_DELIVERY_MESSAGE,
          closedMessage: DEFAULT_CLOSED_MESSAGE,
        },
      });

      for (const hour of DEFAULT_BUSINESS_HOURS) {
        await tx.deliveryBusinessHour.upsert({
          where: {
            settingsId_weekday: {
              settingsId: "default",
              weekday: hour.weekday,
            },
          },
          create: {
            settingsId: "default",
            weekday: hour.weekday,
            isOpen: hour.isOpen,
            startTime: hour.startTime,
            endTime: hour.endTime,
          },
          update: {
            isOpen: hour.isOpen,
            startTime: hour.startTime,
            endTime: hour.endTime,
          },
        });
      }

      await tx.deliverySettingsHistory.create({
        data: {
          settingsId: "default",
          operacao: "RESTAURACAO",
          descricao: "Configurações de entrega restauradas para o padrão",
          usuarioId,
        },
      });
    });

    this.invalidateCache();
    return this.getSettings();
  }

  async validateCheckoutAllowed(orderTotal: number, date = new Date()) {
    const settings = await this.getCachedSettings();
    const availability = this.getAvailability(settings, date);

    if (!settings.enabled) {
      throw new BadRequestException("As entregas estão temporariamente indisponíveis");
    }

    if (!availability.isOpenNow) {
      throw new BadRequestException(settings.closedMessage);
    }

    if (orderTotal < settings.minimumOrderValue) {
      throw new BadRequestException(
        `Pedido mínimo para entrega: R$ ${settings.minimumOrderValue.toFixed(2)}`,
      );
    }
  }

  private async getCachedSettings() {
    const now = Date.now();
    if (this.cache && now < this.cacheExpiresAt) {
      return this.cache;
    }

    const settings = await this.loadSettings();
    this.cache = settings;
    this.cacheExpiresAt = now + this.cacheTtlMs;
    return settings;
  }

  private invalidateCache() {
    this.cache = null;
    this.cacheExpiresAt = 0;
  }

  private async loadSettings() {
    await this.ensureDefaults();

    const settings = await this.prisma.deliverySettings.findUnique({
      where: { id: "default" },
      include: {
        businessHours: {
          orderBy: { weekday: "asc" },
        },
      },
    });

    if (!settings) {
      throw new BadRequestException("Configurações de entrega não encontradas");
    }

    const businessHours = this.sortBusinessHours(settings.businessHours);
    const availability = this.getAvailability(
      {
        enabled: settings.enabled,
        minimumOrderValue: decimal(settings.minimumOrderValue),
        averageDeliveryTime: settings.averageDeliveryTime,
        message: settings.message,
        closedMessage: settings.closedMessage,
        businessHours,
      },
      new Date(),
    );

    return {
      enabled: settings.enabled,
      minimumOrderValue: decimal(settings.minimumOrderValue),
      averageDeliveryTime: settings.averageDeliveryTime,
      message: settings.message,
      closedMessage: settings.closedMessage,
      businessHours: businessHours.map((hour) => this.mapBusinessHour(hour)),
      availability,
      updatedAt: settings.updatedAt,
    };
  }

  private getAvailability(
    settings: {
      enabled: boolean;
      minimumOrderValue: number;
      averageDeliveryTime: number;
      message: string;
      closedMessage: string;
      businessHours: Array<{
        weekday: Weekday;
        isOpen: boolean;
        startTime: string;
        endTime: string;
      }>;
    },
    date: Date,
  ) {
    const weekday = getWeekdayFromDate(date);
    const todayHours =
      settings.businessHours.find((hour) => hour.weekday === weekday) ?? null;
    const isOpenNow = settings.enabled
      ? this.isWithinBusinessHours(todayHours, date)
      : false;

    return {
      isOpenNow,
      canAcceptOrders: settings.enabled && isOpenNow,
      currentWeekday: weekday,
      currentWeekdayLabel: WEEKDAY_LABELS[weekday],
      todayHours: todayHours
        ? {
            weekday: todayHours.weekday,
            weekdayLabel: WEEKDAY_LABELS[todayHours.weekday],
            isOpen: todayHours.isOpen,
            startTime: todayHours.startTime,
            endTime: todayHours.endTime,
          }
        : null,
    };
  }

  private isWithinBusinessHours(
    hour: Pick<DeliveryBusinessHour, "isOpen" | "startTime" | "endTime"> | null,
    date: Date,
  ) {
    if (!hour?.isOpen) return false;

    const current = getCurrentMinutes(date);
    const start = timeToMinutes(hour.startTime);
    const end = timeToMinutes(hour.endTime);

    if (end <= start) {
      return current >= start || current <= end;
    }

    return current >= start && current <= end;
  }

  private sortBusinessHours(hours: DeliveryBusinessHour[]) {
    return [...hours].sort(
      (a, b) => WEEKDAY_ORDER.indexOf(a.weekday) - WEEKDAY_ORDER.indexOf(b.weekday),
    );
  }

  private mapBusinessHour(hour: DeliveryBusinessHour) {
    return {
      id: hour.id,
      weekday: hour.weekday,
      weekdayLabel: WEEKDAY_LABELS[hour.weekday],
      isOpen: hour.isOpen,
      startTime: hour.startTime,
      endTime: hour.endTime,
    };
  }

  private validateBusinessHours(
    hours: Array<{
      weekday: Weekday;
      isOpen: boolean;
      startTime: string;
      endTime: string;
    }>,
  ) {
    const weekdays = new Set<Weekday>();

    for (const hour of hours) {
      if (weekdays.has(hour.weekday)) {
        throw new BadRequestException(`Horário duplicado para ${WEEKDAY_LABELS[hour.weekday]}`);
      }
      weekdays.add(hour.weekday);

      if (!isValidTime(hour.startTime) || !isValidTime(hour.endTime)) {
        throw new BadRequestException("Horário inválido. Use o formato HH:mm");
      }

      if (hour.isOpen && hour.startTime === hour.endTime) {
        throw new BadRequestException(
          `Horário inicial e final não podem ser iguais em ${WEEKDAY_LABELS[hour.weekday]}`,
        );
      }
    }

    if (weekdays.size !== WEEKDAY_ORDER.length) {
      throw new BadRequestException("Informe os horários de todos os dias da semana");
    }
  }

  private async ensureDefaults() {
    const existing = await this.prisma.deliverySettings.findUnique({
      where: { id: "default" },
      include: { businessHours: true },
    });

    if (!existing) {
      await this.prisma.deliverySettings.create({
        data: {
          id: "default",
          message: DEFAULT_DELIVERY_MESSAGE,
          closedMessage: DEFAULT_CLOSED_MESSAGE,
          businessHours: {
            create: DEFAULT_BUSINESS_HOURS.map((hour) => ({
              weekday: hour.weekday,
              isOpen: hour.isOpen,
              startTime: hour.startTime,
              endTime: hour.endTime,
            })),
          },
        },
      });
      return;
    }

    if (existing.businessHours.length === 0) {
      await this.prisma.deliveryBusinessHour.createMany({
        data: DEFAULT_BUSINESS_HOURS.map((hour) => ({
          settingsId: "default",
          weekday: hour.weekday,
          isOpen: hour.isOpen,
          startTime: hour.startTime,
          endTime: hour.endTime,
        })),
      });
    }
  }
}
