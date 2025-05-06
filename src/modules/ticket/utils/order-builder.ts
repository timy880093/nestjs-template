import { OrderDto } from '../dto/order.dto';
import { DateUtil } from '../../../common/util';
import { v4 as uuidv4 } from 'uuid';
import { ViolationFactTypeEnum } from '../enums/ticket.enum';

export class OrderBuilder {
  // 18 words, ezpay(invoice) limit 20 words, newebpay(payment) limit 32 words
  private static genOrderNo(): string {
    return `TA${DateUtil.twDayjs().format('YYYYMMDD')}${uuidv4().replace('-', '').slice(0, 5)}`;
  }

  // 自動建 orderNo
  static toCreate(dto: Partial<OrderDto>): OrderDto {
    const orderNo = dto?.orderNo ? dto.orderNo : this.genOrderNo();
    return new OrderDto({
      orderNo,
      ...dto,
    });
  }

  static toCreate2(
    userId: number,
    email: string,
    phone: string,
    violationFactType?: ViolationFactTypeEnum,
    violationFact?: string,
  ): OrderDto {
    const groupName =
      violationFactType &&
      (violationFactType === ViolationFactTypeEnum.OTHER
        ? violationFact
        : violationFactType);
    return this.toCreate({
      userId,
      groupName,
      email,
      phone,
    });
  }
}
