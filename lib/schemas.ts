/**
 * Zod Validation Schemas Module
 *
 * Provides type-safe validation schemas for forms using Zod
 * Integrates with react-hook-form for robust form validation
 *
 * @module lib/schemas
 */

import { z } from "zod"
import { normalizeVNPhone, isValidVNPhone } from "@/utils/phone"

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Enhanced password validation schema
 * Matches the upgraded password policy in validators.ts
 */
const passwordSchema = z
  .string()
  .min(10, "Mật khẩu phải có ít nhất 10 ký tự")
  .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
  .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
  .regex(/\d/, "Mật khẩu phải có ít nhất 1 chữ số")
  .regex(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt")
  .refine((password) => !/(.)\1{3,}/.test(password), {
    message: "Mật khẩu không được có quá 3 ký tự giống nhau liên tiếp",
  })

/**
 * Vietnamese phone number validation schema
 * Accepts various formats: 0901234567, +84 901234567, 09-012-34567
 * Normalizes to standard 10-digit format starting with 0
 */
const phoneSchema = z
  .string()
  .min(1, "Số điện thoại là bắt buộc")
  .transform(normalizeVNPhone)
  .pipe(z.string().refine(isValidVNPhone, "Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10 chữ số)"))

/**
 * Signup form validation schema - Step 2 (Personal Info)
 */
export const signupStep2Schema = z.object({
  fullName: z
    .string()
    .min(1, "Họ tên là bắt buộc")
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên không được quá 100 ký tự"),
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  phone: phoneSchema,
})

export type SignupStep2FormData = z.infer<typeof signupStep2Schema>

/**
 * Signup form validation schema - Step 3 (Security)
 */
export const signupStep3Schema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })

export type SignupStep3FormData = z.infer<typeof signupStep3Schema>

/**
 * Signup form validation schema - Transport company details
 */
export const signupTransportCompanySchema = z.object({
  companyName: z
    .string()
    .min(2, "Tên doanh nghiệp cần ít nhất 2 ký tự")
    .max(255, "Tên doanh nghiệp không được vượt quá 255 ký tự"),
  businessLicenseNumber: z
    .string()
    .min(10, "Giấy phép kinh doanh phải có 10 hoặc 13 chữ số")
    .max(13, "Giấy phép kinh doanh phải có 10 hoặc 13 chữ số")
    .regex(/^\d{10}(\d{3})?$/, "Giấy phép kinh doanh chỉ gồm chữ số"),
  taxCode: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{10}(-\d{3})?$/.test(value), {
      message: "Mã số thuế không hợp lệ",
    }),
  address: z.string().min(5, "Địa chỉ phải có ít nhất 5 ký tự"),
  city: z.string().min(2, "Tỉnh/Thành phố là bắt buộc"),
  district: z.string().optional(),
  ward: z.string().optional(),
})

export type SignupTransportCompanyFormData = z.infer<typeof signupTransportCompanySchema>

/**
 * Complete signup form data (all steps combined)
 */
export type SignupFormData = {
  role: "customer" | "transport"
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}
