import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorator/public.decorator';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { GetPenaltyRangeRes } from '../dto/get-penalty-range.res';
import { PenaltyService } from '../service/penalty.service';

@ApiTags('penalty')
@Controller('penalty')
export class PenaltyController {
  constructor(
    @InjectPinoLogger(PenaltyController.name)
    private readonly logger: PinoLogger,
    private readonly penaltyService: PenaltyService,
  ) {}

  @Public()
  @Get('range')
  @ApiOperation({ summary: 'Get all orders with tickets' })
  @ApiResponse({ status: 200, description: 'Return all orders with tickets' })
  getPenaltyRange(): Promise<GetPenaltyRangeRes[]> {
    return this.penaltyService.getPenaltyRange();
  }
}
