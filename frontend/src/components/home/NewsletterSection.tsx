"use client";

import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function NewsletterSection() {
  return (
    <section className="bg-brand-white py-10 sm:py-12" aria-label="Newsletter">
      <Container className="max-w-xl text-center">
        <h2 className="font-display text-lg font-bold uppercase tracking-wider text-brand-black sm:text-xl">
          Cadastre seu e-mail
        </h2>
        <p className="mt-2 text-sm text-brand-gray">
          Fique por dentro das novidades e lançamentos exclusivos.
        </p>
        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <Input
            type="email"
            placeholder="Seu melhor e-mail"
            aria-label="E-mail para newsletter"
            className="flex-1 text-left"
          />
          <Button type="submit" className="flex-shrink-0">
            Cadastrar
          </Button>
        </form>
      </Container>
    </section>
  );
}
