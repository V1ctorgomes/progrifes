export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
        Dashboard
      </h1>
      <p className="text-brand-gray">
        Bem-vindo à área administrativa do ERP Comercial Grifres. Os módulos internos
        serão disponibilizados nas próximas etapas.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          "Produtos",
          "Categorias",
          "Pedidos",
          "Clientes",
          "Estoque",
          "Financeiro",
        ].map((module) => (
          <div
            key={module}
            className="rounded border border-dashed border-neutral-300 p-4 text-sm text-brand-gray"
          >
            {module} — em desenvolvimento
          </div>
        ))}
      </div>
    </div>
  );
}
