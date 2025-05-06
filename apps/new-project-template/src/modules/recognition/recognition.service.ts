import { Injectable, OnModuleInit } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as dotenv from 'dotenv';
import appConfig from '../../config/app.config';
import { TicketException } from '@app/common/exception/ticket.exception';
import { CommonUtil } from '@app/common/util/common.util';
import { zodResponseFormat } from 'openai/helpers/zod';
import OpenAI from 'openai';
import { z } from 'zod';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

dotenv.config({ path: appConfig().envFile });

@Injectable()
export class RecognitionService implements OnModuleInit {
  private readonly client: ImageAnnotatorClient;
  private readonly openAiClient: OpenAI;
  private readonly ticketSchema = this.generateTicketSchema();
  private readonly model = 'gpt-4o-2024-08-06';

  // private readonly ticketSchema =
  //   RecognitionUtil.generateZodSchemaFromClass(TicketDto);

  constructor(
    @InjectPinoLogger(RecognitionService.name)
    private readonly logger: PinoLogger,
  ) {
    // FIXME 改成 config() 的寫法
    this.client = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    this.openAiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async onModuleInit() {
    void this.checkGoogleCredentials();
  }

  async checkGoogleCredentials(): Promise<boolean> {
    try {
      const s = await this.client.getProjectId();
      this.logger.debug(`Google credentials are valid: ${s}`);
      return true;
    } catch (error) {
      console.error('Google credentials are invalid:', error);
      return false;
    }
  }

  async recognize(paths: string[]): Promise<Record<string, any>> {
    if (!CommonUtil.isArray(paths))
      throw new TicketException('recognize: paths is required');
    const ocrResult = await Promise.all(
      paths.map(async (p) => await this.detectTextFromImage(p)),
    );
    return this.parseOcrResult(ocrResult);
  }

  async detectTextFromImage(path: string): Promise<string> {
    const [result] = await this.client.textDetection(path);
    const detections = result.textAnnotations;
    const text = detections.map(({ description }) => description).join(' ');
    return text;
  }

  async parseResultByAi(
    source: string | string[],
    prompt: string,
  ): Promise<Record<string, any>> {
    // 分別辨識，最後用 ------ 串接?
    const sourceArray = [];
    if (!source) throw new TicketException('source is required');
    if (!CommonUtil.isArray(source)) sourceArray.push(source);

    const defaultPrompt = `Here is the source document you need to process, the source document is an array of strings, maybe text or json string, you need to combine them into a single string and then process it.:
<source_document>
${source}
</source_document>

Your final JSON output should conform to the above schema. Please ensure all extracted information is accurate and properly formatted.\`;
`;

    const completion = await this.openAiClient.beta.chat.completions.parse({
      model: this.model,
      messages: [{ role: 'user', content: `${prompt} & ${defaultPrompt}` }],
      response_format: zodResponseFormat(
        this.ticketSchema,
        'trafficViolationSchema',
      ),
    });

    const message = completion.choices[0]?.message;
    if (message?.parsed) {
      return message.parsed;
    } else {
      throw new TicketException(
        `Failed to parse OCR result: ${message.refusal}`,
      );
    }
  }

  async parseOcrResult(
    ocrResult: string | string[],
  ): Promise<Record<string, any>> {
    const prompt = `You will be processing an OCR result document from a Taiwan traffic ticket to extract specific information and format it in valid JSON based on a provided zod schema. Your task involves listing all possible values, converting ROC Year to AD Year, and finding the most relevant violationFactType based on violationFact and possible articles.

Here are the specific instructions:

1. **List of Information to Extract:**
   - 車牌號碼 (licensePlateNo)
   - 罰單單號 (ticketNo)
<!--   - 應到案處所 (assignedOfficeCity): "taipei", "new_taipei", "taoyuan", "taichung", "tainan", "kaohsiung", "other"-->
   - 應到案處所 (assignedOfficeCity)
<!--   - 車輛種類 (vehicleType): "motorcycle", "heavy_motorcycle", "small_passenger_cargo", "small_commercial_taxi", "large_vehicle", "temporary_plate", "test_plate"-->
   - 車輛種類 (vehicleType)
   - '車主姓名' or '同駕駛人（或' = (ownerName)
<!--   - 同駕駛人（或行為人姓名）(driverName)-->
   -  (ownerName)
<!--   - 違規事實類型 (violationFactType): "超速", "違停", "闖紅燈", "方向燈", "逆向", "行駛 / 佔用專用道或車道", "未保持安全車距", "未禮讓行人", "路肩相關", "迴轉相關違規", "超車", "跨越雙白實線", "手持 3C", "機車行駛人行道", "路口未停車再開", "未依規定使用燈光", "路口未淨空", "插入連貫使出主線汽車間", "行人穿越馬路", "酒駕", "高速公路貨物未覆蓋綑綁", "紅燈轎車佔機車停等區", "車牌無法辨識", "危險駕駛", "機車未依規定兩段式左轉", "占用婦幼車位", "跨越槽化線", "在多車道左轉彎迴轉，不先駛入內側車道", "蛇行"-->
   - 違規事實類型 (violationFactType)
   - 違規事實 (violationFact)
   - 應到案日期 (expiresAt)
   - 違規時間 (violateAt)：YYY-MM-DD HH:mm
   - 違反道路交通管理處罰條例：
        - 第一行：條(violation1Article: 限制0~100)、項(violation1Item)、款(violation1Clause)、新臺幣{violation1Fine}元
        - 第二行：條(violation2Article: 限制0~100)、項(violation2Item)、款(violation2Clause)、新臺幣{violation2Fine}元
   - notice:
        - 若 '同駕駛人（或' 前方有 V，則 driverName = ownerName，否則 driverName = (empty)
        - violation1Article、violation1Item、violation1Clause 為一組橫排字元，不會和別行整併
        - violation2Article、violation2Item、violation2Clause 為一組橫排字元，不會和別行整併
<!--        - 若條,項,款 有值就照著填，若有 0 就填 0，沒有就留 (empty)-->
        - violationFine = violation1Fine + violation2Fine，如果有空值則為 0 去做運算
        - 若有判斷不出的欄位，不需要填任何值，帶 empty string 即可
        

2. **Converting ROC Year to AD Year:**
   - Identify dates in the format 民國YYY年MM月DD日.
   - Convert the ROC Year (民國YYY) to AD Year by adding 1911 to the ROC Year.
   - Reformat the date to the AD format YYYY-MM-DD.

3. **Finding the Most Relevant violationFactType:**
   - Find the most relevant type based on the violationFact and possible articles.
   - Use keywords and context to determine the most accurate type.

4. **Final JSON Output Structure:**
   - Extract the relevant information from the OCR document.
   - Convert and format the extracted data into a JSON object using the zod schema provided.
   
Here are the possible articles for each violation fact type:
<violation_fact_type_possible_articles>
{
	"超速": ["33", "40", "43", "54"],
	"違停": ["55", "56", "57"],
	"闖紅燈": ["33", "53", "53-1", "86"],
	"方向燈": ["33", "42", "48", "49", "50"],
	"逆向": ["43", "45"],
	"行駛/佔用專用道或車道": ["33", "45", "48", "54", "73", "74", "86", "92"],
	"未保持安全車距": ["33", "47", "58"],
	"未禮讓行人": ["44", "45", "74", "86"],
	"路肩相關": ["33", "92"],
	"迴轉相關違規": ["43", "48", "49", "54"],
	"超車": ["33", "47", "54", "92"],
	"跨越雙白實線": ["33", "45"],
	"手持3C": ["31-1", "73"],
	"機車行駛人行道": ["45", "74"],
	"路口未停車再開": ["45"],
	"未依規定使用燈光": ["33", "42", "73"],
	"路口未淨空": ["58"],
	"插入連貫使出主線汽車間": ["33", "45"],
	"行人穿越馬路": ["44", "78"],
	"酒駕": ["35", "73", "86"],
	"高速公路貨物未覆蓋綑綁": ["33"],
	"紅燈轎車佔機車停等區": ["56", "60"],
	"車牌無法辨識": ["12", "13", "71-1"],
	"危險駕駛": ["43", "73", "86"],
	"機車未依規定兩段式左轉": ["48"],
	"占用婦幼車位": ["56"],
	"跨越槽化線": ["33", "56", "60"],
	"在多車道左轉彎迴轉，不先駛入內側車道": ["48"],
	"蛇行": ["43", "51"],
}
</violation_fact_type_possible_articles>
`;
    return this.parseResultByAi(ocrResult, prompt);
  }

  private generateTicketSchema() {
    // const assignedOfficeCityEnum = z.enum(
    //   Object.values(CityEnum) as [string, ...string[]],
    // );

    return z.object({
      licensePlateNo: z.string().optional(),
      ticketNo: z.string().optional(),
      ownerName: z.string().optional(),
      ownerIdNo: z.string().optional(),
      ownerBirthdate: z.string().optional(),
      driverName: z.string().optional(),
      driverIdNo: z.string().optional(),
      driverBirthdate: z.string().optional(),
      violationFact: z.string().optional(),
      expiresAt: z.string().optional(),
      violateAt: z.string().optional(),
      violation1Article: z.string().optional(),
      violation1Item: z.string().optional(),
      violation1Clause: z.string().optional(),
      violation2Article: z.string().optional(),
      violation2Item: z.string().optional(),
      violation2Clause: z.string().optional(),
      // violation1Penalty: z.string().optional(), //罰單上不會有罰則
      // violation2Penalty: z.string().optional(), //罰單上不會有罰則
      violationFine: z.number().optional(),
    });
  }
}
