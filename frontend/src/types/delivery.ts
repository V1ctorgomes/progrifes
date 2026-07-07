export type Weekday =
  | "DOMINGO"
  | "SEGUNDA_FEIRA"
  | "TERCA_FEIRA"
  | "QUARTA_FEIRA"
  | "QUINTA_FEIRA"
  | "SEXTA_FEIRA"
  | "SABADO";

export type DeliveryBusinessHour = {
  id?: string;
  weekday: Weekday;
  weekdayLabel: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
};

export type DeliveryAvailability = {
  isOpenNow: boolean;
  canAcceptOrders: boolean;
  currentWeekday: Weekday;
  currentWeekdayLabel: string;
  todayHours: DeliveryBusinessHour | null;
};

export type DeliverySettings = {
  enabled: boolean;
  minimumOrderValue: number;
  averageDeliveryTime: number;
  message: string;
  closedMessage: string;
  businessHours: DeliveryBusinessHour[];
  availability: DeliveryAvailability;
  updatedAt: string;
};

export type UpdateDeliveryBusinessHourInput = {
  weekday: Weekday;
  isOpen: boolean;
  startTime: string;
  endTime: string;
};

export type UpdateDeliverySettingsInput = {
  enabled?: boolean;
  minimumOrderValue?: number;
  averageDeliveryTime?: number;
  message?: string;
  closedMessage?: string;
  businessHours?: UpdateDeliveryBusinessHourInput[];
  restoreDefaults?: boolean;
};

export const DELIVERY_TIME_PRESETS = [30, 45, 60, 90, 120] as const;

export const WEEKDAY_OPTIONS: Array<{ value: Weekday; label: string }> = [
  { value: "SEGUNDA_FEIRA", label: "Segunda-feira" },
  { value: "TERCA_FEIRA", label: "Terça-feira" },
  { value: "QUARTA_FEIRA", label: "Quarta-feira" },
  { value: "QUINTA_FEIRA", label: "Quinta-feira" },
  { value: "SEXTA_FEIRA", label: "Sexta-feira" },
  { value: "SABADO", label: "Sábado" },
  { value: "DOMINGO", label: "Domingo" },
];
