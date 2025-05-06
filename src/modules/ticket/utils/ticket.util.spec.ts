import { TicketUtil } from './ticket.util';
import { TicketDto } from '../dto/ticket.dto';
import { TicketException } from '../../../common/exception/ticket.exception';
import { DateUtil } from '../../../common/util/date.util';

describe('TicketUtil', () => {
  let serviceFee: number;
  let additionalFee: number;
  let urgentDays: number;
  beforeEach(async () => {
    serviceFee = 199;
    additionalFee = 100;
    urgentDays = 7;
  });
  describe('calculateRemainingDays', () => {
    it('should return null if tickets is not an array', () => {
      expect(
        TicketUtil.calculateRemainingDays(null, DateUtil.twDayjs().toDate()),
      ).toBeNull();
    });
    it('should return null if tickets is empty array', () => {
      expect(
        TicketUtil.calculateRemainingDays([], DateUtil.twDayjs().toDate()),
      ).toBeNull();
    });
    it('should return the remaining days until the earliest unpaid ticket expires', () => {
      const tickets: Partial<TicketDto>[] = [
        { isTicketPaid: false, expiresAt: new Date('2024-10-20') },
        { isTicketPaid: false, expiresAt: new Date('2024-10-25') },
      ];
      const today = new Date('2024-10-10');
      jest.spyOn(DateUtil, 'diffTaipei').mockReturnValue(10);

      const result = TicketUtil.calculateRemainingDays(tickets, today);

      expect(result).toBe(10);
    });

    it('should return null if there are no unpaid tickets', () => {
      const tickets: Partial<TicketDto>[] = [
        { isTicketPaid: true, expiresAt: new Date('2024-10-20') },
      ];
      const today = new Date('2024-10-10');

      const result = TicketUtil.calculateRemainingDays(tickets, today);

      expect(result).toBe(null);
    });
  });

  describe('calculateTicketsPrice', () => {
    it('should return the correct price with additional fee if within urgent days', async () => {
      const tickets: Partial<TicketDto>[] = [
        { isTicketPaid: false, expiresAt: new Date('2024-10-10') },
      ];
      const today = new Date('2024-10-05');
      jest.spyOn(TicketUtil, 'calculateRemainingDays').mockReturnValue(5);

      const result = await TicketUtil.calculateTicketsPrice(
        tickets,
        today,
        100,
        50,
        7,
      );

      expect(result).toEqual({ serviceFee: 100, additionalFee: 50 });
    });

    it('should return the correct price without additional fee if outside urgent days', async () => {
      const tickets: Partial<TicketDto>[] = [
        { isTicketPaid: false, expiresAt: new Date('2024-11-01') },
      ];
      const today = new Date('2024-10-10');
      jest.spyOn(TicketUtil, 'calculateRemainingDays').mockReturnValue(20);

      const result = await TicketUtil.calculateTicketsPrice(
        tickets,
        today,
        100,
        50,
        7,
      );

      expect(result).toEqual({ serviceFee: 100, additionalFee: null });
    });

    it('should throw TicketException if tickets is not an array', async () => {
      await expect(
        TicketUtil.calculateTicketsPrice(
          null,
          DateUtil.twDayjs().toDate(),
          serviceFee,
          additionalFee,
          urgentDays,
        ),
      ).rejects.toThrow(TicketException);
    });

    it('should throw TicketException if tickets is empty array', async () => {
      await expect(
        TicketUtil.calculateTicketsPrice(
          [],
          DateUtil.twDayjs().toDate(),
          serviceFee,
          additionalFee,
          urgentDays,
        ),
      ).rejects.toThrow(TicketException);
    });

    it('should return OrderPriceDto with additionalFee if remainingDays <= urgentDays about 0 day', async () => {
      const tickets: Partial<TicketDto>[] = [
        {
          isTicketPaid: false,
          expiresAt: DateUtil.twDayjs().add(1, 'h').toDate(),
        },
      ];
      TicketUtil.calculateRemainingDays = jest.fn().mockReturnValue(0);
      const result = await TicketUtil.calculateTicketsPrice(
        tickets,
        DateUtil.twDayjs().toDate(),
        serviceFee,
        additionalFee,
        urgentDays,
      );
      expect(result).toEqual({
        serviceFee: serviceFee,
        additionalFee: additionalFee,
      });
    });

    it('should return OrderPriceDto with additionalFee if remainingDays <= urgentDays', async () => {
      const tickets: Partial<TicketDto>[] = [
        {
          isTicketPaid: false,
          expiresAt: DateUtil.twDayjs().add(2, 'd').toDate(),
        },
      ];
      // TicketUtil.calculateRemainingDays = jest.fn().mockReturnValue(2);
      const result = await TicketUtil.calculateTicketsPrice(
        tickets,
        DateUtil.twDayjs().toDate(),
        serviceFee,
        additionalFee,
        urgentDays,
      );
      expect(result).toEqual({
        serviceFee: serviceFee,
        additionalFee: additionalFee,
      });
    });

    it('should return OrderPriceDto without additionalFee if remainingDays > urgentDays', async () => {
      const tickets: Partial<TicketDto>[] = [
        {
          isTicketPaid: false,
          expiresAt: DateUtil.twDayjs().add(8, 'd').toDate(),
        },
      ];
      TicketUtil.calculateRemainingDays = jest.fn().mockReturnValue(8);

      const result = await TicketUtil.calculateTicketsPrice(
        tickets,
        DateUtil.twDayjs().toDate(),
        serviceFee,
        additionalFee,
        urgentDays,
      );
      expect(result).toEqual({ serviceFee: serviceFee, additionalFee: null });
    });

    it('should throw TicketException if an error occurs', async () => {
      const tickets: Partial<TicketDto>[] = [
        {
          isTicketPaid: false,
          expiresAt: DateUtil.twDayjs().add(5, 'd').toDate(),
        },
      ];
      TicketUtil.calculateRemainingDays = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      await expect(
        TicketUtil.calculateTicketsPrice(
          tickets,
          DateUtil.twDayjs().toDate(),
          serviceFee,
          additionalFee,
          urgentDays,
        ),
      ).rejects.toThrow(TicketException);
    });
  });

  describe('calculateProfit', () => {
    const profitRate = 0.15;
    it('input 1000 should be 159', () => {
      const amount = 1000;
      const result = TicketUtil.calculateProfit(amount, profitRate);
      expect(result).toBe(159);
    });

    it('input 300 should be 49', () => {
      const amount = 300;
      const result = TicketUtil.calculateProfit(amount, profitRate);
      expect(result).toBe(49);
    });

    it('input 36000 should be 5409', () => {
      const amount = 36000;
      const result = TicketUtil.calculateProfit(amount, profitRate);
      expect(result).toBe(5409);
    });
  });

  describe('calculateDynamicAmount', () => {
    it('600 => 89', () => {
      const amount = 600;
      const result = TicketUtil.calculateServiceFee(amount);
      console.log('result', result);
      expect(result).toBe(89);
    });
    it('1800 => 139', () => {
      const amount = 1800;
      const result = TicketUtil.calculateServiceFee(amount);
      console.log('result', result);
      expect(result).toBe(139);
    });
    it('4800 => 179', () => {
      const amount = 4800;
      const result = TicketUtil.calculateServiceFee(amount);
      console.log('result', result);
      expect(result).toBe(179);
    });
    it('8000 => 199', () => {
      const amount = 8000;
      const result = TicketUtil.calculateServiceFee(amount);
      console.log('result', result);
      expect(result).toBe(199);
    });
    it('20000 => 229', () => {
      const amount = 20000;
      const result = TicketUtil.calculateServiceFee(amount);
      console.log('result', result);
      expect(result).toBe(229);
    });
    it('30000 => 249', () => {
      const amount = 30000;
      const result = TicketUtil.calculateServiceFee(amount);
      console.log('result', result);
      expect(result).toBe(249);
    });
  });
});
