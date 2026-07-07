import Link from "next/link";

const modules = [
  { title: "Banners", href: "/admin/banners", ready: true },
  { title: "Categorias", href: "/admin/categorias", ready: true },
  { title: "Produtos", href: "/admin/produtos", ready: true },
  { title: "Atributos", href: "/admin/atributos", ready: true },
  { title: "Pedidos", href: "/admin/pedidos", ready: true },
  { title: "Clientes", href: "/admin/clientes", ready: true },
  { title: "Fornecedores", href: "/admin/fornecedores", ready: true },
  { title: "Compras", href: "/admin/compras", ready: true },
  { title: "Estoque", href: "/admin/estoque", ready: true },
  { title: "Financeiro", href: "/admin/financeiro", ready: false },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
        Dashboard
      </h1>
      <p className="text-brand-gray">
        Bem-vindo à área administrativa do ERP Comercial Grifres.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="rounded border border-neutral-200 p-4 transition-colors hover:border-brand-black"
          >
            <p className="font-medium text-brand-black">{module.title}</p>
            <p className="mt-1 text-sm text-brand-gray">
              {module.ready ? "Disponível" : "Em desenvolvimento"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
