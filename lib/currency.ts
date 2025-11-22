export function formatVND(n: number | string) {
  const num = typeof n === "string" ? Number(n) : n
  if (!isFinite(num as number)) return "—"
  return (num as number).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  })
}
