// import {
//   CallHandler,
//   ExecutionContext,
//   ForbiddenException,
//   Injectable,
//   NestInterceptor,
// } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
//
// @Injectable()
// export class UserIdInterceptor implements NestInterceptor {
//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const request = context.switchToHttp().getRequest();
//     const userId = request.user.id;
//
//     // 檢查 userId 是否與資源的 userId 相同
//     return next.handle().pipe(
//       map((data) => {
//         if (!data || !data.userId) return data;
//         if (data.userId !== userId) {
//           throw new ForbiddenException(
//             'You are not allowed to access this resource',
//           );
//         }
//         return data;
//       }),
//     );
//   }
// }
