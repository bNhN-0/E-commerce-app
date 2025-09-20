"use client";

import { useState, useEffect } from "react";

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

  useEffect(() => {
    fetch("/api/addresses")
      .then((res) => res.json())
      .then((data) => setAddresses(data))
      .finally(() => setLoading(false));
  }, []);

  const addAddress = async () => {
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "John Doe",
        street: "123 Main St",
        city: "Bangkok",
        postalCode: "10110",
        country: "Thailand",
      }),
    });
    const newAddr = await res.json();
    setAddresses((prev) => [...prev, newAddr]);
  };

  if (loading) return <p className="p-4">Loading addresses...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Addresses</h1>

      <button
        onClick={addAddress}
        className="bg-green-600 text-white px-4 py-2 mb-4 rounded"
      >
        + Add Address
      </button>

      {addresses.length === 0 ? (
        <p>No addresses yet.</p>
      ) : (
        addresses.map((a) => (
          <div key={a.id} className="border p-4 mb-2 rounded">
            <p>{a.fullName}</p>
            <p>
              {a.street}, {a.city}, {a.state} {a.postalCode}
            </p>
            <p>{a.country}</p>
            <p>{a.phone}</p>
          </div>
        ))
      )}
    </div>
  );
}
