"use client";

import { useEffect, useState } from "react";

type Order = {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  items: {
    id: number;
    quantity: number;
    product: { name: string };
  }[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Loading orders...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      {orders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="border rounded p-4 mb-4">
            <p className="font-semibold">Order #{order.id}</p>
            <p>Total: ${order.total}</p>
            <p>Status: {order.status}</p>
            <ul className="list-disc ml-6 mt-2">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.product.name} × {item.quantity}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
