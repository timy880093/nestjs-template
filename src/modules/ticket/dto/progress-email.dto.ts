import { OrderDto } from './order.dto';

export interface ProgressEmailDto {
  order: OrderDto;
  email: string;
  extra?: any;
}
