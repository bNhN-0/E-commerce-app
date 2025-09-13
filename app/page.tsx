// app/page.tsx
import ProductCard from "./components/ProductCard";
import { supabaseServer } from "../app/lib/supabaseServer";
export default async function Home() {
  // Fetch products from Supabase
  const { data: products, error } = await supabaseServer
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Supabase error:", error);
    return <div className="text-red-500 text-center mt-20">Error loading products: {error.message}</div>;
  }

  if (!products || products.length === 0) {
    return <div className="text-gray-500 text-center mt-20">No products found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">ShopMaster Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}