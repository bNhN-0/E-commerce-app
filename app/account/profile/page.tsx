"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/user")
      .then((res) => res.json())
      .then((data) => setUser(data))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!user) return;
    await fetch("/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: user.name, phone: user.phone }),
    });
    alert("Profile updated!");
  };

  if (loading) return <p className="p-4">Loading profile...</p>;
  if (!user) return <p className="p-4 text-red-500">User not found</p>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>

      <input
        value={user.name || ""}
        onChange={(e) => setUser({ ...user, name: e.target.value })}
        placeholder="Name"
        className="border p-2 w-full mb-2"
      />
      <input
        value={user.phone || ""}
        onChange={(e) => setUser({ ...user, phone: e.target.value })}
        placeholder="Phone number"
        className="border p-2 w-full mb-2"
      />
      <input
        value={user.email || ""}
        disabled
        className="border p-2 w-full mb-2 bg-gray-100"
      />

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save
      </button>
    </div>
  );
}
