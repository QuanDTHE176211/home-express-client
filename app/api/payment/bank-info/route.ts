import { NextResponse } from "next/server"

export async function GET() {
  // In production, this should come from backend API or secure config
  const bankInfo = {
    bank: "Vietcombank",
    accountNumber: "1234567890",
    accountName: "CONG TY TNHH HOME EXPRESS",
    branch: "Chi nhánh TP.HCM",
  }

  return NextResponse.json(bankInfo)
}
