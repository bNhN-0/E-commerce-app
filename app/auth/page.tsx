"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else {
      alert("Check your email for confirmation!");
      router.push("/");
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      alert("Logged in successfully!");
      router.push("/");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">🔑 Login / Signup</h1>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 mb-2 w-64" />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 mb-2 w-64" />
      <div className="flex gap-2">
        <button onClick={handleSignup} disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded">Sign Up</button>
        <button onClick={handleLogin} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">Log In</button>
      </div>
    </div>
  );
}
