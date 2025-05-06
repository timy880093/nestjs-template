import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TicketAppealService } from '../shared/ticket-appeal.service';
import { TicketDraftCreateDto } from '../dto/ticket-draft-create.dto';
import { TicketUpdateReq } from '../dto/ticket-update.req';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TicketDto } from '../dto/ticket.dto';
import { TicketDraftUpdateDto } from '../dto/ticket-draft-update.dto';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UserId } from '../../../common/decorator/user-id.decorator';
import { TicketService } from '../service/ticket.service';
import {
  TokenUser,
  UserInfo,
} from '../../../common/decorator/token-user.decorator';

@ApiTags('ticket')
@Controller('ticket')
@UseGuards(ThrottlerGuard)
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly ticketAppealService: TicketAppealService,
  ) {}

  // 圖檔不用展開
  @Get()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get all tickets',
    description: 'Fetches all tickets.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all tickets.',
    type: [TicketDto],
  })
  findAll(@UserId() userId: number): Promise<TicketDto[]> {
    return this.ticketService.findAllByUserId(userId);
  }

  // 圖檔要展開
  @ApiOperation({
    summary: 'Get ticket by ID',
    description: 'Fetches a single ticket by its ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the ticket.',
    type: TicketDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  @Get(':id')
  @SkipThrottle()
  findOne(
    @TokenUser() userInfo: UserInfo,
    @Param('id') id: number,
  ): Promise<TicketDto> {
    // return this.ticketAppealService.findTicketById(id,false);
    return this.ticketAppealService.findTicketById(id, userInfo, true);
  }

  @Post()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Create a new ticket',
    description: 'Creates a new ticket.',
  })
  @ApiBody({ type: TicketDraftCreateDto })
  @ApiResponse({
    status: 201,
    description: 'Returns the created ticket.',
    type: TicketDto,
  })
  create(
    @UserId() userId: number,
    @Body() ticketCreateDto: TicketDraftCreateDto,
  ): Promise<TicketDto> {
    return this.ticketAppealService.createDraftTicket(userId, ticketCreateDto);
  }

  @Patch(':id')
  @SkipThrottle()
  // @UsePipes(new ValidationPipe({ groups: ['non_draft'] }))
  @ApiOperation({
    summary: 'Update ticket by ID',
    description: 'Updates a ticket based on its ID.',
  })
  @ApiBody({ type: TicketUpdateReq })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated ticket.',
    type: TicketDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  update(
    @TokenUser() userInfo: UserInfo,
    @Param('id') id: number,
    @Body() ticketUpdateDto: TicketUpdateReq,
  ): Promise<TicketDto> {
    return this.ticketAppealService.updateTicketAndGroupOrder(
      id,
      userInfo,
      ticketUpdateDto,
    );
  }

  @Patch(':id/draft')
  @SkipThrottle()
  // @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @ApiOperation({
    summary: 'Update ticket draft by ID',
    description: 'Updates a ticket draft based on its ID.',
  })
  @ApiBody({ type: TicketDraftUpdateDto })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated ticket draft.',
    type: TicketDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  updateDraft(
    @TokenUser() userInfo: UserInfo,
    @Param('id') id: number,
    @Body() ticketDraftUpdateDto: TicketDraftUpdateDto,
  ): Promise<TicketDto> {
    return this.ticketAppealService.updateTicketDraft(
      id,
      userInfo,
      ticketDraftUpdateDto,
    );
  }

  @Delete(':id')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Delete ticket by ID',
    description: 'Deletes a ticket based on its ID.',
  })
  @ApiResponse({ status: 200, description: 'Ticket deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  remove(
    @TokenUser() userInfo: UserInfo,
    @Param('id') id: number,
  ): Promise<number> {
    return this.ticketAppealService.removeTicket(id, userInfo);
  }

  @Post(['recognize/:id', ':id/recognize'])
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: 'Recognize ticket by ID',
    description: 'Recognizes a ticket based on its ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the recognized ticket.',
    type: TicketDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  recognize(
    @TokenUser() userInfo: UserInfo,
    @Param('id') id: number,
  ): Promise<TicketDto> {
    return this.ticketAppealService.recognizeTicket(false, id, userInfo);
  }

  // @Get(':id/price')
  // async calculateTicketPrice(
  //   @Param('id') id: number,
  //   @UserId() userId: number,
  // ): Promise<number> {
  //   return this.ticketAppealService.calculateTicketPrice(id, userId);
  // }
}
