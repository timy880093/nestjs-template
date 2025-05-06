import { TicketPattern } from '../dto/ticket-pattern.const';
import { PaymentStatusEnum } from '../../../third-party/payment/dto/payment.enum';
import { CommonUtil } from '../../../common/util/common.util';
import { TicketException } from '../../../common/exception/ticket.exception';
import { UserDto } from '../../users/dto/user.dto';
import { RoleEnum } from '../../users/dto/role.enum';
import { TicketDto } from '../dto/ticket.dto';
import { DateUtil } from '../../../common/util/date.util';
import {
  CityEnum,
  TicketTypeEnum,
  VehicleTypeEnum,
  ViolationFactTypeEnum,
} from '../enums/ticket.enum';
import { OrderDto } from '../dto/order.dto';
import { ProgressEnum } from '../enums/order.enum';
import { TransactionDto } from '../dto/transaction.dto';
import _ from 'lodash';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Sequelize } from 'sequelize-typescript';
import { UsersService } from '../../users/users.service';
import { TicketService } from '../service/ticket.service';
import { TicketSubmissionRepository } from '../repository/ticket-submission.repository';
import { OrderService } from '../service/order.service';
import { TransactionService } from '../service/transaction.service';
import { Injectable } from '@nestjs/common';
import { TicketAppealService } from './ticket-appeal.service';
import { SourceEnum } from '../../../common/dto/source.enum';
import { OrderBuilder } from '../utils/order-builder';
import appConfig from '../../../config/app.config';

@Injectable()
export class TicketImportService {
  constructor(
    @InjectPinoLogger(TicketImportService.name)
    private readonly logger: PinoLogger,
    private readonly sequelize: Sequelize,
    private readonly ticketAppealService: TicketAppealService,
    private readonly usersService: UsersService,
    private readonly ticketService: TicketService,
    private readonly ticketSubmissionRepository: TicketSubmissionRepository,
    private readonly orderService: OrderService,
    private readonly transactionService: TransactionService,
  ) {}

