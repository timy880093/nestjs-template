import { EventLogModel } from '../entity';
import { CreateEventLogReq, CreateEventLogRes, GetEventLogRes } from '../dto';

export function createEventLogToModel(
  req: Partial<CreateEventLogReq>,
): EventLogModel {
  return new EventLogModel({ ...req });
}

export function modelToCreateEventLogRes(
  model: EventLogModel,
): CreateEventLogRes {
  return new CreateEventLogRes(model);
}

// export function getEventLogToModel(req: GetEventLogReq): EventLogModel {
//   return new EventLogModel({ ...req });
// }

export function modelToGetEventLogRes(model: EventLogModel): GetEventLogRes {
  return new GetEventLogRes(model.toJSON());
}
