import { TrackEventEnum } from '../../../common/dto/track-event.enum';

export class TrackEventDto {
  date: string;
  event: TrackEventEnum;
  count: number;

  constructor(data: Partial<TrackEventDto>) {
    Object.assign(this, data);
    this.count = this.count ? Number(this.count) : 0;
  }
}
