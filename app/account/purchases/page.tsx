"use client";

import { useEffect, useState } from "react";

export default function PurchasesPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data));
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
              <span className="font-semibold">Order #{o.id}</span> –{" "}
              <span className="text-gray-500">{o.status}</span>
            </p>
            <p>Total: ${o.total}</p>
            <ul className="list-disc ml-6 text-sm text-gray-600">
              {o.items.map((it: any) => (
                <li key={it.id}>
                  {it.product.name} × {it.quantity}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
