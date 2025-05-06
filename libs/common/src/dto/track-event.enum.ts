export enum TrackEventEnum {
  APPEAL_ENTRY = 'appealEntry', //進入申訴頁面
  NOTICE_ENTRY = 'noticeEntry', //進入注意事項
  CLICK_CREATE_TICKET = 'clickCreateTicket', //點擊新增罰單
  CLICK_UPDATE_TICKET = 'clickUpdateTicket', //點擊補齊罰單
  CLICK_PAYMENT = 'clickPayment', //點擊繳費
  PROXY_SEARCH_TICKET = 'proxySearchTicket', //罰單代查
  PROXY_SEARCH_TICKET_BROWSER_ENTRY = 'proxySearchTicketBrowserEntry', //罰單代查進入次數
  PROXY_SEARCH_TICKET_BROWSER_USAGE = 'proxySearchTicketBrowserUsage', //罰單代查使用者數
  PROXY_SEARCH_TICKET_ADD_OWNER = 'proxySearchTicketAddOwner', //罰單代查增加車主數
  PROXY_SEARCH_TICKET_BROWSER_LINE_ENTRY = 'proxySearchTicketBrowserLineEntry', // line 罰單代查進入次數
  PROXY_SEARCH_TICKET_BROWSER_LINE_CTA = 'proxySearchTicketBrowserLineCta', // line 罰單代查使用者數
}
