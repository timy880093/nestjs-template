import { TransactionDto } from '../dto/transaction.dto';
import {
  PaymentCategoryEnum,
  PaymentProviderEnum,
  PaymentStatusEnum,
} from '../../../third-party/payment/dto/payment.enum';
import { PaymentReq } from '../../../third-party/payment/dto/payment.req';
import { EzpayReq } from '../../../third-party/invoice/dto/ezpay.req';
import { PaymentRes } from '../../../third-party/payment/dto/payment.res';
import { UpdatePaymentReq } from '../../../third-party/payment/dto/update-payment.req';
import { TicketUtil } from './ticket.util';
import { CancelPaymentRes } from '../../../third-party/payment/dto/cancel-payment.res';

export class TransactionBuilder {
  static buildFirstTransaction(
    orderId: number,
    couponId: number,
    giftCardId: number,
    orderNo: string,
    username: string,
    userUuid: string,
    email: string,
    phone: string,
    serviceFee: number,
    additionalFee: number,
    totalAmount: number,
    isPriority: boolean,
    paymentProvider: PaymentProviderEnum,
    remark: string,
    serviceDescription: string,
    freeDescription: string,
  ): TransactionDto {
    const product = totalAmount ? serviceDescription : freeDescription;
    const status =
      (totalAmount || 0) > 0
        ? PaymentStatusEnum.UNPAID
        : PaymentStatusEnum.SUCCESSFUL;
    return new TransactionDto({
      tradeNo: TicketUtil.genTradeNo(orderNo, PaymentCategoryEnum.SERVICE_FEE),
      orderId,
      couponId,
      giftCardId,
      product: product,
      serviceFee,
      additionalFee,
      totalAmount,
      username,
      userUuid,
      email,
      phone,
      status,
      isPriority,
      paymentProvider,
      remark,
      category: PaymentCategoryEnum.SERVICE_FEE,
    });
  }

  static buildSecondTransaction(
    orderId: number,
    orderNo: string,
    username: string,
    userUuid: string,
    email: string,
    phone: string,
    totalAmount: number,
    paymentProvider: PaymentProviderEnum,
    successDescription: string,
  ): TransactionDto {
    return new TransactionDto({
      tradeNo: TicketUtil.genTradeNo(orderNo, PaymentCategoryEnum.SUCCESS_FEE),
      orderId,
      product: successDescription,
      totalAmount,
      username: username || email,
      userUuid,
      email,
      phone,
      status: PaymentStatusEnum.UNPAID,
      paymentProvider,
      category: PaymentCategoryEnum.SUCCESS_FEE,
    });
  }

  static buildPaymentReq(
    transactionDto: TransactionDto,
    totalAmountPaid: number,
    timesPaid: number,
    returnURL?: string,
  ): PaymentReq {
    return new PaymentReq({
      tradeNo: transactionDto.tradeNo,
      totalAmount: transactionDto.totalAmount,
      product: transactionDto.product,
      username: transactionDto.username,
      userUuid: transactionDto.userUuid,
      email: transactionDto.email,
      phone: transactionDto.phone,
      totalAmountPaid,
      timesPaid,
      returnURL,
    });
  }

  static buildUpdatePaymentReq(
    transactionDto: TransactionDto,
    totalAmountPaid: number,
    timesPaid: number,
  ): UpdatePaymentReq {
    return new UpdatePaymentReq({
      token: transactionDto.token,
      providerTradeNo: transactionDto.providerTradeNo,
      tradeNo: transactionDto.tradeNo,
      totalAmount: transactionDto.totalAmount,
      product: transactionDto.product,
      username: transactionDto.username,
      userUuid: transactionDto.userUuid,
      email: transactionDto.email,
      phone: transactionDto.phone,
      totalAmountPaid,
      timesPaid,
    });
  }

  static buildEzpayReq(transactionDto: {
    email: string;
    tradeNo: string;
    totalAmount: number;
    product: string;
    username: string;
  }): EzpayReq {
    const { email, tradeNo, totalAmount, product, username } = transactionDto;
    return new EzpayReq({
      ...EzpayReq.buildB2CEmail(email),
      MerchantOrderNo: tradeNo,
      TotalAmt: totalAmount,
      ItemName: product,
      BuyerName: username,
    }).calculate();
  }

  static buildUpdatedTransaction(paymentRes: PaymentRes): TransactionDto {
    return new TransactionDto({
      status: paymentRes.status,
      paymentMethod: paymentRes.paymentMethod,
      payAt: paymentRes.payAt,
      tradeNo: paymentRes.tradeNo,
      providerTradeNo: paymentRes.providerTradeNo,
      token: paymentRes.token,
      error: paymentRes.error,
    });
  }

  static buildTransactionForCancel(cancelPaymentRes: CancelPaymentRes) {
    return new TransactionDto({
      status: cancelPaymentRes.isSuccessful() && PaymentStatusEnum.CANCELED,
    });
  }
}
