import { plainToInstance } from 'class-transformer';
import { ProgressEnum } from '../enums/order.enum';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ErrorUtil } from '../../../common/util/error.util';
import { OrderDto } from './order.dto';
import { PaymentStatusEnum } from '../../../third-party/payment/dto/payment.enum';

export class OrderUpdateDto {
  @IsOptional()
  @IsEnum(ProgressEnum, {
    message: ErrorUtil.invalid('progress', 'must be a valid enum'),
  })
  progress: ProgressEnum;
  @IsOptional()
  @IsString({ message: ErrorUtil.invalidString('generatedClaim') })
  generatedClaim: string;
  @IsOptional()
  @IsString({ message: ErrorUtil.invalidString('userStatement') })
  userStatement: string;
  @IsOptional()
  @IsArray({
    message: ErrorUtil.invalid('additionalAttachmentIds', 'must be an array'),
  })
  additionalAttachmentIds: number[];
  @IsOptional()
  @IsString({ message: ErrorUtil.invalidString('finalClaim') })
  finalClaim: string;
  @IsOptional()
  @IsObject({
    message: ErrorUtil.invalid('answeredClaim', 'must be an object'),
  })
  answeredClaim: Record<string, any>;
  @IsOptional()
  @IsEnum(PaymentStatusEnum, {
    message: ErrorUtil.invalid('paymentStatus', 'must be a valid enum'),
  })
  paymentStatus: PaymentStatusEnum;
  @IsOptional()
  @IsNumber(
    {},
    { message: ErrorUtil.invalid('latestTransactionId', 'must be a number') },
  )
  latestTransactionId: number;

  constructor(data: Partial<OrderUpdateDto>) {
    return plainToInstance(OrderUpdateDto, data);
  }

  static toOrderDto(dto: OrderUpdateDto): OrderDto {
    return new OrderDto(dto);
  }
}
