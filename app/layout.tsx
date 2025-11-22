import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { LanguageProvider } from "@/contexts/language-context"
import { WebSocketProviderWrapper } from "@/components/providers/websocket-provider-wrapper"
import { ErrorBoundary } from "@/components/error-boundary"
import { OfflineDetector } from "@/components/offline-detector"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://home-express.vercel.app"),
  title: "Home Express - Dịch vụ chuyển nhà chuyên nghiệp",
  description:
    "Nền tảng chuyển nhà hàng đầu cho khách hàng, đội ngũ chuyển nhà và quản trị viên. Đặt lịch chuyển nhà, theo dõi tiến độ và trải nghiệm dịch vụ chuyển nhà tốt nhất.",
  generator: "v0.app",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Home Express",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Home Express - Dịch vụ chuyển nhà chuyên nghiệp",
    description: "Đặt lịch nhanh, theo dõi tiến độ và trải nghiệm dịch vụ chuyển nhà tốt nhất.",
    images: [
      {
        url: "/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "Home Express - Dịch vụ chuyển nhà",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Home Express - Dịch vụ chuyển nhà chuyên nghiệp",
    description: "Dịch vụ chuyển nhà nhanh chóng & an toàn",
    images: ["/og-home.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <head>
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`font-sans antialiased ${geistSans.variable} ${geistMono.variable}`}>
        <ErrorBoundary>
          <OfflineDetector />
          <LanguageProvider>
            <AuthProvider>
              <WebSocketProviderWrapper>
                <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
              </WebSocketProviderWrapper>
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
