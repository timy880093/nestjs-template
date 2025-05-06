import * as process from 'node:process';

export default () => ({
  urgentDays: process.env.APP_URGENT_DAYS
    ? Number(process.env.APP_URGENT_DAYS)
    : 0,
  deadlineDays: process.env.APP_DEADLINE_DAYS
    ? Number(process.env.APP_DEADLINE_DAYS)
    : 0,
  continuousTicketIntervalMinutes: process.env
    .APP_CONTINUOUS_TICKET_INTERVAL_MINUTES
    ? Number(process.env.APP_CONTINUOUS_TICKET_INTERVAL_MINUTES)
    : 0,
  successFeeRate: process.env.APP_SUCCESS_FEE_RATE
    ? Number(process.env.APP_SUCCESS_FEE_RATE)
    : 0,
  secondPaymentStartDate: new Date(
    process.env.APP_SECOND_PAYMENT_START_DATE || '2024-11-29T08:00:00Z',
  ),
  successFeeRate2: process.env.APP_SUCCESS_FEE_RATE2
    ? Number(process.env.APP_SUCCESS_FEE_RATE2)
    : 0,
  secondPaymentStartDate2: new Date(
    process.env.APP_SECOND_PAYMENT_START_DATE2 || '2025-02-11T04:00:00Z',
  ),
});
