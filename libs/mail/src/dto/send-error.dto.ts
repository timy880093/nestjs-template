import { plainToInstance } from 'class-transformer';

export class SendErrorDto {
  readonly to: string;
  readonly message: string;

  constructor(dto: Partial<SendErrorDto>) {
    return plainToInstance(SendErrorDto, dto);
  }
}
