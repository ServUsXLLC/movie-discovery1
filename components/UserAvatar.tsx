"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import Image from "next/image";

export default function UserAvatar() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-3">
        <Link 
          href="/login" 
          className="text-sm text-blue-600 hover:underline"
        >
          Login
        </Link>
        <Link 
          href="/register" 
          className="text-sm text-blue-600 hover:underline"
        >
          Register
        </Link>
        <Link 
          href="/admin" 
          className="text-sm text-red-600 hover:underline"
        >
          Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* User Avatar - Clickable to go to user page */}
      <Link href="/user" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300">
          {user.avatar ? (
            <Image 
              src={user.avatar} 
              alt={user.display_name || user.email} 
              fill 
              style={{ objectFit: "cover" }} 
            />
          ) : (
            <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
              {(user.display_name || user.email || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {user.display_name || user.email}
        </span>
      </Link>

      {/* Admin Link */}
      <div className="hidden md:flex items-center gap-2">
        <Link 
          href="/admin" 
          className="text-xs text-red-600 hover:underline"
        >
          Admin
        </Link>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
        title="Logout"
      >
        Logout
      </button>
    </div>
  );
}
