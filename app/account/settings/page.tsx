"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [notify, setNotify] = useState(true);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
          />
          Receive email notifications
        </label>
      </div>

      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Save Settings
      </button>
    </div>
  );
}
