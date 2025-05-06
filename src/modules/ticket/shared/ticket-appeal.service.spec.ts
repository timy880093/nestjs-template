import { Test, TestingModule } from '@nestjs/testing';
import { TicketAppealService } from './ticket-appeal.service';
import { Sequelize } from 'sequelize-typescript';
import { UploadService } from '../../upload/upload.service';
import { UsersService } from '../../users/users.service';
import { PaymentService } from '../../../third-party/payment/payment.service';
import { RedisService } from '../../../third-party/redis/redis.service';
import { TicketDto } from '../dto/ticket.dto';
import { ViolationFactTypeEnum } from '../enums/ticket.enum';
import { DateUtil } from '../../../common/util/date.util';
import { TicketSubmissionRepository } from '../repository/ticket-submission.repository';
import { RecognitionService } from '../../recognition/recognition.service';
import { ConfigService } from '@nestjs/config';
import { PenaltyRepository } from '../repository/penalty.repository';
import { MailService } from '../../../third-party/mail/mail.service';
import { TestUtil } from '../../../common/util/TestUtil';
import { PenaltyDto } from '../dto/penalty.dto';
import { TicketService } from '../service/ticket.service';
import { OrderService } from '../service/order.service';
import { TransactionService } from '../service/transaction.service';
import { CouponService } from '../service/coupon.service';
import { InvoiceService } from '../../../third-party/invoice/invoice.service';
import { CreatePaymentReqDto } from '../dto/create-payment.req.dto';
import { TransactionDto } from '../dto/transaction.dto';
import { TicketException } from '../../../common/exception/ticket.exception';
import { PaymentProviderEnum } from '../../../third-party/payment/dto/payment.enum';
import { UserDto } from '../../users/dto/user.dto';
import { OrderDto } from '../dto/order.dto';
import { RecognizeLogService } from '../service/recognize-log.service';
import { NewebpayReq } from '../../../third-party/payment/dto/newebpay/newebpay.req';

