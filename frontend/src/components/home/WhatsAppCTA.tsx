import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WhatsAppIcon } from "@/components/ui/Icons";

export function WhatsAppCTA() {
  return (
    <section
      className="bg-brand-black py-16 text-brand-white sm:py-20"
      aria-label="Contato via WhatsApp"
    >
      <Container className="text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-whatsapp text-brand-white">
            <WhatsAppIcon className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider sm:text-3xl">
            Fale conosco pelo WhatsApp
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-300 sm:text-base">
            Tire suas dúvidas, consulte tamanhos e receba atendimento personalizado da nossa equipe.
            Estamos prontos para ajudar você a encontrar a peça ideal.
          </p>
          <div className="mt-8">
            <Button variant="whatsapp" size="lg">
              <WhatsAppIcon className="h-5 w-5" />
              Falar no WhatsApp
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
