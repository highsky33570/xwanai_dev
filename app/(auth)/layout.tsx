import type React from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="h-screen w-full overflow-hidden bg-content1">{children}</div>
}
