"use client";

import { Suspense } from "react";
import ProductsPageInner from "./ProductsPageInner";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading products...</div>}>
      <ProductsPageInner />
    </Suspense>
  );
}
