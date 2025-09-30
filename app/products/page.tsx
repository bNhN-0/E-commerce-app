"use client";

import { Suspense } from "react";
import ProductsPageInner from "./ProductsPageInner";

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageInner />
    </Suspense>
  );
}
