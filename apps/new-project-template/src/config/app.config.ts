export default () => ({
  env: process.env.NODE_ENV,
  envFile: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env',
  isLocalTest: ['local'].includes(process.env.NODE_ENV),
  isDev: ['development'].includes(process.env.NODE_ENV),
  logLevel: process.env.LOG_LEVEL || 'info',
  port: process.env.PORT,
  ticketApiKey: process.env.TICKET_API_KEY,
  systemReceiver: process.env.SYSTEM_RECEIVER || 'ticketappeal.law@gmail.com',
  bccReceiver: process.env.BCC_RECEIVER
    ? process.env.BCC_RECEIVER.split(',')
    : ['suodata.bcc@gmail.com'],
});
