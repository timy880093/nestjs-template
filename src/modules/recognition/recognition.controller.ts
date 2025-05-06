import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RecognitionService } from './recognition.service';
import { AdminGuard } from '../../common/guard/admin.guard';

@Controller('recognition')
@UseGuards(AdminGuard)
export class RecognitionController {
  constructor(private readonly recognitionService: RecognitionService) {}

  @Post('image')
  async detectTextFromImage(@Body() body: any): Promise<any> {
    return this.recognitionService.recognize(body.paths);
  }
}
