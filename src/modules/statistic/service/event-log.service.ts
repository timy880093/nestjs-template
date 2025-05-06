import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ErrorTypes } from '../../../common/dto/error-code.const';
import { CommonException } from '../../../common/exception/common.exception';
import {
  CreateEventLogReq,
  CreateEventLogRes,
  GetEventLogReq,
  GetEventLogRes,
} from '../dto';
import {
  createEventLogToModel,
  modelToCreateEventLogRes,
  modelToGetEventLogRes,
} from '../util';
import { EventLogRepository } from '../repository';
import { CommonUtil, CommonValidator } from '../../../common/util';
import { validate } from 'class-validator';

@Injectable()
export class EventLogService {
  constructor(
    @InjectPinoLogger(EventLogService.name)
    private readonly logger: PinoLogger,
    private readonly eventLogRepository: EventLogRepository,
  ) {}

  async createEventLog(dto: CreateEventLogReq): Promise<CreateEventLogRes> {
    const validationErrors = await validate(dto);
    this.logger.debug({ dto, validationErrors }, 'createEventLog req: ');
    if (CommonUtil.isArray(validationErrors))
      CommonValidator.throwException(validationErrors);

    try {
      const model = createEventLogToModel(dto);
      const result = await model.save();
      return modelToCreateEventLogRes(result);
    } catch (e) {
      throw new CommonException(
        'createEventLog error: ',
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  async getEventLogs(dto: GetEventLogReq): Promise<GetEventLogRes[]> {
    // const model = getEventLogToModel(req);
    this.logger.debug({ dto }, 'getEventLogs req: ');
    const results = await this.eventLogRepository.findAll({ ...dto });
    this.logger.debug({ results }, 'getEventLogs result: ');
    return results.map((r) => modelToGetEventLogRes(r));
  }
}
