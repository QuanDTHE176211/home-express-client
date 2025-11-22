"use client"

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-gray-400">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center justify-between gap-6 border-b border-gray-800 pb-6 md:flex-row">
          <div className="text-lg font-extrabold text-white">HOME EXPRESS</div>
          <div className="flex flex-col items-center gap-4 text-sm md:flex-row md:gap-8">
            <a href="#" className="transition-colors hover:text-white">
              Quyền riêng tư
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Điều khoản
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Hỗ trợ
            </a>
          </div>
        </div>
        <div className="pt-6 text-center text-sm text-gray-600">
          &copy; 2025 Home Express. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  )
}
