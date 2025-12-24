"use client";

import { useRouter, useSearchParams } from "next/navigation"

export default function LogoLeft() {
  const router = useRouter();
  return (
    <div className="space-y-1 mb-8 cursor-pointer" onClick={() => router.push("/")}>
      <img
        src="/logo.svg"
        alt="Logo"
        className="h-12 w-auto rounded-md"
      />
      <div className="text-6xl font-bold" style={{ fontFamily: '"Novecento WideBold", sans-serif' }}>
        XWAN.<span className="text-[#eb7020]" style={{ fontFamily: 'sans-serif' }}>AI</span>
      </div>
      <div className="text-black text-3xl">玄</div>
    </div>
  )
}