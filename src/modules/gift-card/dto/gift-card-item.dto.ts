import { plainToInstance } from 'class-transformer';

export class GiftCardItemDto {
  id: number;
  imageUrl: string;
  title: number;
  description: number;
  price: number;
  originalPrice: number;

  constructor(data: any) {
    this.id = data.id;
    this.imageUrl = data.imageUrl;
    this.title = data.name;
    this.description = data.description;
    this.price = data.amount;
    this.originalPrice = data.originalPrice;
  }
}