const name = TicketAppealService.name;
describe(name, () => {
  let service: TicketAppealService;
  let sequelize: Sequelize;
  let uploadService: UploadService;
  let usersService: UsersService;
  let ticketService: TicketService;
  let ticketSubmissionProvider: TicketSubmissionRepository;
  let orderService: OrderService;
  let transactionService: TransactionService;
  let couponService: CouponService;
  let penaltyRepository: PenaltyRepository;
  let paymentService: PaymentService;
  let invoiceService: InvoiceService;
  let redisService: RedisService;
  let recognitionService: RecognitionService;
  let recognizeLogService: RecognizeLogService;
  let mailService: MailService;
  let logger: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketAppealService,
        TestUtil.mockLoggerProvider(name),
        { provide: Sequelize, useValue: {} },
        { provide: UploadService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: TicketService, useValue: {} },
        { provide: TicketSubmissionRepository, useValue: {} },
        { provide: OrderService, useValue: {} },
        {
          provide: TransactionService,
          useValue: {
            create: jest.fn(),
          },
        },
        { provide: CouponService, useValue: {} },
        {
          provide: PenaltyRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        { provide: PaymentService, useValue: {} },
        { provide: InvoiceService, useValue: {} },
        { provide: RedisService, useValue: {} },
        { provide: RecognitionService, useValue: {} },
        { provide: RecognizeLogService, useValue: {} },
        { provide: MailService, useValue: {} },
        {
          provide: ConfigService,
          useValue: {
            ticket: {
              continuousTicketIntervalMinutes: 120, // Inject the desired value for testing
            },
          },
        },
      ],
    }).compile();

    service = module.get(TicketAppealService);
    sequelize = module.get(Sequelize);
    uploadService = module.get(UploadService);
    usersService = module.get(UsersService);
    ticketService = module.get(TicketService);
    ticketSubmissionProvider = module.get(TicketSubmissionRepository);
    orderService = module.get(OrderService);
    transactionService = module.get(TransactionService);
    couponService = module.get(CouponService);
    penaltyRepository = module.get(PenaltyRepository);
    paymentService = module.get(PaymentService);
    invoiceService = module.get(InvoiceService);
    redisService = module.get(RedisService);
    recognitionService = module.get(RecognitionService);
    recognizeLogService = module.get(RecognizeLogService);
    mailService = module.get(MailService);
    logger = TestUtil.mockLoggerInstance(module, name);
    TestUtil.mockLoggerFunc(logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(sequelize).toBeDefined();
    expect(uploadService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(ticketService).toBeDefined();
    expect(ticketSubmissionProvider).toBeDefined();
    expect(orderService).toBeDefined();
    expect(transactionService).toBeDefined();
    expect(couponService).toBeDefined();
    expect(penaltyRepository).toBeDefined();
    expect(paymentService).toBeDefined();
    expect(invoiceService).toBeDefined();
    expect(redisService).toBeDefined();
    expect(recognitionService).toBeDefined();
    expect(recognizeLogService).toBeDefined();
    expect(mailService).toBeDefined();
  });

  // describe('findAllOrders', () => {
  //   it('should return all orders for a user', async () => {
  //     const userId = 1;
  //     const orders: OrderDto[] = [
  //       { id: 1, userId, paymentStatus: PaymentStatusEnum.UNPAID },
  //       { id: 2, userId, paymentStatus: PaymentStatusEnum.SUCCESSFUL },
  //     ];
  //     jest.spyOn(orderProvider, 'findAllBy').mockResolvedValue(orders);
  //
  //     const result = await service.findAllOrders(userId, '');
  //     expect(result).toEqual(orders);
  //   });
  // });
  //
  // describe('findOrderById', () => {
  //   it('should return an order by ID', async () => {
  //     const orderId = 1;
  //     const order: OrderDto = { id: orderId, userId: 1, paymentStatus: PaymentStatusEnum.UNPAID };
  //     jest.spyOn(orderProvider, 'findOneBy').mockResolvedValue(order);
  //
  //     const result = await service.findOrderById(orderId, false);
  //     expect(result).toEqual(order);
  //   });
  //
  //   it('should throw NotfoundException if order not found', async () => {
  //     const orderId = 1;
  //     jest.spyOn(orderProvider, 'findOneBy').mockResolvedValue(null);
  //
  //     await expect(service.findOrderById(orderId, false)).rejects.toThrow(NotfoundException);
  //   });
  // });
  //
  // describe('findTicketById', () => {
  //   it('should return a ticket by ID', async () => {
  //     const ticketId = 1;
  //     const ticket: TicketDto = { id: ticketId, userId: 1, isDraft: false };
  //     jest.spyOn(ticketProvider, 'findOneById').mockResolvedValue(ticket);
  //
  //     const result = await service.findTicketById(ticketId, false);
  //     expect(result).toEqual(ticket);
  //   });
  //
  //   it('should throw NotfoundException if ticket not found', async () => {
  //     const ticketId = 1;
  //     jest.spyOn(ticketProvider, 'findOneById').mockResolvedValue(null);
  //
  //     await expect(service.findTicketById(ticketId, false)).rejects.toThrow(NotfoundException);
  //   });
  // });
  //
  // describe('createDraftTicket', () => {
  //   it('should create a draft ticket', async () => {
  //     const userId = 1;
  //     const ticketCreateDto = { userId, isDraft: true };
  //     const ticket: TicketDto = { id: 1, userId, isDraft: true };
  //     jest.spyOn(ticketProvider, 'createDraft').mockResolvedValue(ticket);
  //
  //     const result = await service.createDraftTicket(userId, ticketCreateDto);
  //     expect(result).toEqual(ticket);
  //   });
  // });
  //
  // describe('updateTicketAndGroupOrder', () => {
  //   it('should update a ticket and group order', async () => {
  //     const ticketId = 1;
  //     const ticketUpdateDto = { isDraft: false };
  //     const originalTicket: TicketDto = { id: ticketId, userId: 1, isDraft: true };
  //     const updatedTicket: TicketDto = { id: ticketId, userId: 1, isDraft: false };
  //     jest.spyOn(ticketProvider, 'findOneById').mockResolvedValue(originalTicket);
  //     jest.spyOn(ticketProvider, 'update').mockResolvedValue(updatedTicket);
  //     jest.spyOn(sequelize, 'transaction').mockResolvedValue({
  //       commit: jest.fn(),
  //       rollback: jest.fn(),
  //     } as any);
  //
  //     const result = await service.updateTicketAndGroupOrder(ticketId, true, ticketUpdateDto);
  //     expect(result).toEqual(updatedTicket);
  //   });
  //
  //   it('should throw NotfoundException if ticket not found', async () => {
  //     const ticketId = 1;
  //     const ticketUpdateDto = { isDraft: false };
  //     jest.spyOn(ticketProvider, 'findOneById').mockResolvedValue(null);
  //
  //     await expect(
  //       service.updateTicketAndGroupOrder(ticketId, true, ticketUpdateDto),
  //     ).rejects.toThrow(NotfoundException);
  //   });
  // });
  //
  // describe('removeTicket', () => {
  //   it('should remove a ticket', async () => {
  //     const ticketId = 1;
  //     const ticket: TicketDto = { id: ticketId, userId: 1, isDraft: true };
  //     jest.spyOn(ticketProvider, 'findOneById').mockResolvedValue(ticket);
  //     jest.spyOn(ticketProvider, 'remove').mockResolvedValue(1);
  //
  //     const result = await service.removeTicket(ticketId);
  //     expect(result).toBe(1);
  //   });
  //
  //   it('should throw NotfoundException if ticket not found', async () => {
  //     const ticketId = 1;
  //     jest.spyOn(ticketProvider, 'findOneById').mockResolvedValue(null);
  //
  //     await expect(service.removeTicket(ticketId)).rejects.toThrow(NotfoundException);
  //   });
  // });
  //
  // describe('getOrderPrice', () => {
  //   it('should return the price of an order', async () => {
  //     const orderId = 1;
  //     const order: OrderDto = { id: orderId, userId: 1, paymentStatus: PaymentStatusEnum.UNPAID };
  //     const orderPriceDto = { serviceFee: 100, additionalFee: 50 };
  //     jest.spyOn(orderProvider, 'findOneBy').mockResolvedValue(order);
  //     jest.spyOn(service, 'getPriceData').mockResolvedValue(orderPriceDto);
  //
  //     const result = await service.getOrderPrice(orderId);
  //     expect(result).toEqual(orderPriceDto);
  //   });
  //
  //   it('should throw NotfoundException if order not found', async () => {
  //     const orderId = 1;
  //     jest.spyOn(orderProvider, 'findOneBy').mockResolvedValue(null);
  //
  //     await expect(service.getOrderPrice(orderId)).rejects.toThrow(NotfoundException);
  //   });
  // });
  //
  // describe('getCouponDiscount', () => {
  //   it('should return the discount of a coupon', async () => {
  //     const userId = 1;
  //     const couponCode = 'DISCOUNT10';
  //     const couponResDto = { id: 1, description: '10% off', discount: 10 };
  //     jest.spyOn(service, 'getCouponDiscount').mockResolvedValue(couponResDto);
  //
  //     const result = await service.getCouponDiscount(userId, couponCode);
  //     expect(result).toEqual(couponResDto);
  //   });
  //
  //   it('should throw TicketException if coupon not found', async () => {
  //     const userId = 1;
  //     const couponCode = 'INVALID';
  //     jest
  //       .spyOn(service, 'getCouponDiscount')
  //       .mockRejectedValue(new TicketException('Coupon not found'));
  //
  //     await expect(service.getCouponDiscount(userId, couponCode)).rejects.toThrow(TicketException);
  //   });
  // });
  //
  // describe('createPaymentRequest', () => {
  //   it('should create a payment request', async () => {
  //     const userId = 1;
  //     const orderId = 1;
  //     const couponCode = 'DISCOUNT10';
  //     const paymentReqDto = { MerchantID: '123456', TradeInfo: 'info', TradeSha: 'sha' };
  //     jest.spyOn(service, 'createPaymentRequest').mockResolvedValue(paymentReqDto);
  //
  //     const result = await service.createPaymentRequest(userId, orderId, couponCode);
  //     expect(result).toEqual(paymentReqDto);
  //   });
  //
  //   it('should throw NotfoundException if user not found', async () => {
  //     const userId = 1;
  //     const orderId = 1;
  //     const couponCode = 'DISCOUNT10';
  //     jest.spyOn(userProvider, 'findOneById').mockResolvedValue(null);
  //
  //     await expect(service.createPaymentRequest(userId, orderId, couponCode)).rejects.toThrow(
  //       NotfoundException,
  //     );
  //   });
  // });
  //
  // describe('paymentNotify', () => {
  //   it('should handle payment notification', async () => {
  //     const paymentResDto: NewebpayResDto = { TradeInfo: 'info', TradeSha: 'sha' };
  //     jest.spyOn(service, 'paymentNotify').mockResolvedValue();
  //
  //     await expect(service.paymentNotify(paymentResDto)).resolves.not.toThrow();
  //   });
  // });
  //
  // describe('getPaymentReturnUrl', () => {
  //   it('should return the payment return URL', async () => {
  //     const paymentResDto: NewebpayResDto = { TradeInfo: 'info', TradeSha: 'sha' };
  //     const returnUrl = 'http://example.com/success';
  //     jest.spyOn(service, 'getPaymentReturnUrl').mockResolvedValue(returnUrl);
  //
  //     const result = await service.getPaymentReturnUrl(paymentResDto);
  //     expect(result).toEqual(returnUrl);
  //   });
  // });
  //
  // describe('updateTransactionAndOrderForFirst', () => {
  //   it('should update transaction and order', async () => {
  //     const paymentResDto = { tradeNo: '1234', status: PaymentStatusEnum.SUCCESSFUL, error: null };
  //     jest.spyOn(service, 'updateTransactionAndOrderForFirst').mockResolvedValue();
  //
  //     await expect(service.updateTransactionAndOrderForFirst(paymentResDto)).resolves.not.toThrow();
  //   });
  // });
  //
  // describe('issueInvoice', () => {
  //   it('should issue an invoice', async () => {
  //     const tradeNo = '1234';
  //     jest.spyOn(service, 'issueInvoice').mockResolvedValue();
  //
  //     await expect(service.issueInvoice(tradeNo)).resolves.not.toThrow();
  //   });
  // });

  describe('takeGroupOrderId', () => {
    const template: Partial<TicketDto> = {
      id: null,
      licensePlateNo: 'ABC123',
      driverIdNo: 'D123456789',
      violationFactType: ViolationFactTypeEnum.SPEEDING,
      violationFact: 'Speeding over limit',
      violateAt: DateUtil.zoneDayjs(new Date()).toDate(),
      orderId: null,
    };
    it('原有兩筆連續開單 將其中一筆的時間改為超出原範圍120分 應該要返回 null', () => {
      const updated: Partial<TicketDto> = {
        ...template,
        id: 1,
        orderId: 2,
        violateAt: DateUtil.zoneDayjs(new Date())
          .subtract(150, 'minute')
          .toDate(),
      };

      const ticketDtos: Partial<TicketDto>[] = [
        {
          ...template,
          id: 1,
          orderId: 2,
          violateAt: DateUtil.zoneDayjs(new Date())
            .subtract(6, 'minute')
            .toDate(),
        },
        {
          ...template,
          id: 2,
          orderId: 2,
          violateAt: DateUtil.zoneDayjs(new Date())
            .subtract(10, 'minute')
            .toDate(),
        },
      ];

      const result = service.takeGroupOrderId(updated, ticketDtos);
      expect(result).toBe(null);
    });

    it('原有兩筆連續開單 將其中一筆的時間修改(時間範圍內) 應該要返回 2', () => {
      const updated: Partial<TicketDto> = {
        ...template,
        id: 1,
        orderId: 2,
        violateAt: DateUtil.zoneDayjs(new Date())
          .subtract(15, 'minute')
          .toDate(),
      };

      const ticketDtos: Partial<TicketDto>[] = [
        {
          ...template,
          id: 1,
          orderId: 2,
          violateAt: DateUtil.zoneDayjs(new Date())
            .subtract(6, 'minute')
            .toDate(),
        },
        {
          ...template,
          id: 2,
          orderId: 2,
          violateAt: DateUtil.zoneDayjs(new Date())
            .subtract(10, 'minute')
            .toDate(),
        },
      ];

      const result = service.takeGroupOrderId(updated, ticketDtos);
      expect(result).toBe(2);
    });

    it('原有兩筆連續開單 違規事實類型都是OTHER 將其中一筆的違規事實修改為不同的 應該要返回 null', () => {
      const updated: Partial<TicketDto> = {
        ...template,
        id: 1,
        orderId: 2,
        violateAt: DateUtil.zoneDayjs(new Date())
          .subtract(15, 'minute')
          .toDate(),
        violationFactType: ViolationFactTypeEnum.OTHER,
        violationFact: 'Other violation222',
      };

      const ticketDtos: Partial<TicketDto>[] = [
        {
          ...template,
          id: 1,
          orderId: 2,
          violateAt: DateUtil.zoneDayjs(new Date())
            .subtract(15, 'minute')
            .toDate(),
          violationFactType: ViolationFactTypeEnum.OTHER,
          violationFact: 'Other violation',
        },
        {
          ...template,
          id: 2,
          orderId: 2,
          violateAt: DateUtil.zoneDayjs(new Date())
            .subtract(10, 'minute')
            .toDate(),
        },
      ];

      const result = service.takeGroupOrderId(updated, ticketDtos);
      expect(result).toBe(null);
    });

    it('原訂單有一筆罰單 新增一筆進入該訂單的條件範圍 應該要返回該訂單id = 2', () => {
      const updated: Partial<TicketDto> = {
        ...template,
        id: 2,
        orderId: null,
        violateAt: DateUtil.zoneDayjs(new Date())
          .subtract(10, 'minute')
          .toDate(),
      };

      const ticketDtos: Partial<TicketDto>[] = [
        {
          ...template,
          id: 1,
          orderId: 2,
          violateAt: DateUtil.zoneDayjs(new Date())
            .subtract(6, 'minute')
            .toDate(),
        },
      ];

      const result = service.takeGroupOrderId(updated, ticketDtos);
      expect(result).toBe(2);
    });

    it('目前沒有任何訂單 新增一筆訂單 要返回 null', () => {
      const updated: Partial<TicketDto> = {
        ...template,
        id: 1,
        orderId: null,
        violateAt: DateUtil.zoneDayjs(new Date())
          .subtract(6, 'minute')
          .toDate(),
      };

      const ticketDtos: Partial<TicketDto>[] = [];

      const result = service.takeGroupOrderId(updated, ticketDtos);
      expect(result).toBe(null);
    });

    it('目前只有一筆訂單 更新一筆罰單 要返回訂單id = 2', () => {
      const updated: Partial<TicketDto> = {
        ...template,
        id: 1,
        orderId: 2,
        violateAt: DateUtil.zoneDayjs(new Date())
          .subtract(6, 'minute')
          .toDate(),
      };

      const ticketDtos: Partial<TicketDto>[] = [
        {
          ...template,
          id: 1,
          orderId: 2,
          violateAt: DateUtil.zoneDayjs(new Date())
            .subtract(10, 'minute')
            .toDate(),
        },
      ];

      const result = service.takeGroupOrderId(updated, ticketDtos);
      expect(result).toBe(2);
    });
  });

  describe('calculatePenaltyPrice', () => {
    const serviceFee = 100;

    it('should return service fee if article is not provided', async () => {
      const result = await service.calculatePenaltyPrice(
        '',
        '',
        '',
        undefined,
        serviceFee,
      );
      expect(result).toBe(serviceFee);
    });

    it('should return service fee if penaltyDto is not found', async () => {
      jest.spyOn(penaltyRepository, 'findOne').mockResolvedValue(null);

      const result = await service.calculatePenaltyPrice(
        '1',
        '1',
        '1',
        undefined,
        serviceFee,
      );
      expect(result).toBe(serviceFee);
    });

    it('should return calculated penalty amount if penalty is greater than 0', async () => {
      const fine = 100;
      const penaltyDto = new PenaltyDto({
        article: '1',
        item: '1',
        clause: '1',
        minAmount: 100,
        maxAmount: 1000,
      });
      jest.spyOn(penaltyRepository, 'findOne').mockResolvedValue(penaltyDto);

      const result = await service.calculatePenaltyPrice(
        '1',
        '1',
        '1',
        fine,
        serviceFee,
      );
      expect(result).toBe(fine * 0.15);
    });

    it('should return service fee if penalty amount is 0 or less', async () => {
      const penaltyDto = new PenaltyDto({
        article: '1',
        item: '1',
        clause: '1',
        minAmount: 100,
        maxAmount: 1000,
      });
      jest.spyOn(penaltyRepository, 'findOne').mockResolvedValue(penaltyDto);

      const result = await service.calculatePenaltyPrice(
        '1',
        '1',
        '1',
        undefined,
        serviceFee,
      );
      expect(result).toBe(serviceFee);
    });
  });

  describe('firstPayment', () => {
    let userId: number;
    let orderId: number;
    let createPaymentReqDto: CreatePaymentReqDto;
    let transaction: any;

    beforeEach(() => {
      userId = 1;
      orderId = 1;
      createPaymentReqDto = new CreatePaymentReqDto({
        paymentProvider: PaymentProviderEnum.NEWEBPAY,
        couponCode: 'COUPON123',
      });

      transaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(transaction, 'commit').mockResolvedValue(() => {});
      jest.spyOn(transaction, 'rollback').mockResolvedValue(() => {});
      // (sequelize.transaction as jest.Mock).mockResolvedValue(transaction);
    });

    it('should complete the payment successfully', async () => {
      // Mock dependencies
      const user = new UserDto({ id: userId });
      const order = new OrderDto({ id: orderId, user });
      const transactionDto = new TransactionDto({ totalAmount: 100 });
      const transactionResult = new TransactionDto({ couponId: 123 });
      const paymentData = new NewebpayReq({ Url: 'https://payment.url' });

      jest.spyOn(service, 'checkOrderForFirstPayment').mockResolvedValue(order);
      jest
        .spyOn(service, 'buildFirstTransaction')
        .mockResolvedValue(transactionDto);
      jest
        .spyOn(transactionService, 'create')
        .mockResolvedValue(transactionResult);
      jest.spyOn(paymentService, 'paymentData').mockResolvedValue(paymentData);

      const result = await service.firstPaymentById(
        userId,
        orderId,
        createPaymentReqDto,
      );

      expect(result).toEqual(paymentData);
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(service.checkOrderForFirstPayment).toHaveBeenCalledWith(
        userId,
        orderId,
      );
      expect(service.buildFirstTransaction).toHaveBeenCalledWith(
        user,
        order,
        createPaymentReqDto,
      );
      expect(transactionService.create).toHaveBeenCalledWith(
        transactionDto,
        transaction,
      );
      expect(service.updateUsedCoupon).toHaveBeenCalledWith(
        transactionResult.couponId,
        createPaymentReqDto.couponCode,
        transaction,
      );
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should rollback transaction and throw error if an exception occurs', async () => {
      jest
        .spyOn(service, 'checkOrderForFirstPayment')
        .mockImplementation(() => {
          throw new Error('User or Order not found');
        });

      await expect(
        service.firstPaymentById(userId, orderId, createPaymentReqDto),
      ).rejects.toThrow(TicketException);
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });
});
