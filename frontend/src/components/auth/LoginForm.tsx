"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

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
      setServerError(error instanceof Error ? error.message : "Não foi possível entrar. Tente novamente.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="admin@grifres.com"
        error={errors.email?.message}
        {...register("email", { required: true })}
      />

      <div className="relative">
        <Input
          label="Senha"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.senha?.message}
          {...register("senha", { required: true, minLength: 8 })}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-9 text-xs font-medium uppercase tracking-wide text-brand-gray hover:text-brand-black"
        >
          {showPassword ? "Ocultar" : "Exibir"}
        </button>
      </div>

      {serverError && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
