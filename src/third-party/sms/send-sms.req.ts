import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SendSmsReq {
  @ApiProperty({ description: '手機' })
  @IsArray()
  readonly phones: string[];

  @ApiProperty({ description: '主旨' })
  @IsString()
  readonly subject: string;

  @ApiProperty({ description: '內容' })
  @IsString()
  readonly text: string;

  constructor(data: Partial<SendSmsReq>) {
    Object.assign(this, data);
  }
}
