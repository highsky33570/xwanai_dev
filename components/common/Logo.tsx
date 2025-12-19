"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function Logo() {
  const router = useRouter();
  return (
    <div className="relative z-10 flex space-y-1 items-center max-h-24 ml-8 cursor-pointer py-6" onClick={() => router.push("/")}>
      <img src="/logo.svg" alt="Logo" className="h-12 w-auto rounded-md" />
      <div className="text-6xl font-bold hidden lg:block pl-3" style={{ fontFamily: '"Novecento WideBold", sans-serif' }}>
        XWAN.<span className="text-[#eb7020]" style={{ fontFamily: 'sans-serif' }}>IO</span>
      </div>
    </div>
  );
}
