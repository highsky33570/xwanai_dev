"use client";

import { useRouter, useSearchParams } from "next/navigation"

export default function LogoLeft() {
  const router = useRouter();
  return (
    <div className="space-y-1 mb-8 cursor-pointer" onClick={() => router.push("/")}>
      {/* <img
        src="/logo.svg"
        alt="Logo"
        className="h-12 w-auto rounded-md"
      /> */}
      <div className="pt-6 text-6xl font-bold" style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700 }}>
        XWAN.<span className="text-[#eb7020]" style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700 }}>AI</span>
      </div>
      {/* <div className="text-black text-3xl">玄</div> */}
    </div>
  )
}