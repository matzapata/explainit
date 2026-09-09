import { Expose, Type } from 'class-transformer';

export class OverviewSeriesPointDto {
  @Expose()
  date: string;

  @Expose()
  questions: number;
}

export class ChatOverviewDto {
  @Expose()
  since: Date;

  @Expose()
  questionsToday: number;

  @Expose()
  questions30d: number;

  @Expose()
  questionsAllTime: number;

  @Expose()
  conversations30d: number;

  @Expose()
  @Type(() => OverviewSeriesPointDto)
  series: OverviewSeriesPointDto[];
}
