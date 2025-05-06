import { plainToInstance } from 'class-transformer';

export class RecognizeLogDto {
  id: number;
  userId: number;
  ticketId: number;
  ticketInfoFileIds: number[];
  // result: Record<string, any> | Record<string, any>[];
  result: any;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<RecognizeLogDto>) {
    Object.assign(this, data);
  }
}
