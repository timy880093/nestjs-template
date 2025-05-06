export enum MailLogStatus {
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
}

export enum MailLogCategory {
  RESET_PASSWORD = 'reset-password',
  VERIFY_EMAIL = 'verify-email',
  CRAWLER_BOT_FAILED = 'crawler-bot-failed',
  PROGRESS_PROCESSING = 'progress-processing',
  PROGRESS_SUBMITTED = 'progress-submitted',
  PROGRESS_APPROVED = 'progress-approved',
  PROGRESS_PARTIAL_APPROVED = 'progress-partial-approved',
  PROGRESS_REJECTED = 'progress-rejected',
  PROGRESS_INCOMPLETE = 'progress-incomplete',
  // REFUND = 'refund',
  GIFT_CARD = 'gift-card',
  EDM = 'edm',
  OTHER = 'other',
}
