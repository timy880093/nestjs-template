import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../../common/guard/admin.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GiftCardService } from '../../gift-card/gift-card.service';
import { MailLogDto } from '../../mail-log/dto/mail-log.dto';
import { ResendGiftCardEmailReq } from '../dto';
import {
  CreateGiftCardReq,
  CreateGiftCardRes,
} from '../dto/create-gift-card.dto';

@ApiTags('admin/gift-card')
@Controller('admin/gift-card')
@UseGuards(AdminGuard)
export class AdminGiftCardController {
  constructor(private readonly giftCardService: GiftCardService) {}

  @ApiOperation({ summary: '補寄禮品卡信件' })
  @Post('resend')
  async resendGiftCardEmail(
    @Body() { email, tradeNo }: ResendGiftCardEmailReq,
  ): Promise<MailLogDto> {
    return this.giftCardService.resendGiftCardEmail(email, tradeNo);
  }

  @ApiOperation({ summary: '產生禮品卡序號' })
  @Post('generate')
  async generateGiftCards(
    @Body() dto: CreateGiftCardReq,
  ): Promise<CreateGiftCardRes> {
    return this.giftCardService.createGiftCardWithoutOrder(dto, dto.count);
  }
}
