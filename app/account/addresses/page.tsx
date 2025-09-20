"use client";

import { useEffect, useState } from "react";

type Address = {
  id: number;
  fullName: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for editing
  const [form, setForm] = useState<Address | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetch("/api/addresses")
      .then((res) => res.json())
      .then((data) => setAddresses(data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    setForm(null);
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form) return;

    if (isEditing) {
      // Update existing
      const res = await fetch(`/api/addresses/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        setAddresses([updated]); // only one address allowed
        setIsEditing(false);
        setForm(null);
      }
    } else {
      // Add new
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newAddress = await res.json();
        setAddresses([newAddress]); // replace
        setForm(null);
      }
    }
  };

  if (loading) return <p>Loading addresses...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Address</h1>

      {addresses.length === 0 && (
        <p className="mb-4">No address yet. Please add one below.</p>
      )}

      {addresses.map((a) => (
        <div key={a.id} className="border p-4 mb-2 rounded flex justify-between">
          <div>
            <p className="font-semibold">{a.fullName}</p>
            <p>
              {a.street}, {a.city}, {a.state} {a.postalCode}
            </p>
            <p>{a.country}</p>
            {a.phone && <p>{a.phone}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setForm(a);
                setIsEditing(true);
              }}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(a.id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* Show form only if no address OR editing */}
      {(addresses.length === 0 || isEditing) && (
        <form onSubmit={handleSave} className="mt-6 space-y-2 border-t pt-4">
          <h2 className="font-bold">
            {isEditing ? "Edit Address" : "Add Address"}
          </h2>
          <input
            placeholder="Full Name"
            value={form?.fullName || ""}
            onChange={(e) =>
              setForm({ ...(form || {}), fullName: e.target.value } as Address)
            }
            className="border p-2 w-full"
            required
          />
          <input
            placeholder="Street"
            value={form?.street || ""}
            onChange={(e) =>
              setForm({ ...(form || {}), street: e.target.value } as Address)
            }
            className="border p-2 w-full"
            required
          />
          <input
            placeholder="City"
            value={form?.city || ""}
            onChange={(e) =>
              setForm({ ...(form || {}), city: e.target.value } as Address)
            }
            className="border p-2 w-full"
            required
          />
          <input
            placeholder="State"
            value={form?.state || ""}
            onChange={(e) =>
              setForm({ ...(form || {}), state: e.target.value } as Address)
            }
            className="border p-2 w-full"
          />
          <input
            placeholder="Postal Code"
            value={form?.postalCode || ""}
            onChange={(e) =>
              setForm({ ...(form || {}), postalCode: e.target.value } as Address)
            }
            className="border p-2 w-full"
            required
          />
          <input
            placeholder="Country"
            value={form?.country || ""}
            onChange={(e) =>
              setForm({ ...(form || {}), country: e.target.value } as Address)
            }
            className="border p-2 w-full"
            required
          />
          <input
            placeholder="Phone"
            value={form?.phone || ""}
            onChange={(e) =>
              setForm({ ...(form || {}), phone: e.target.value } as Address)
            }
            className="border p-2 w-full"
          />
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            {isEditing ? "Save Changes" : "Add Address"}
          </button>
        </form>
      )}
    </div>
  );
}
