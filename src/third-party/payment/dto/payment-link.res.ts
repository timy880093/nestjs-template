export class PaymentLinkRes {
  url: string;
  html: string;

  constructor(dto: Partial<PaymentLinkRes>) {
    Object.assign(this, dto);
  }
}
