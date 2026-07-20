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
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-brand-black">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold tracking-tight text-brand-black">{benefit.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">{benefit.description}</p>
    </div>
  );
}
