import { plainToInstance } from 'class-transformer';

export class PenaltyDto {
  id: number;
  article: string;
  item: string;
  clause: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  constructor(penalty: Partial<PenaltyDto>) {
    Object.assign(this, penalty);
  }

  inRange(amount: number): boolean {
    return amount >= this.minAmount && amount <= this.maxAmount;
  }
}
