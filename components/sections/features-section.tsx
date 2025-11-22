"use client"

import { User, Truck, Shield, Clock, Star, Headphones } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export function FeaturesSection() {
  const mainFeatures = [
    {
      icon: User,
      title: "Dành cho Khách hàng",
      description:
        "Đặt lịch chuyển nhà, theo dõi tiến độ và quản lý việc chuyển nhà một cách dễ dàng với giao diện thân thiện",
      gradient: "from-[color:var(--color-accent-green)] to-[color:var(--color-accent-green-dark)]",
      href: "/signup?role=customer",
    },
    {
      icon: Truck,
      title: "Dành cho Đội chuyển nhà",
      description: "Quản lý lịch trình, nhận đơn hàng và phát triển dịch vụ của bạn với hệ thống quản lý hiện đại",
      gradient: "from-blue-500 to-blue-600",
      href: "/signup?role=transport",
    },
  ]

  const highlights = [
    {
      icon: Shield,
      title: "Bảo hiểm toàn diện",
      description: "Đảm bảo an toàn cho tài sản",
    },
    {
      icon: Clock,
      title: "Đúng giờ cam kết",
      description: "Không lo trễ hẹn",
    },
    {
      icon: Star,
      title: "Đội ngũ chuyên nghiệp",
      description: "Được đào tạo bài bản",
    },
    {
      icon: Headphones,
      title: "Hỗ trợ 24/7",
      description: "Luôn sẵn sàng phục vụ",
    },
  ]

  return (
    <section className="relative bg-gradient-to-b from-white via-gray-50 to-white py-24 md:py-32">
      {/* Section Header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-accent-green)]/20 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-2.5 shadow-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-accent-green)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-accent-green-dark)]">
              Nền tảng toàn diện
            </span>
          </div>
          <h2 className="mb-6 text-balance text-[clamp(2.5rem,5vw,3.5rem)] font-black leading-tight tracking-tight text-black">
            Dành cho tất cả mọi người
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-gray-600">
            Giải pháp hoàn chỉnh cho mọi nhu cầu chuyển nhà của bạn với công nghệ hiện đại
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="mx-auto mb-16 grid max-w-6xl gap-8 md:grid-cols-2">
          {mainFeatures.map((feature, index) => (
            <Link key={index} href={feature.href}>
              <Card className="group relative overflow-hidden border-2 border-gray-100 bg-white transition-all duration-500 hover:-translate-y-3 hover:border-transparent hover:shadow-2xl">
                <div
                  className={`absolute left-0 top-0 h-2 w-full origin-left scale-x-0 bg-gradient-to-r ${feature.gradient} transition-transform duration-500 group-hover:scale-x-100`}
                />

                <CardContent className="relative p-10">
                  <div
                    className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-4 text-2xl font-black text-black">{feature.title}</h3>
                  <p className="text-base leading-relaxed text-gray-600">{feature.description}</p>

                  <div className="mt-6 flex items-center gap-2 text-sm font-bold text-gray-400 transition-all group-hover:gap-4 group-hover:text-black">
                    Tìm hiểu thêm
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((highlight, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:border-gray-300 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 transition-all group-hover:bg-gradient-to-br group-hover:from-[color:var(--color-accent-green)] group-hover:to-[color:var(--color-accent-green-dark)]">
                <highlight.icon className="h-6 w-6 text-gray-700 transition-colors group-hover:text-white" />
              </div>
              <h4 className="mb-2 font-bold text-black">{highlight.title}</h4>
              <p className="text-sm text-gray-600">{highlight.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
