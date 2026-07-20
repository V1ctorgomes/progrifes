import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { storeInfo } from "@/lib/mock-data";

export function WhatsAppCTA() {
  const whatsappHref = `https://wa.me/${storeInfo.whatsappLink}`;

  return (
    <section
      className="bg-[#F8F9FA] py-10 sm:py-14"
      aria-label="Contato via WhatsApp"
    >
      <Container>
        <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-100 bg-white px-6 py-12 text-center shadow-sm sm:px-10 sm:py-14">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-whatsapp text-white shadow-sm">
            <WhatsAppIcon className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-brand-black sm:text-3xl">
            Fale conosco pelo WhatsApp
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-neutral-500 sm:text-base">
            Tire suas dúvidas, consulte tamanhos e receba atendimento personalizado da nossa equipe.
            Estamos prontos para ajudar você a encontrar a peça ideal.
          </p>
          <div className="mt-8">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <Button variant="whatsapp" size="lg">
                <WhatsAppIcon className="h-5 w-5" />
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
