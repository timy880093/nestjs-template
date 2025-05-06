import { LoggerModuleAsyncParams } from 'nestjs-pino/params';
import { join } from 'path';

export const getLoggerConfig = (appConfig: any): LoggerModuleAsyncParams => ({
  useFactory: async () => {
    // console.log('logLevel: ', appConfig.logLevel);
    return {
      pinoHttp: {
        level: appConfig.logLevel, // LEVEL 總開關
        autoLogging: false, // 是否啟用自動日誌記錄 req,res
        base: null, // 去除預設的 base 屬性
        quietReqLogger: true, // 壓制詳細的請求日誌
        redact: ['req.headers.authorization', '*.password'], // 遮蔽敏感信息
        transport: {
          targets: [
            {
              level: appConfig.logLevel, // 從配置服務中獲取日誌級別
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                singleLine: true,
                messageFormat: '{msg}', // 只顯示消息
              },
            },
            {
              level: appConfig.logLevel, // 從配置服務中獲取日誌級別
              target: 'pino-roll',
              options: {
                file: join('logs', 'api.log'), // 路徑
                frequency: 'daily', // 每天一個文件
                size: '10M', // 每個文件大小
                mkdir: true, // 如果目錄不存在，則創建
                limitCount: 100, // 限制日誌文件數量
                dateFormat: 'yyyy-MM-dd', // 文件名日期格式
                // level: appConfig.logLevel, // 從配置服務中獲取日誌級別
                // colorize: false, // log file 必須禁用顏色，否則日誌文件會混亂
                // translateTime: 'SYS:standard',
                // singleLine: true,
                // destination: './api.log', // 指定日誌文件位置
                // append: true, // 追加到現有文件
              },
            },
            // {
            //   target: 'pino-pretty',
            //   options: {
            //     level: appConfig.logLevel, // 從配置服務中獲取日誌級別
            //     colorize: false, // log file 必須禁用顏色，否則日誌文件會混亂
            //     translateTime: 'SYS:standard',
            //     singleLine: true,
            //     destination: './api.log', // 指定日誌文件位置
            //     mkdir: true, // 如果目錄不存在，則創建
            //     append: true, // 追加到現有文件
            //   },
            // },
          ],
        },
      },
    };
  },
});
