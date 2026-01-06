"use client";

import Link from "next/link";

export default function LogoLeft() {
  return (
    <Link href="/" className="space-y-1 ">
      {/* <img
        src="/logo.svg"
        alt="Logo"
        className="h-12 w-auto rounded-md"
      /> */}
      <div className="pt-6 text-6xl font-bold pb-8" style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700 }}>
        XWAN.<span className="text-[#eb7020]" style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700 }}>AI</span>
      </div>
      {/* <div className="text-black text-3xl">玄</div> */}
    </Link>
  )
}