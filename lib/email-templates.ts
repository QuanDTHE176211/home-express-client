/**
 * Email Template Utilities
 *
 * This file contains email template structures and utilities for the notification system.
 * These templates are used by the backend email service.
 */

export interface EmailTemplate {
  subject: string
  preheader: string
  heading: string
  body: string
  actionUrl?: string
  actionText?: string
}

export const EMAIL_TEMPLATES = {
  // Review Request Email
  REVIEW_REQUEST: (data: {
    customerName: string
    transportName: string
    bookingId: number
    completedDate: string
    reviewUrl: string
  }): EmailTemplate => ({
    subject: "Đánh giá chuyến đi của bạn với Home Express",
    preheader: `Chia sẻ trải nghiệm của bạn với ${data.transportName}`,
    heading: `Xin chào ${data.customerName}!`,
    body: `
      Cảm ơn bạn đã sử dụng dịch vụ của Home Express. 
      Chuyến đi #${data.bookingId} với ${data.transportName} đã hoàn thành vào ${data.completedDate}.
      
      Chúng tôi rất mong nhận được đánh giá của bạn để cải thiện chất lượng dịch vụ.
    `,
    actionUrl: data.reviewUrl,
    actionText: "Đánh giá ngay",
  }),

  // New Review Received
  NEW_REVIEW: (data: {
    recipientName: string
    reviewerName: string
    rating: number
    comment: string
    reviewUrl: string
  }): EmailTemplate => ({
    subject: "Bạn nhận được đánh giá mới",
    preheader: `${data.reviewerName} đã đánh giá ${data.rating} sao`,
    heading: `Xin chào ${data.recipientName}!`,
    body: `
      ${data.reviewerName} đã để lại đánh giá ${data.rating} sao cho bạn:
      
      "${data.comment}"
      
      Hãy phản hồi để thể hiện sự quan tâm của bạn với khách hàng.
    `,
    actionUrl: data.reviewUrl,
    actionText: "Xem và phản hồi",
  }),

  // Booking Created
  BOOKING_CREATED: (data: {
    customerName: string
    bookingId: number
    pickupLocation: string
    deliveryLocation: string
    preferredDate: string
    bookingUrl: string
  }): EmailTemplate => ({
    subject: `Đơn đặt chuyển nhà #${data.bookingId} đã được tạo`,
    preheader: "Chúng tôi đang tìm nhà vận chuyển phù hợp cho bạn",
    heading: `Xin chào ${data.customerName}!`,
    body: `
      Đơn đặt chuyển nhà #${data.bookingId} của bạn đã được tạo thành công.
      
      Thông tin chuyến đi:
      - Điểm đón: ${data.pickupLocation}
      - Điểm đến: ${data.deliveryLocation}
      - Ngày dự kiến: ${data.preferredDate}
      
      Chúng tôi sẽ thông báo khi có báo giá từ các nhà vận chuyển.
    `,
    actionUrl: data.bookingUrl,
    actionText: "Xem chi tiết",
  }),

  // Quotation Received
  QUOTATION_RECEIVED: (data: {
    customerName: string
    bookingId: number
    transportName: string
    price: number
    quotationUrl: string
  }): EmailTemplate => ({
    subject: `Báo giá mới cho đơn #${data.bookingId}`,
    preheader: `${data.transportName} đã gửi báo giá ${data.price.toLocaleString("vi-VN")} VNĐ`,
    heading: `Xin chào ${data.customerName}!`,
    body: `
      ${data.transportName} đã gửi báo giá cho đơn đặt chuyển nhà #${data.bookingId} của bạn.
      
      Giá: ${data.price.toLocaleString("vi-VN")} VNĐ
      
      Hãy xem chi tiết và chấp nhận báo giá nếu phù hợp.
    `,
    actionUrl: data.quotationUrl,
    actionText: "Xem báo giá",
  }),

  // Quotation Accepted
  QUOTATION_ACCEPTED: (data: {
    transportName: string
    bookingId: number
    customerName: string
    price: number
    bookingUrl: string
  }): EmailTemplate => ({
    subject: `Báo giá của bạn đã được chấp nhận - Đơn #${data.bookingId}`,
    preheader: `${data.customerName} đã chấp nhận báo giá ${data.price.toLocaleString("vi-VN")} VNĐ`,
    heading: `Xin chào ${data.transportName}!`,
    body: `
      Chúc mừng! ${data.customerName} đã chấp nhận báo giá của bạn cho đơn #${data.bookingId}.
      
      Giá đã thỏa thuận: ${data.price.toLocaleString("vi-VN")} VNĐ
      
      Vui lòng chuẩn bị và liên hệ với khách hàng để xác nhận lịch trình.
    `,
    actionUrl: data.bookingUrl,
    actionText: "Xem chi tiết đơn hàng",
  }),

  // Job Started
  JOB_STARTED: (data: {
    customerName: string
    bookingId: number
    transportName: string
    startTime: string
    trackingUrl: string
  }): EmailTemplate => ({
    subject: `Chuyến đi #${data.bookingId} đã bắt đầu`,
    preheader: `${data.transportName} đang trên đường đến`,
    heading: `Xin chào ${data.customerName}!`,
    body: `
      Chuyến đi #${data.bookingId} của bạn đã bắt đầu lúc ${data.startTime}.
      
      ${data.transportName} đang trên đường đến điểm đón.
      
      Bạn có thể theo dõi tiến độ theo thời gian thực.
    `,
    actionUrl: data.trackingUrl,
    actionText: "Theo dõi chuyến đi",
  }),

  // Job Completed
  JOB_COMPLETED: (data: {
    customerName: string
    bookingId: number
    transportName: string
    completedTime: string
    reviewUrl: string
  }): EmailTemplate => ({
    subject: `Chuyến đi #${data.bookingId} đã hoàn thành`,
    preheader: "Cảm ơn bạn đã sử dụng dịch vụ Home Express",
    heading: `Xin chào ${data.customerName}!`,
    body: `
      Chuyến đi #${data.bookingId} với ${data.transportName} đã hoàn thành lúc ${data.completedTime}.
      
      Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của Home Express.
      
      Hãy chia sẻ trải nghiệm của bạn để giúp chúng tôi cải thiện dịch vụ.
    `,
    actionUrl: data.reviewUrl,
    actionText: "Đánh giá chuyến đi",
  }),

  // Payment Received
  PAYMENT_RECEIVED: (data: {
    customerName: string
    bookingId: number
    amount: number
    paymentMethod: string
    receiptUrl: string
  }): EmailTemplate => ({
    subject: `Thanh toán thành công - Đơn #${data.bookingId}`,
    preheader: `Đã nhận ${data.amount.toLocaleString("vi-VN")} VNĐ`,
    heading: `Xin chào ${data.customerName}!`,
    body: `
      Thanh toán cho đơn #${data.bookingId} đã được xử lý thành công.
      
      Số tiền: ${data.amount.toLocaleString("vi-VN")} VNĐ
      Phương thức: ${data.paymentMethod}
      
      Cảm ơn bạn đã sử dụng dịch vụ của Home Express.
    `,
    actionUrl: data.receiptUrl,
    actionText: "Xem hóa đơn",
  }),
}

/**
 * Generate plain text version of email
 */
export function generatePlainText(template: EmailTemplate): string {
  let text = `${template.heading}\n\n${template.body}\n\n`

  if (template.actionUrl && template.actionText) {
    text += `${template.actionText}: ${template.actionUrl}\n\n`
  }

  text += "---\nHome Express - Dịch vụ chuyển nhà chuyên nghiệp\n"

  return text
}

/**
 * Email preferences helper
 */
export const EMAIL_PREFERENCES = {
  BOOKING_UPDATES: "email_booking_updates",
  QUOTATIONS: "email_quotations",
  PAYMENTS: "email_payments",
  REVIEWS: "email_reviews",
  MARKETING: "email_marketing",
} as const

export type EmailPreferenceKey = (typeof EMAIL_PREFERENCES)[keyof typeof EMAIL_PREFERENCES]
