const enableTask = process.env.ENABLE_TASK === 'true';
// console.log('enableTask: ', enableTask);
export default () => ({
  enableTask,
  checkBotCron: process.env.TASK_CHECK_BOT_CRON,
  notifyIncompleteCron:
    process.env.TASK_NOTIFY_INCOMPLETE_CRON || '0 0 12 * * *',
  reRecognizeTicketCron:
    process.env.TASK_RE_RECOGNIZE_TICKET_CRON || '0 0 5 * * *',
});
