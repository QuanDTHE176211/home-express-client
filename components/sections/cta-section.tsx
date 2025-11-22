"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, MessageCircle } from "lucide-react"
import Link from "next/link"

export function CtaSection() {
  return (
    <section className="relative my-24 overflow-hidden md:my-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black via-gray-900 to-black p-12 shadow-2xl md:p-16 lg:p-20">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-[color:var(--color-accent-green)] opacity-20 blur-3xl" />
            <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-blue-500 opacity-20 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-accent-green)]" />
              <span className="text-sm font-bold text-white">Ưu đãi đặc biệt</span>
            </div>

            <h2 className="mb-6 text-balance text-[clamp(2.5rem,6vw,4rem)] font-black leading-tight tracking-tight text-white">
              Sẵn sàng chuyển nhà với{" "}
              <span className="bg-gradient-to-r from-[color:var(--color-accent-green)] to-emerald-400 bg-clip-text text-transparent">
                Home Express?
              </span>
            </h2>
            <p className="mb-12 text-pretty text-lg leading-relaxed text-gray-300 md:text-xl">
              Tham gia cùng hàng nghìn khách hàng đã tin tưởng và trải nghiệm dịch vụ chuyển nhà tốt nhất trên thị
              trường
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-14 gap-2 bg-white px-8 text-base font-bold text-black shadow-xl transition-all hover:-translate-y-1 hover:bg-gray-100 hover:shadow-2xl"
                >
                  Đặt lịch ngay
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 gap-2 border-2 border-white/30 bg-white/5 px-8 text-base font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/10"
                >
                  <MessageCircle className="h-5 w-5" />
                  Liên hệ tư vấn
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 border-t border-white/10 pt-8">
              <div className="text-center">
                <div className="text-2xl font-black text-white">10,000+</div>
                <div className="text-sm text-gray-400">Khách hàng hài lòng</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-black text-white">4.9/5</div>
                <div className="text-sm text-gray-400">Đánh giá trung bình</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-black text-white">24/7</div>
                <div className="text-sm text-gray-400">Hỗ trợ khách hàng</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
