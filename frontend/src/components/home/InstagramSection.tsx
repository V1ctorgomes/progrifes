import { Container } from "@/components/ui/Container";
import { InstagramIcon } from "@/components/ui/Icons";
import { storeInfo } from "@/lib/mock-data";

export function InstagramSection() {
  return (
    <section className="border-y border-neutral-200 bg-brand-light py-12 sm:py-16" aria-label="Instagram">
      <Container className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-300">
          <InstagramIcon className="h-6 w-6" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-brand-gray">
          {storeInfo.instagram}
        </p>
        <h2 className="mt-2 font-display text-xl font-bold uppercase tracking-wider text-brand-black sm:text-2xl">
          Estamos no Instagram
        </h2>
        <p className="mt-2 text-sm text-brand-gray">Siga-nos</p>
        <a
          href="#"
          className="mt-6 inline-block border border-brand-black px-8 py-2.5 text-xs font-medium uppercase tracking-widest text-brand-black transition hover:bg-brand-black hover:text-brand-white"
        >
          @{storeInfo.instagram}
        </a>
      </Container>
    </section>
  );
}
