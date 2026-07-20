"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: { email: "", senha: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    const parsed = loginSchema.safeParse(data);

    if (!parsed.success) {
      return;
    }

    setServerError(null);

    try {
      await login(parsed.data);
      router.replace("/admin");
    } catch (error: unknown) {
      setServerError(
        error instanceof Error ? error.message : "Não foi possível entrar. Tente novamente.",
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-brand-black">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@grifres.com"
          className={cn(
            "w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-black outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-black focus:ring-1 focus:ring-brand-black",
            errors.email && "border-red-400 focus:border-red-500 focus:ring-red-500",
          )}
          {...register("email", { required: true })}
        />
        {errors.email?.message ? (
          <p className="mt-1 text-xs text-red-500" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="senha" className="mb-1.5 block text-sm font-medium text-brand-black">
          Senha
        </label>
        <div className="relative">
          <input
            id="senha"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className={cn(
              "w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 pr-12 text-sm font-medium text-brand-black outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-black focus:ring-1 focus:ring-brand-black",
              errors.senha && "border-red-400 focus:border-red-500 focus:ring-red-500",
            )}
            {...register("senha", { required: true, minLength: 8 })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-brand-black"
            aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.senha?.message ? (
          <p className="mt-1 text-xs text-red-500" role="alert">
            {errors.senha.message}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <p
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
          role="alert"
        >
          {serverError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-black px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50"
      >
        <LogIn className="h-4 w-4" />
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
