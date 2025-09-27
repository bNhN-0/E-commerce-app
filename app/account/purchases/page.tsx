"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: number;
  quantity: number;
  product: { id: number; name: string } | null;
  unitPrice?: number | null;
};

type Order = {
  id: number;
  status?: string;
  total?: number;
  items: OrderItem[];
  createdAt?: string;
};

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null;

function normalizeOrders(raw: unknown): Order[] {
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray((raw as UnknownRecord).data)
    ? ((raw as UnknownRecord).data as unknown[])
    : [];

  return list.map((o): Order => {
    const rec = (isRecord(o) ? o : {}) as UnknownRecord;

    const itemsRaw: unknown[] = Array.isArray(rec.items) ? (rec.items as unknown[]) : [];
    const items: OrderItem[] = itemsRaw.map((it) => {
      const ir = (isRecord(it) ? it : {}) as UnknownRecord;

      const pRec = isRecord(ir.product) ? (ir.product as UnknownRecord) : undefined;
      const product = pRec
        ? {
            id: Number(pRec.id ?? 0),
            name: String(pRec.name ?? "Product"),
          }
        : null;

      return {
        id: Number(ir.id ?? 0),
        quantity: Number(ir.quantity ?? 0),
        unitPrice:
          typeof ir.unitPrice === "number"
            ? ir.unitPrice
            : ir.unitPrice != null
            ? Number(ir.unitPrice)
            : null,
        product,
      };
    });

    const total =
      typeof rec.total === "number" ? rec.total : rec.total != null ? Number(rec.total) : undefined;

    return {
      id: Number(rec.id ?? 0),
      status: typeof rec.status === "string" ? rec.status : undefined,
      total,
      createdAt: typeof rec.createdAt === "string" ? rec.createdAt : undefined,
      items,
    };
  });
}

export default function PurchasesPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data = (await res.json()) as unknown;
        setOrders(normalizeOrders(data));
      } catch {
        setOrders([]);
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Purchases</h1>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="border p-4 mb-3 rounded shadow">
            <p>
              <span className="font-semibold">Order #{o.id}</span>{" "}
              <span className="text-gray-500">— {o.status ?? "Processing"}</span>
            </p>
            <p>Total: ${Number(o.total ?? 0).toFixed(2)}</p>
            <ul className="list-disc ml-6 text-sm text-gray-600">
              {o.items.map((it) => (
                <li key={it.id}>
                  {it.product?.name ?? "Product"} × {it.quantity}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
