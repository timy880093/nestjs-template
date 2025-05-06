import {
  AfteeNotifyReq,
  AfteePreRegisterRes,
  AfteeReturnReq,
} from '../dto/aftee';
import { plainToInstance } from 'class-transformer';
import { CancelPaymentRes, PaymentRes, PaymentStatusEnum } from '../dto';
import { DateUtil } from '@app/common/util';
import { ApiStatusEnum } from '@app/common/dto/api-status.enum';
import * as crypto from 'crypto';

export class AfteeBuilder {
  static isAfteeResult(data: any) {
    return data.shop_transaction_no && data.authorization_result;
  }

  static buildPreRegisterRes(data: any): AfteePreRegisterRes {
    return plainToInstance(AfteePreRegisterRes, data);
  }

  static buildPaymentResForNotify(req: AfteeNotifyReq): PaymentRes {
    const {
      authorization_result,
      authorization_result_ng_reason,
      registration_datetime,
      shop_transaction_no,
      authentication_token,
      id,
    } = req;
    // const payAt = DateUtil.twDayjs(registration_datetime).toDate();
    const payAt = new Date();

    return new PaymentRes({
      status: req.parseStatus(),
      tradeNo: shop_transaction_no,
      providerTradeNo: id,
      token: authentication_token,
      error: req.parseError(),
      payAt,
    });
  }

  static buildPaymentResForReturn(result: AfteeReturnReq): PaymentRes {
    const status =
      result?.authorization_result?.toString() === '1'
        ? PaymentStatusEnum.SUCCESSFUL
        : PaymentStatusEnum.FAILED;

    return new PaymentRes({
      status,
      tradeNo: result.shop_transaction_no,
    });
  }

  static buildCancelPaymentRes({ refunds }: AfteeNotifyReq): CancelPaymentRes {
    const apiStatus = refunds ? ApiStatusEnum.SUCCESSFUL : ApiStatusEnum.FAILED;
    const { refund_datetime, amount_refund } = refunds;
    const canceledAt = DateUtil.twDayjs(refund_datetime).toDate();

    return new CancelPaymentRes({
      apiStatus,
      canceledAt,
      refundAmount: amount_refund,
    });
  }

  static parseChecksumData(data: any): any {
    const {
      shop_transaction_no,
      transaction_options,
      return_url,
      ...checksumData
    } = data;
    return checksumData;
  }

  static generateChecksum(data: any, shopSecretKey: string): string {
    // 1. 排序支付資料
    const sortedData = AfteeBuilder.sortObject(data);
    // 2. 連接所有值
    const concatenatedValues = AfteeBuilder.concatenateValues(sortedData);
    // 3. 加上 shop secret key
    const finalString = `${shopSecretKey},${concatenatedValues}`;
    // 4. 生成 SHA256 hash 值
    const hash = crypto.createHash('sha256').update(finalString).digest('hex');
    // 5. 生成 checksum (Base64 編碼)
    return Buffer.from(hash, 'hex').toString('base64');
  }

  // 排序物件的函數
  static sortObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(AfteeBuilder.sortObject);
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
          acc[key] = AfteeBuilder.sortObject(obj[key]);
          return acc;
        }, {});
    }
    return obj;
  }

  // 連接所有值的函數
  static concatenateValues(obj: any): string {
    const values = [];

    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        values.push(AfteeBuilder.concatenateValues(item));
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach((key) => {
        values.push(AfteeBuilder.concatenateValues(obj[key]));
      });
    } else {
      values.push(obj);
    }

    return values.join('');
  }
}
