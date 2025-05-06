import { CrawlerTicketDto } from './crawler-ticket.dto';
import { MvdisOwnerModel } from '../entity/mvdis-owner.model';

export interface CrawlerTicketResultDto {
  mvdisOwner: MvdisOwnerModel;
  crawlerTickets: CrawlerTicketDto[];
}
