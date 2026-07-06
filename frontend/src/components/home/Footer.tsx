import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { storeInfo } from "@/lib/mock-data";

const shopLinks = [
  { label: "Mais vendidos", href: "#mais-vendidos" },
  { label: "Coleções", href: "#colecoes" },
  { label: "Outlet", href: "#outlet" },
];

const legalLinks = [
  { label: "Trocas e Devoluções", href: "#" },
  { label: "Política de Privacidade", href: "#" },
  { label: "Termos de Uso", href: "#" },
  { label: "Quem Somos", href: "#" },
];

const paymentMethods = ["Visa", "Master", "Elo", "Pix", "Boleto"];

export function Footer() {
  return (
    <footer id="contato" className="border-t border-neutral-200 bg-brand-white">
      <Container className="py-10 sm:py-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-black">
              Loja
            </h3>
            <ul className="mt-4 space-y-2">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-gray transition-colors hover:text-brand-black"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-black">
              Institucional
            </h3>
            <ul className="mt-4 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-gray transition-colors hover:text-brand-black"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-black">
              Contato
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-brand-gray">
              <li>
                <a href={`https://wa.me/${storeInfo.whatsappLink}`} className="hover:text-brand-black">
                  {storeInfo.whatsapp}
                </a>
              </li>
              <li>{storeInfo.address}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 border-t border-neutral-200 pt-8">
          {paymentMethods.map((method) => (
            <span
              key={method}
              className="border border-neutral-300 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-brand-gray"
            >
              {method}
            </span>
          ))}
        </div>

        <div className="mt-8 text-center text-[11px] text-brand-gray">
          <p>
            Copyright {storeInfo.name} — {storeInfo.cnpj} — {new Date().getFullYear()}. Todos os
            direitos reservados.
          </p>
        </div>
      </Container>
    </footer>
  );
}
