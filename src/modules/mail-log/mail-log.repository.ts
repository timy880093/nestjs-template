import { Injectable } from '@nestjs/common';
import { GenericDtoRepository } from '../../common/repository/generic-dto.repository';
import { MailLogModel } from './dto/mail-log.model';
import { MailLogDto } from './dto/mail-log.dto';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class MailLogRepository extends GenericDtoRepository<
  MailLogModel,
  MailLogDto
> {
  constructor(
    @InjectModel(MailLogModel) private readonly repository: typeof MailLogModel,
  ) {
    // super(MailLogModel);
    super(MailLogModel, MailLogDto);
  }

  // protected getDtoClass(): new () => MailLogDto {
  //   return MailLogDto;
  // }
}
