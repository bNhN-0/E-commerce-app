"use client";

import { useState } from "react";

export default function PaymentsPage() {
  const [cards, setCards] = useState<string[]>(["Visa •••• 4242"]);

  const addCard = () => {
    setCards((prev) => [...prev, "Mastercard •••• 8888"]);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Payment Methods</h1>

      <button
        onClick={addCard}
        className="bg-green-600 text-white px-4 py-2 mb-4 rounded"
      >
        + Add Payment Method
      </button>

      {cards.length === 0 ? (
        <p>No saved payment methods.</p>
      ) : (
        <ul className="list-disc pl-6">
          {cards.map((c, idx) => (
            <li key={idx}>{c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
