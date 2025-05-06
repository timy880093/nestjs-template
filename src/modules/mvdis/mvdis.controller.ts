import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Request,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { MvdisService } from './mvdis.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Controller('mvdis')
export class MvdisController {
  constructor(
    private readonly mvdisService: MvdisService,
    @InjectPinoLogger(MvdisController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Post(['owner'])
  @ApiResponse({ status: 200, description: 'create mvdis owner and ticket' })
  async createMvdisOwner(
    @Request() req: any,
    @Body() body: { uid: string; birthday: string },
  ): Promise<void> {
    const userId = req.user.id;
    const result = await this.mvdisService.createMvdisOwner(userId, body);
    return result;
  }

  @Get(['owner'])
  @ApiResponse({ status: 200, description: 'find mvdis owner and ticket' })
  async findMvdisOwner(@Request() req: any): Promise<any> {
    const userId = req.user.id;
    const result = await this.mvdisService.findMvdisTickets(userId);
    return result;
  }

  @Delete(['owner/:id'])
  @ApiResponse({ status: 200, description: 'delete mvdis owner' })
  async deleteMvdisOwner(
    @Request() req: any,
    @Param('id') id: number,
  ): Promise<any> {
    const userId = req.user.id;
    const result = await this.mvdisService.deleteMvdisOwner(id, userId);
    return result;
  }
}