  async importFromGoogleSheet(file: Express.Multer.File) {
    // read json
    const jsonData = JSON.parse(file.buffer.toString('utf-8'));
    const filterData = jsonData.filter((item) => {
      const isValidTicketNo = this.parseValue(item['8'])
        ?.toUpperCase()
        .match(TicketPattern.ticketNo.pattern);
      const isSuccessful =
        this.parsePaymentStatus(this.parseValue(item['902'])) ==
        PaymentStatusEnum.SUCCESSFUL;
      return isValidTicketNo && isSuccessful;
    });
    if (!CommonUtil.isArray(filterData))
      throw new TicketException(`data is not array`);

    const groupResults = this.groupTicketByContinuous(filterData);
    // console.log('groupResults:', groupResults);

    const allUsers = await this.usersService.findAll();
    const allOrders = await this.orderService.findAll({}, false, false, false);
    const allTickets = (
      await this.ticketService.findAll({}, false, false)
    ).filter((ticket) => ticket.isDraft === false);
    const allTransactions = await this.transactionService.findAll();

    const successTicketNos = [];
    const errorTicketNos = [];
    for (const group of groupResults) {
      const first = group[0];
      // user
      const phone = this.parseValue(first['2']);
      const userDto: Partial<UserDto> = {
        role: RoleEnum.USER,
        isActive: true,
        isEmailVerified: false,
        isPhoneVerified: false,
        email: this.parseValue(first['1']),
        phone: phone ? (phone.startsWith('0') ? phone : '0' + phone) : null,
        lineUid: this.parseValue(first['60']),
        source: SourceEnum.SURVEY_CAKE,
      };

      // ticket
      const tickets: Partial<TicketDto>[] = group.map((item) => {
        const ticketNo = this.parseValue(item['8'])?.toUpperCase();
        const { vArticle, vItem, vClause } = this.parseViolation(
          this.parseValue(item['53']),
        );
        const ownerName = this.parseValue(item['36']);
        let driverName = ownerName;
        let isOwnerSameAsDriver = false;
        if (this.parseValue(item['65']) == '是，駕駛就是車主')
          isOwnerSameAsDriver = true;
        else driverName = this.parseValue(item['65']);

        const ticketDto: Partial<TicketDto> = {
          isTicketPaid: this.parseValue(item['44']) == '是',
          expiresAt: DateUtil.twDayjs(this.parseValue(item['18']))?.toDate(),
          assignedOfficeCity: this.parseCity(this.parseValue(item['42'])),

          ticketType: TicketTypeEnum.PAPER,

          // ticketInfoFileIds: item['__1'],
          // violationFileIds: item['__1'],
          ownerName,
          ownerIdNo: this.parseValue(item['6'])?.toUpperCase(),
          isOwnerSameAsDriver,
          driverName,
          driverIdNo: this.parseValue(item['56'])?.toUpperCase(),
          violation1Article: vArticle,
          violation1Item: vItem,
          violation1Clause: vClause,
          violation1Penalty: this.parseValue(item['__10']),
          violationFactType: ViolationFactTypeEnum.OTHER,
          violationFact: this.parseValue(item['20']),
          ticketNo,
          licensePlateNo: this.parseValue(item['13'])?.toUpperCase(),
          vehicleType: this.parseVehicleType(this.parseValue(item['34'])),
          isDraft: false,
          createdAt: DateUtil.twDayjs(this.parseValue(item['904']))?.toDate(),
          source: SourceEnum.SURVEY_CAKE,
          // 原本資料沒給
          isCompanyCar: false,
          isTicketAssignedToDriver: false,
          // violateAt: item['?'],
        };
        return ticketDto;
      });

      // order
      const paymentStatus = this.parsePaymentStatus(
        this.parseValue(first['902']),
      );
      const progress = this.parseProgress(
        this.parseValue(first['903']),
        this.parseValue(first['__19']),
      );
      const assignUserId = this.parseUser(this.parseValue(first['__12']));
      const claim = this.parseValue(first['__11']);

      const orderDto: Partial<OrderDto> = new OrderDto({
        ...OrderBuilder.toCreate2(
          userDto.id,
          userDto.email,
          userDto.phone,
          tickets[0].violationFactType,
          tickets[0].violationFact,
        ),
        progress,
        paymentStatus,
        orderNo: this.parseValue(first['901']),
        finalClaim: claim,
        claimUserId: assignUserId,
        resultUserId: [ProgressEnum.APPROVED, ProgressEnum.REJECTED].includes(
          progress,
        )
          ? assignUserId
          : null,
        processedAt: null,
        submittedAt: DateUtil.twDayjs(this.parseValue(first['__15']))?.toDate(),
        receivedAt: DateUtil.twDayjs(this.parseValue(first['__20']))?.toDate(),
        userStatement: this.parseValue(first['9']),
        queryInfo: {
          caseNo: this.parseValue(first['__14']),
          ticketNo: this.parseValue(first['8']),
          licensePlateNo: this.parseValue(first['13']),
          ownerIdNo: this.parseValue(first['6']),
          queryEmail: appConfig().systemReceiver,
          // queryPhone: '',
        },
        remark: this.parseValue(first['__13']),
        source: SourceEnum.SURVEY_CAKE,
      });

      //transaction
      let transactionDto: TransactionDto;
      if (orderDto.isFirstStagePaid()) {
        // transaction
        const estimated = _.toNumber(this.parseValue(first['908']));
        const actual = _.toNumber(this.parseValue(first['909']));
        const totalAmount = actual > 0 ? actual : estimated;
        const payAt = DateUtil.twDayjs(this.parseValue(first['910']))?.toDate();

        transactionDto =
          totalAmount == 0
            ? new TransactionDto({
                tradeNo: orderDto.orderNo,
                product: '免費優惠',
                serviceFee: 0,
                totalAmount: 0,
                username: userDto.email,
                email: userDto.email,
                status: PaymentStatusEnum.SUCCESSFUL,
                payAt,
              })
            : new TransactionDto({
                tradeNo: orderDto.orderNo,
                product: this.parseValue(first['905']),
                additionalFee: _.toNumber(this.parseValue(first['907'])),
                serviceFee: _.toNumber(this.parseValue(first['906'])),
                totalAmount,
                payAt,
                invoiceNo: this.parseValue(first['911']),
                invoiceAt: payAt,
                username: userDto.email,
                email: userDto.email,
                status: PaymentStatusEnum.SUCCESSFUL,
              });
      }

      // save
      const transaction = await this.sequelize.transaction();
      try {
        for (const ticket of tickets) {
          if (tickets.some((t) => t.ticketNo === ticket.ticketNo)) continue;
        }

        const user =
          allUsers.find((u) => u.email === userDto.email) ||
          (await this.usersService.create(userDto, transaction));

        const order =
          allOrders.find((o) => o.orderNo === orderDto.orderNo) ||
          (await this.orderService.create(
            { ...orderDto, userId: user.id },
            transaction,
          ));

        for (const ticket of tickets) {
          if (allTickets.some((t) => t.ticketNo === ticket.ticketNo)) continue;

          const ticketResult = await this.ticketService.create(
            { ...ticket, orderId: order.id, userId: user.id },
            transaction,
          );
          if (order.isFirstStagePaid())
            await this.ticketSubmissionRepository.create(
              {
                ...TicketDto.buildSubmission(ticket),
                orderId: order.id,
                userId: user.id,
                ticketId: ticketResult.id,
              },
              transaction,
            );
        }

        if (
          transactionDto &&
          !allTransactions.some((t) => t.tradeNo === transactionDto.tradeNo)
        ) {
          transactionDto.orderId = order.id;
          const transactionResult = await this.transactionService.create(
            transactionDto,
            transaction,
          );
          await this.ticketAppealService.updateOrder(
            order.id,
            { latestTransactionId: transactionResult.id },
            transaction,
          );
        }

        await transaction.commit();
        successTicketNos.push(tickets[0]?.ticketNo);
      } catch (e) {
        await transaction.rollback();
        console.log('import error: ', e);
        if (e.errorCode != 'DUPLICATED')
          errorTicketNos.push({
            ticketNo: tickets[0]?.ticketNo,
            errorCode: e.errorCode,
            error: e.message,
          });
      }
      console.log('done: ', tickets[0]?.ticketNo);
    }

    return { successTicketNos, errorTicketNos };
  }

