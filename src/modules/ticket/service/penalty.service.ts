import { Injectable } from '@nestjs/common';
import { PenaltyRepository } from '../repository/penalty.repository';
import { GetPenaltyRangeRes } from '../dto/get-penalty-range.res';
import { TicketUtil } from '../utils/ticket.util';
import ticketConfig from '../ticket.config';

@Injectable()
export class PenaltyService {
  private readonly profitRate: number;
  private readonly serviceFee: number;

  constructor(private readonly penaltyRepository: PenaltyRepository) {
    this.profitRate = ticketConfig().successFeeRate;
    // this.serviceFee = ticketConfig().serviceFee;
    this.serviceFee = 149;
  }

  async getPenaltyRange(): Promise<GetPenaltyRangeRes[]> {
    const results = await this.penaltyRepository.findAll();
    return results.map(({ article, item, clause, minAmount, maxAmount }) => {
      return new GetPenaltyRangeRes({
        article: article,
        item: item,
        clause: clause,
        fineRange: [minAmount, maxAmount],
        serviceFeeRange: [
          TicketUtil.calculateServiceFee(minAmount),
          TicketUtil.calculateServiceFee(maxAmount),
        ],
      });
    });
  }
}
