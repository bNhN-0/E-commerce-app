"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      //  LOGIN
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return alert(error.message);

      alert("Logged in!");
      router.push("/");
    } else {
      //  SIGNUP
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return alert(error.message);

      //  sync into Prisma User table
      if (data.user) {
        const res = await fetch("/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: data.user.id,
            email,
            name,
          }),
        });

        if (!res.ok) {
          console.error("Failed to create user in Prisma", await res.json());
        } else {
          console.log("User synced with Prisma ");
        }
      }

      alert("Signed up! Please log in.");
      setIsLogin(true); // switch to login form
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">{isLogin ? "Login" : "Sign Up"}</h1>

      <form onSubmit={handleAuth} className="space-y-3">
        {!isLogin && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="border p-2 w-full"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2 w-full"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 w-full"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        {isLogin ? "Don't have an account?" : "Already registered?"}{" "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-500 underline"
        >
          {isLogin ? "Sign Up" : "Login"}
        </button>
      </p>
    </div>
  );
}
