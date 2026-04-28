"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";

interface User {
  id: number;
  name: string;
  login: string;
  avatarUrl: string | null;
}

const DUMMY_AVATAR = "https://www.gravatar.com/avatar/?d=mp&s=80";

export default function Nav() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api<User>("/user/me")
      .then((data) => setUser(data))
      .catch((err) => {
        console.warn("/user/me failed:", err);
        setUser(null);
      });
  }, []);

  const handleLogin = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
    window.location.href = `${apiBase}/auth/`;
  };

  return (
    <nav className="p-4 border-b flex justify-between items-center bg-white">
      <div className="font-bold text-xl">GitHub Tracker</div>
      <div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="font-medium">{user.name || user.login}</span>
            <img
              src={user.avatarUrl || DUMMY_AVATAR}
              alt={user.login}
              className="w-10 h-10 rounded-full border"
            />
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Login with GitHub
          </button>
        )}
      </div>
    </nav>
  );
}
