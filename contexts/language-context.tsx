/**
 * Language Context Module
 *
 * Provides global language state management and translations for the entire application.
 * Supports Vietnamese (vi) and English (en) with localStorage persistence.
 *
 * Features:
 * - Global language state accessible from any component
 * - Automatic localStorage persistence
 * - Type-safe translations
 * - Comprehensive translation coverage for all pages
 *
 * @module contexts/language-context
 */

"use client"

import { createContext, useContext, type ReactNode } from "react"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Supported languages */
type Language = "vi"

/**
 * Complete translation structure for the application
 * Organized by page/section for easy maintenance
 */
interface Translations {
  // Navigation translations
  nav: {
    home: string
    features: string
    pricing: string
    contact: string
    login: string
    getStarted: string
  }
  // Hero section translations
  hero: {
    title: string
    subtitle: string
    bookNow: string
    learnMore: string
    stat1Label: string
    stat2Label: string
    stat3Label: string
    badge1: string
    badge2: string
  }
  features: {
    title: string
    subtitle: string
    customer: string
    customerTitle: string
    customerFeature1: string
    customerFeature2: string
    customerFeature3: string
    customerFeature4: string
    mover: string
    moverTitle: string
    moverFeature1: string
    moverFeature2: string
    moverFeature3: string
    moverFeature4: string
    highlight1Title: string
    highlight1Desc: string
    highlight2Title: string
    highlight2Desc: string
    highlight3Title: string
    highlight3Desc: string
    highlight4Title: string
    highlight4Desc: string
  }
  cta: {
    title: string
    subtitle: string
    button: string
    trust1: string
    trust2: string
    trust3: string
  }
  footer: {
    description: string
    product: string
    features: string
    pricing: string
    testimonials: string
    company: string
    about: string
    careers: string
    contact: string
    support: string
    helpCenter: string
    terms: string
    privacy: string
    rights: string
  }
  login: {
    welcomeBack: string
    subtitle: string
    emailPlaceholder: string
    passwordPlaceholder: string
    rememberMe: string
    forgotPassword: string
    signIn: string
    signingIn: string
    or: string
    continueWithGoogle: string
    noAccount: string
    signUp: string
    featuresTitle: string
    featuresDesc: string
    feature1: string
    feature2: string
    feature3: string
  }
  signup: {
    title: string
    step1Title: string
    step1Desc: string
    step2Title: string
    step2Desc: string
    step3Title: string
    step3Desc: string
    companyStepTitle: string
    companyStepDesc: string
    securityStepTitle: string
    securityStepDesc: string
    customerRole: string
    customerDesc: string
    transportRole: string
    transportDesc: string
    fullName: string
    fullNamePlaceholder: string
    email: string
    emailPlaceholder: string
    phone: string
    phonePlaceholder: string
    companyName: string
    companyNamePlaceholder: string
    businessLicense: string
    businessLicensePlaceholder: string
    taxCode: string
    taxCodePlaceholder: string
    address: string
    addressPlaceholder: string
    city: string
    cityPlaceholder: string
    district: string
    districtPlaceholder: string
    ward: string
    wardPlaceholder: string
    optionalLabel: string
    password: string
    confirmPassword: string
    passwordStrength: string
    passwordStrong: string
    passwordMedium: string
    passwordWeak: string
    minLength: string
    uppercase: string
    lowercase: string
    number: string
    next: string
    back: string
    complete: string
    registering: string
    haveAccount: string
    signIn: string
    progressTitle: string
    progressStep1: string
    progressStep1Desc: string
    progressStep2: string
    progressStep2Desc: string
    progressStep3: string
    progressStep3Desc: string
    progressStepCompany: string
    progressStepCompanyDesc: string
    progressStepSecurity: string
    progressStepSecurityDesc: string
    roleSelectionError: string
    genericError: string
  }
  forgotPassword: {
    title: string
    subtitle: string
    emailLabel: string
    emailPlaceholder: string
    sendButton: string
    sending: string
    backToLogin: string
    back: string
    successTitle: string
    successMessage: string
    noEmailTitle: string
    tip1: string
    tip2: string
    tip3: string
    securityTitle: string
    securityDesc: string
    feature1Title: string
    feature1Desc: string
    feature2Title: string
    feature2Desc: string
    feature3Title: string
    feature3Desc: string
  }
  resetPassword: {
    title: string
    subtitle: string
    newPassword: string
    confirmPassword: string
    passwordHint: string
    resetButton: string
    resetting: string
    successMessage: string
  }
  verifyEmail: {
    title: string
    verifying: string
    successSubtitle: string
    errorSubtitle: string
    pleaseWait: string
    successTitle: string
    nextStepsTitle: string
    step1: string
    step2: string
    step3: string
    goToLogin: string
    errorTitle: string
    troubleshootTitle: string
    tip1: string
    tip2: string
    tip3: string
    signUpAgain: string
    featuresTitle: string
    featuresDesc: string
    feature1: string
    feature2: string
    feature3: string
  }
}

