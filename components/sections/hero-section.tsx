"use client"

import { ArrowRight, PlayCircle, Zap, Radio, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-[color:var(--color-accent-green)]/10 to-transparent blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-500/10 to-transparent blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left Content */}
          <div className="animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
              <CheckCircle className="h-4 w-4 text-[color:var(--color-accent-green)]" />
              <span className="text-sm font-semibold text-gray-700">Đánh giá 4.9/5 từ 10,000+ khách hàng</span>
            </div>

            <h1 className="mb-6 text-balance text-[clamp(2.5rem,6vw,4rem)] font-black leading-[1.05] tracking-tight text-black">
              Dịch vụ chuyển nhà
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[color:var(--color-accent-green)] to-[color:var(--color-accent-green-dark)] bg-clip-text text-transparent">
                  Nhanh chóng & An toàn
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="12"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 10C50 5 100 2 150 3C200 4 250 7 298 10"
                    stroke="oklch(0.7 0.15 150)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mb-10 max-w-xl text-pretty text-lg leading-relaxed text-gray-600">
              Nền tảng chuyển nhà hàng đầu cho khách hàng, đội ngũ chuyển nhà và quản trị viên. Đặt lịch chuyển nhà,
              theo dõi tiến độ và trải nghiệm dịch vụ chuyển nhà tốt nhất.
            </p>

            {/* CTA Buttons */}
            <div className="mb-12 flex flex-wrap gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-14 gap-2 px-8 text-base font-bold shadow-lg shadow-[color:var(--color-accent-green)]/20 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[color:var(--color-accent-green)]/30"
                >
                  Đặt lịch ngay
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="h-14 gap-2 border-2 border-gray-300 bg-white px-8 text-base font-bold transition-all hover:-translate-y-1 hover:border-gray-400 hover:bg-gray-50"
              >
                <PlayCircle className="h-5 w-5" />
                Tìm hiểu thêm
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="group relative pl-6">
                <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-gradient-to-b from-[color:var(--color-accent-green)] to-[color:var(--color-accent-green-dark)]" />
                <div className="mb-2 text-5xl font-black leading-none text-black transition-transform group-hover:scale-105">
                  10K+
                </div>
                <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">Khách hàng tin tưởng</div>
              </div>
              <div className="group relative pl-6">
                <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-600" />
                <div className="mb-2 text-5xl font-black leading-none text-black transition-transform group-hover:scale-105">
                  500+
                </div>
                <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">Đội ngũ chuyển nhà</div>
              </div>
              <div className="group relative pl-6">
                <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-gradient-to-b from-purple-500 to-purple-600" />
                <div className="mb-2 text-5xl font-black leading-none text-black transition-transform group-hover:scale-105">
                  99.9%
                </div>
                <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">Thời gian hoạt động</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="animate-fade-in-up flex justify-center lg:justify-end">
            <div className="group relative max-w-lg transition-transform duration-700 hover:-translate-y-3">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[color:var(--color-accent-green)]/20 to-blue-500/20 blur-2xl transition-opacity group-hover:opacity-75" />

              <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-gray-200/50">
                <Image
                  src="/professional-moving-service-truck-with-team-loadin.jpg"
                  alt="Xe chuyển nhà Home Express với đội ngũ chuyên nghiệp"
                  width={500}
                  height={650}
                  className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 500px"
                />
              </div>

              {/* Badge Overlays */}
              <div className="animate-slide-in absolute left-6 top-6 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-md transition-transform hover:scale-105">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--color-accent-green)] to-[color:var(--color-accent-green-dark)] shadow-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-black">Chuyển nhà nhanh</div>
                  <div className="text-xs text-gray-500">Trong 24 giờ</div>
                </div>
              </div>

              <div className="animate-slide-in absolute bottom-6 right-6 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-md transition-transform hover:scale-105">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Radio className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-black">Theo dõi trực tiếp</div>
                  <div className="text-xs text-gray-500">Real-time GPS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
