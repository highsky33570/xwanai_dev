
import type React from "react"
import type { Metadata } from "next"

import './globals.css'
import { Providers } from "./providers"
import { AppGlobalProvider } from "@/lib/context/GlobalContext"
import { Averia_Serif_Libre } from "next/font/google"
import { Suspense } from "react"
import { generateMetadata } from "@/lib/utils/seo"

export const metadata: Metadata = generateMetadata({
  language: "en",
})

const averiaSerifLibre = Averia_Serif_Libre({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-averia-serif-libre",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en">
      <body className={`${averiaSerifLibre.variable} antialiased`}
        style={{
          // backgroundImage: "url(/background.png)",
          // backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Providers>
          <AppGlobalProvider>
            <Suspense>
              {children}
            </Suspense>
          </AppGlobalProvider>
        </Providers>
      </body>
    </html>
  )
}
