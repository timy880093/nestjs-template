import { ResponseDto } from '../dto/response.dto';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CommonUtil } from '../util';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger(ResponseInterceptor.name)
    private readonly logger: PinoLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const { method, url } = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map((data) => {
        const safeData = this.removeSensitiveData(data);
        const responseDto = ResponseDto.success(`${method} ${url}`, safeData);
        this.showParseLog(responseDto);
        return responseDto;
      }),
    );
  }

  private removeSensitiveData(data: any) {
    if (data?.password) delete data.password;
    return data;
  }

  private showParseLog(responseDto: ResponseDto) {
    const resp = Object.assign({}, responseDto);
    // resp.data = this.parseData(resp.data);
    delete resp.data;
    this.logger.info({ responseBody: resp }, 'response: ');
  }

  private parseData(data: any) {
    if (CommonUtil.isArray(data)) {
      return data.map((item) => {
        this.parseData(item);
      });
    } else {
      return data?.id ? { id: data.id } : data;
    }
  }
}
