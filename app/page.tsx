import { HeroSection } from "@/components/sections/hero-section"
import { FeaturesSection } from "@/components/sections/features-section"
import { CtaSection } from "@/components/sections/cta-section"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Home Express",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://home-express.vercel.app",
    image: "/og-home.jpg",
    description: "Dịch vụ chuyển nhà nhanh chóng & an toàn.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "10000",
    },
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-green)]"
      >
        Bỏ qua tới nội dung chính
      </a>

      <Navbar />

      <main id="main" className="min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <CtaSection />
      </main>

      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  )
}
