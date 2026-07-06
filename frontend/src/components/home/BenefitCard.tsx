import type { Benefit } from "@/types/home";
import {
  PaymentIcon,
  QualityIcon,
  TruckIcon,
  WhatsAppIcon,
} from "@/components/ui/Icons";

const iconMap = {
  truck: TruckIcon,
  whatsapp: WhatsAppIcon,
  quality: QualityIcon,
  payment: PaymentIcon,
};

interface BenefitCardProps {
  benefit: Benefit;
}

export function BenefitCard({ benefit }: BenefitCardProps) {
  const Icon = iconMap[benefit.icon];

  return (
    <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand-black">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
        {benefit.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-gray">{benefit.description}</p>
    </div>
  );
}
