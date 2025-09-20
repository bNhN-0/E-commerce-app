"use client";

import { useEffect, useState } from "react";

type PaymentMethod = {
  id: number;
  type: string;
  provider?: string;
  last4?: string;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    type: "card",
    provider: "",
    last4: "",
  });

  useEffect(() => {
    fetch("/api/payments")
      .then((res) => res.json())
      .then((data) => setPayments(data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    await fetch(`/api/payments/${id}`, { method: "DELETE" });
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newPayment = await res.json();
      setPayments((prev) => [newPayment, ...prev]);
      setForm({ type: "card", provider: "", last4: "" });
    }
  };

  if (loading) return <p>Loading payment methods...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Payment Methods</h1>

      {payments.length === 0 && <p className="mb-4">No payment methods yet. Add one below.</p>}

      {payments.map((p) => (
        <div key={p.id} className="border p-4 mb-2 rounded flex justify-between">
          <div>
            <p className="font-semibold">{p.type}</p>
            {p.provider && <p>{p.provider}</p>}
            {p.last4 && <p>•••• {p.last4}</p>}
          </div>
          <button
            onClick={() => handleDelete(p.id)}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Delete
          </button>
        </div>
      ))}

      {/* Add Payment Form */}
      <form onSubmit={handleAdd} className="mt-6 space-y-2 border-t pt-4">
        <h2 className="font-bold">Add New Payment Method</h2>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border p-2 w-full"
        >
          <option value="card">Card</option>
          <option value="bank">Bank</option>
          <option value="paypal">PayPal</option>
        </select>
        <input
          placeholder="Provider (Visa, MasterCard, BDO Bank)"
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          placeholder="Last 4 digits"
          value={form.last4}
          onChange={(e) => setForm({ ...form, last4: e.target.value })}
          className="border p-2 w-full"
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded">Add Payment</button>
      </form>
    </div>
  );
}
