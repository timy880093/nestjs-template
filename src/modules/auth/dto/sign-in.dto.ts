import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({ description: '使用者名稱', example: 'testtest' })
  identity: string;
  @ApiProperty({ description: '密碼', example: 'B1qaz2wsx' })
  password: string;
}
