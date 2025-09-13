import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // works if RLS disabled
);

export async function POST(req: Request) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        name: body.name,
        description: body.description,
        price: body.price,
        image: body.image,
        category: body.category,
      },
    ])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: data });
}