  private parseValue(value: any): string {
    return value?.toString().trim();
  }

  private parseViolation(violation: string): {
    vArticle?: string;
    vItem?: string;
    vClause?: string;
  } {
    if (!violation || violation.length == 0) return {};
    violation = violation.toString().trim();
    // const regex = /第?(\d+)條第?(\d+)[項巷]第?(\d+)款/;
    const regexList = [
      /第?(\d+)條第?(\d*)項?第?(\d*)款?/,
      /(\d+)\/?(\d*)\/?(\d*)/,
    ];
    for (const regex of regexList) {
      const matches = violation.match(regex);
      if (matches)
        return { vArticle: matches[1], vItem: matches[2], vClause: matches[3] };
    }
    return {};
  }

  private parseCity(city: string): CityEnum {
    switch (city) {
      case '台北市':
        return CityEnum.TAIPEI;
      case '新北市':
        return CityEnum.NEW_TAIPEI;
      case '桃園市':
        return CityEnum.TAOYUAN;
      case '台中市':
        return CityEnum.TAICHUNG;
      case '台南市':
        return CityEnum.TAINAN;
      case '高雄市':
        return CityEnum.KAOHSIUNG;
      default:
        return CityEnum.OTHER;
    }
  }

  private parseVehicleType(vehicleType: string): VehicleTypeEnum {
    switch (vehicleType) {
      case '機車':
        return VehicleTypeEnum.MOTORCYCLE;
      case '小自客(貨)':
        return VehicleTypeEnum.SMALL_PASSENGER_CARGO;
      case '大型車(拖車,動力機械)':
        return VehicleTypeEnum.LARGE_VEHICLE;
      case '大型重型 機車':
        return VehicleTypeEnum.HEAVY_MOTORCYCLE;
      case '小營客(計程車)':
        return VehicleTypeEnum.SMALL_COMMERCIAL_TAXI;
      default:
        return VehicleTypeEnum.TEST_PLATE;
    }
  }

  private groupTicketByContinuous(
    data: Record<string, any>[],
  ): Record<string, any>[] {
    // 第一步：按 "8" 分组，并排除掉出现次数大于 1 的数据
    const grouped = _.groupBy(data, '8');
    // find duplicate
    const duplicateTicketNos = _.pickBy(grouped, (group) => group.length > 1);
    console.log(
      'duplicateTicketNos:',
      _.map(duplicateTicketNos, (group) => group[0]['8']),
    );

    const filteredData = _.flatMap(grouped, (group) =>
      group.length === 1 ? group : [],
    );
    // console.log('filteredData:', filteredData);

    // 分組，找 8 和 11 一樣的
    const continuous = new Set(); // 連續的 (item['11])
    const needMerge = new Set(); // 需要合并的
    const merged = new Set(); // 已合并的
    const result = [];
    _.forEach(filteredData, (item) => {
      if (item['11'] && item['11'].length > 5) continuous.add(item['11']);
    });
    _.forEach(filteredData, (item) => {
      if (continuous.has(item['8'])) needMerge.add(item['8']);
    });

    _.forEach(filteredData, (item) => {
      if (merged.has(item['8'])) return;
      if (needMerge.has(item['8'])) {
        const group = _.filter(
          filteredData,
          (other) => other['11'] === item['8'],
        );
        if (group.length > 0) {
          result.push([item, ...group]);
          group.forEach((item) => merged.add(item['8']));
        } else result.push([item]);
      } else {
        if (!continuous.has(item['8'])) result.push([item]);
      }
    });
    // console.log('result:', result);
    return result;
  }

  private parseProgress(status: string, appealResult: string): ProgressEnum {
    switch (status) {
      case '處理中':
        return ProgressEnum.PROCESSING;
      case '審核中':
        return ProgressEnum.SUBMITTED;
      case '已結案':
        return appealResult == '申訴成功'
          ? ProgressEnum.APPROVED
          : ProgressEnum.REJECTED;
      case '已取消':
        return ProgressEnum.CANCELED;
      default:
        return null;
    }
  }

  private parsePaymentStatus(status: string): PaymentStatusEnum {
    switch (status) {
      case '未付款':
        return PaymentStatusEnum.UNPAID;
      case '已付款':
      case '免費優惠':
        return PaymentStatusEnum.SUCCESSFUL;
      default:
        return PaymentStatusEnum.CANCELED;
    }
  }

  private parseUser(user: string): number {
    if (!user) return null;
    switch (user) {
      case '成帆': //3
        return 18;
      case '品淇': //2
        return 899;
      case '妤安': //1
        return 898;
      default:
        return null;
    }
  }
}
