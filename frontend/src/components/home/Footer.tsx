import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { storeInfo } from "@/lib/mock-data";

const footerLinks = [
  { label: "Produtos", href: "#produtos" },
  { label: "Categorias", href: "#categorias" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
];

const socialLinks = [
  { label: "Instagram", href: "#", icon: InstagramIcon },
  { label: "Facebook", href: "#", icon: FacebookIcon },
  { label: "WhatsApp", href: "#", icon: WhatsAppIcon },
];

export function Footer() {
  return (
    <footer id="contato" className="border-t border-neutral-200 bg-brand-white">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl font-bold uppercase tracking-[0.3em] text-brand-black">
              {storeInfo.name}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-brand-gray">
              {storeInfo.description}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-black">
              Links
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.map((link) => (
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
              Contato
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-brand-gray">
              <li>WhatsApp: {storeInfo.whatsapp}</li>
              <li>{storeInfo.address}</li>
              <li>{storeInfo.hours}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-black">
              Redes sociais
            </h3>
            <div className="mt-4 flex gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-brand-black transition-colors hover:border-brand-black hover:bg-brand-light"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-200 pt-6 text-center text-xs text-brand-gray">
          <p>
            Copyright {storeInfo.name} — {new Date().getFullYear()}. Todos os direitos reservados.
          </p>
        </div>
      </Container>
    </footer>
  );
}
