import { plainToInstance } from 'class-transformer';
import { SendErrorDto } from './send-error.dto';

export class MailResDto {
  readonly totalCount: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly errors: SendErrorDto[];

  constructor(dto: Partial<MailResDto>) {
    return plainToInstance(MailResDto, dto);
  }

  static build(totalCount: number, errors: SendErrorDto[]) {
    return new MailResDto({
      totalCount,
      successCount: totalCount - errors.length,
      errorCount: errors.length,
      errors: errors,
    });
  }
}
