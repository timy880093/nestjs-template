import { ApiProperty } from '@nestjs/swagger';

export class Oauth2SignInDto {
  @ApiProperty({ description: 'line id_token or access_token' })
  token: string;
  @ApiProperty({ description: 'line email' })
  email?: string;
}
