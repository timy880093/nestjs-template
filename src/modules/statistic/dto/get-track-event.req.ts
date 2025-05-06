import { IsOptional, Matches } from 'class-validator';

export class GetTrackEventReq {
  // @IsEnum(TrackEventEnum)
  // event: TrackEventEnum;
  @IsOptional()
  @Matches(/^(|\d{4}-?(0[1-9]|1[12])-?(0[1-9]|[12][0-9]|3[01]))$/, {
    message: 'startDate must be a valid date in the format YYYY-MM-DD',
  })
  startDate: string;
  @IsOptional()
  @Matches(/^(|\d{4}-?(0[1-9]|1[12])-?(0[1-9]|[12][0-9]|3[01]))$/, {
    message: 'startDate must be a valid date in the format YYYY-MM-DD',
  })
  endDate: string;
}
