import { DateUtil } from '../../../common/util/date.util';
import { v4 as uuidv4 } from 'uuid';

export class OrderUtil {
  static genOrderNo(): string {
    return `TA${DateUtil.twDayjs().format('YYYYMMDD')}${uuidv4().replace('-', '').slice(0, 5)}`;
  }
}
