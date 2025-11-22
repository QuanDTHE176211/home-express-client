"use client"

import { useState, useEffect } from "react"
import { Home, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-md" : "bg-white/98 backdrop-blur-sm shadow-sm",
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-black to-gray-800 shadow-lg">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black leading-none tracking-tight">HOME EXPRESS</span>
              <span className="text-[10px] font-normal text-gray-600">Dịch vụ chuyển nhà</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {t.nav.login}
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="ml-2">
                {t.nav.getStarted}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t py-4 md:hidden">
            <div className="flex flex-col gap-2">
              <Link href="/login" className="w-full">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  {t.nav.login}
                </Button>
              </Link>
              <Link href="/signup" className="w-full">
                <Button size="sm" className="w-full">
                  {t.nav.getStarted}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
