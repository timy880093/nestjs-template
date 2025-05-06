import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from '@app/common/decorator/public.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('default')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  healthCheck(): string {
    return this.appService.getHello();
  }
}
