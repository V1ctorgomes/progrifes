import type { ReactNode } from "react";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import type { Category } from "@/types/category";

interface StoreLayoutProps {
  children: ReactNode;
  categories: Category[];
}

export function StoreLayout({ children, categories }: StoreLayoutProps) {
  return (
    <>
      <Navbar categories={categories} />
      {children}
      <Footer />
    </>
  );
}
