// app/admin/login/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react"; // <-- Tambahkan import ini


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // <-- Untuk pesan error
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Reset error setiap kali submit
    
    // Panggil fungsi signIn bawaan NextAuth
    const result = await signIn("credentials", {
      email: email,
      password: password,
      redirect: false, // Jangan redirect otomatis agar kita bisa tangkap error
    });

    if (result?.error) {
      setError(result.error); // Tampilkan error (misal: "Password salah!")
    } else {
      // Jika sukses, arahkan ke dashboard admin
      router.push("/admin"); 
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-slate-100">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800">Admin Area</h2>
        </div>

        {/* Tampilkan pesan error jika ada */}
        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* ... (Input Email & Password sama seperti sebelumnya) ... */}
          
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border px-4 py-2" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border px-4 py-2" required />
          </div>

          <button type="submit" className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-[#ffffff] font-medium hover:bg-primary-hover">
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}