// ============================================================================
// TRANSLATION DATA
// ============================================================================

/**
 * Complete translation dictionary for all supported languages
 * Add new translations here when adding new features
 */
const translations: Record<Language, Translations> = {
  vi: {
    nav: {
      home: "Trang chủ",
      features: "Tính năng",
      pricing: "Bảng giá",
      contact: "Liên hệ",
      login: "Đăng nhập",
      getStarted: "Bắt đầu",
    },
    hero: {
      title: "Dịch vụ chuyển nhà chuyên nghiệp",
      subtitle: "Giải pháp vận chuyển nhanh chóng, an toàn và đáng tin cậy cho mọi nhu cầu chuyển nhà của bạn",
      bookNow: "Đặt lịch ngay",
      learnMore: "Tìm hiểu thêm",
      stat1Label: "Khách hàng hài lòng",
      stat2Label: "Chuyến hàng thành công",
      stat3Label: "Đánh giá 5 sao",
      badge1: "Giao hàng nhanh",
      badge2: "Vận chuyển an toàn",
    },
    features: {
      title: "Tính năng nổi bật",
      subtitle: "Mọi thứ bạn cần cho trải nghiệm chuyển nhà hoàn hảo",
      customer: "Khách hàng",
      customerTitle: "Dành cho khách hàng",
      customerFeature1: "Đặt lịch dễ dàng",
      customerFeature2: "Theo dõi thời gian thực",
      customerFeature3: "Thanh toán an toàn",
      customerFeature4: "Hỗ trợ 24/7",
      mover: "Nhà vận chuyển",
      moverTitle: "Dành cho nhà vận chuyển",
      moverFeature1: "Quản lý đơn hàng",
      moverFeature2: "Tối ưu lộ trình",
      moverFeature3: "Theo dõi thu nhập",
      moverFeature4: "Đánh giá khách hàng",
      highlight1Title: "Giao hàng nhanh chóng",
      highlight1Desc: "Cam kết giao hàng đúng hẹn với đội ngũ chuyên nghiệp",
      highlight2Title: "Vận chuyển an toàn",
      highlight2Desc: "Bảo hiểm toàn diện cho mọi chuyến hàng",
      highlight3Title: "Giá cả minh bạch",
      highlight3Desc: "Không phí ẩn, báo giá rõ ràng trước khi đặt",
      highlight4Title: "Hỗ trợ 24/7",
      highlight4Desc: "Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn",
    },
    cta: {
      title: "Sẵn sàng chuyển nhà?",
      subtitle: "Tham gia cùng hàng nghìn khách hàng hài lòng đã tin tưởng Home Express",
      button: "Đặt lịch ngay",
      trust1: "Bảo hiểm toàn diện",
      trust2: "Đội ngũ chuyên nghiệp",
      trust3: "Giá cả cạnh tranh",
    },
    footer: {
      description: "Giải pháp chuyển nhà chuyên nghiệp, nhanh chóng và đáng tin cậy",
      product: "Sản phẩm",
      features: "Tính năng",
      pricing: "Bảng giá",
      testimonials: "Đánh giá",
      company: "Công ty",
      about: "Về chúng tôi",
      careers: "Tuyển dụng",
      contact: "Liên hệ",
      support: "Hỗ trợ",
      helpCenter: "Trung tâm trợ giúp",
      terms: "Điều khoản",
      privacy: "Bảo mật",
      rights: "Bản quyền thuộc về Home Express. Tất cả quyền được bảo lưu.",
    },
    login: {
      welcomeBack: "Chào mừng trở lại",
      subtitle: "Đăng nhập để tiếp tục tài khoản của bạn",
      emailPlaceholder: "Địa chỉ Email",
      passwordPlaceholder: "Mật khẩu",
      rememberMe: "Ghi nhớ đăng nhập",
      forgotPassword: "Quên mật khẩu?",
      signIn: "Đăng nhập",
      signingIn: "Đang đăng nhập...",
      or: "HOẶC",
      continueWithGoogle: "Tiếp tục với Google",
      noAccount: "Chưa có tài khoản?",
      signUp: "Đăng ký",
      featuresTitle: "Quản lý chuyến hàng của bạn",
      featuresDesc: "Theo dõi, quản lý và tối ưu hóa hoạt động vận chuyển của bạn tại một nơi",
      feature1: "Giao hàng nhanh",
      feature2: "Vận chuyển an toàn",
      feature3: "Hỗ trợ 24/7",
    },
    signup: {
      title: "Đăng ký",
      step1Title: "Chọn vai trò",
      step1Desc: "Chọn loại tài khoản phù hợp với bạn",
      step2Title: "Thông tin cá nhân",
      step2Desc: "Nhập thông tin cơ bản của bạn",
      step3Title: "Bảo mật",
      step3Desc: "Bảo vệ tài khoản của bạn",
      companyStepTitle: "Thông tin doanh nghiệp",
      companyStepDesc: "Cung cấp thông tin pháp lý và địa chỉ doanh nghiệp",
      securityStepTitle: "Bảo mật tài khoản",
      securityStepDesc: "Tạo mật khẩu mạnh để bảo vệ tài khoản",
      customerRole: "Khách hàng",
      customerDesc: "Đặt lịch và theo dõi chuyển nhà",
      transportRole: "Nhà cung cấp dịch vụ",
      transportDesc: "Quản lý dịch vụ vận chuyển",
      fullName: "Họ và tên",
      fullNamePlaceholder: "Nhập họ và tên",
      email: "Email",
      emailPlaceholder: "Nhập email",
      phone: "Số điện thoại",
      phonePlaceholder: "Nhập số điện thoại",
      companyName: "Tên doanh nghiệp",
      companyNamePlaceholder: "Nhập tên doanh nghiệp",
      businessLicense: "Giấy phép kinh doanh",
      businessLicensePlaceholder: "Nhập số giấy phép",
      taxCode: "Mã số thuế",
      taxCodePlaceholder: "Nhập mã số thuế",
      address: "Địa chỉ doanh nghiệp",
      addressPlaceholder: "Nhập địa chỉ",
      city: "Tỉnh/Thành phố",
      cityPlaceholder: "Chọn tỉnh/thành phố",
      district: "Quận/Huyện",
      districtPlaceholder: "Chọn quận/huyện",
      ward: "Phường/Xã",
      wardPlaceholder: "Chọn phường/xã",
      optionalLabel: "không bắt buộc",
      password: "Mật khẩu",
      confirmPassword: "Xác nhận mật khẩu",
      passwordStrength: "Độ mạnh mật khẩu",
      passwordStrong: "Mạnh",
      passwordMedium: "Trung bình",
      passwordWeak: "Yếu",
      minLength: "Ít nhất 8 ký tự",
      uppercase: "Chữ hoa",
      lowercase: "Chữ thường",
      number: "Số",
      next: "Tiếp theo",
      back: "Quay lại",
      complete: "Hoàn tất đăng ký",
      registering: "Đang đăng ký...",
      haveAccount: "Đã có tài khoản?",
      signIn: "Đăng nhập",
      progressTitle: "Tiến trình đăng ký",
      progressStep1: "Chọn vai trò",
      progressStep1Desc: "Chọn loại tài khoản",
      progressStep2: "Thông tin cá nhân",
      progressStep2Desc: "Thông tin cơ bản của bạn",
      progressStep3: "Bảo mật",
      progressStep3Desc: "Bảo vệ tài khoản của bạn",
      progressStepCompany: "Thông tin doanh nghiệp",
      progressStepCompanyDesc: "Chi tiết pháp lý và địa chỉ",
      progressStepSecurity: "Bảo mật",
      progressStepSecurityDesc: "Bảo vệ tài khoản của bạn",
      roleSelectionError: "Vui lòng chọn loại tài khoản",
      genericError: "Đăng ký thất bại. Vui lòng thử lại.",
    },
    forgotPassword: {
      title: "Quên mật khẩu?",
      subtitle: "Đừng lo lắng! Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu",
      emailLabel: "Địa chỉ Email",
      emailPlaceholder: "Nhập email của bạn",
      sendButton: "Gửi link đặt lại mật khẩu",
      sending: "Đang gửi...",
      backToLogin: "Quay lại đăng nhập",
      back: "Quay lại",
      successTitle: "Email đã được gửi!",
      successMessage: "Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu.",
      noEmailTitle: "Không nhận được email?",
      tip1: "Kiểm tra thư mục spam hoặc junk mail",
      tip2: "Đảm bảo email bạn nhập là chính xác",
      tip3: "Chờ vài phút trước khi thử lại",
      securityTitle: "Bảo mật tài khoản của bạn",
      securityDesc: "Chúng tôi cam kết bảo vệ thông tin cá nhân và đảm bảo an toàn cho tài khoản của bạn",
      feature1Title: "Email xác thực",
      feature1Desc: "Link đặt lại mật khẩu được gửi trực tiếp đến email của bạn",
      feature2Title: "Link có thời hạn",
      feature2Desc: "Link chỉ có hiệu lực trong 1 giờ để đảm bảo an toàn",
      feature3Title: "Mã hóa an toàn",
      feature3Desc: "Mật khẩu mới được mã hóa và bảo mật tuyệt đối",
    },
    resetPassword: {
      title: "Đặt lại mật khẩu",
      subtitle: "Nhập mật khẩu mới cho tài khoản của bạn",
      newPassword: "Mật khẩu mới",
      confirmPassword: "Xác nhận mật khẩu mới",
      passwordHint: "Ít nhất 8 ký tự, bao gồm chữ và số",
      resetButton: "Đặt lại mật khẩu",
      resetting: "Đang đặt lại...",
      successMessage: "Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...",
    },
    verifyEmail: {
      title: "Xác thực Email",
      verifying: "Đang xác thực email của bạn...",
      successSubtitle: "Email của bạn đã được xác thực thành công",
      errorSubtitle: "Không thể xác thực email của bạn",
      pleaseWait: "Vui lòng đợi trong khi chúng tôi xác thực email của bạn...",
      successTitle: "Xác thực thành công!",
      nextStepsTitle: "Bước tiếp theo",
      step1: "Đăng nhập vào tài khoản của bạn",
      step2: "Hoàn thiện thông tin hồ sơ",
      step3: "Bắt đầu sử dụng dịch vụ của chúng tôi",
      goToLogin: "Đi đến trang đăng nhập",
      errorTitle: "Xác thực thất bại",
      troubleshootTitle: "Cách khắc phục",
      tip1: "Kiểm tra xem link có đầy đủ và chính xác không",
      tip2: "Token có thể đã hết hạn - vui lòng đăng ký lại",
      tip3: "Liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn",
      signUpAgain: "Đăng ký lại",
      featuresTitle: "Xác thực an toàn",
      featuresDesc: "Chúng tôi bảo vệ tài khoản của bạn với quy trình xác thực email an toàn",
      feature1: "Bảo mật tài khoản",
      feature2: "Xác thực nhanh chóng",
      feature3: "Thông báo email",
    },
  },
}

// ============================================================================
// CONTEXT DEFINITION
// ============================================================================

/**
 * Language context value type
 */
interface LanguageContextType {
  /** Current language translations */
  t: Translations
}

/** Language context instance */
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Language Provider Component
 *
 * Wraps the application to provide global translations.
 * Must be placed in the root layout to be accessible throughout the app.
 *
 * @param children - Child components to wrap
 *
 * @example
 * // In app/layout.tsx
 * <LanguageProvider>
 *   <YourApp />
 * </LanguageProvider>
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  return <LanguageContext.Provider value={{ t: translations.vi }}>{children}</LanguageContext.Provider>
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access language context
 *
 * Provides Vietnamese translations for the application.
 * Must be used within a LanguageProvider.
 *
 * @returns Language context value
 * @throws Error if used outside LanguageProvider
 *
 * @example
 * function MyComponent() {
 *   const { t } = useLanguage()
 *   return <h1>{t.hero.title}</h1>
 * }
 */
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error("useLanguage must be used within LanguageProvider")
  return context
}
