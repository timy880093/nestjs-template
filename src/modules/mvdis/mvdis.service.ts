import { Injectable } from '@nestjs/common';
import axios from 'axios';
import dayjs from 'dayjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ErrorTypes } from 'src/common/dto/error-code.const';
import { MvdisException } from 'src/common/exception/mvdis.exception';
import { TrackEventEnum } from '../../common/dto/track-event.enum';
import { StatisticService } from '../statistic';
import { CrawlerTicketResultDto } from './dto/crawler-ticket-result.dto';
import { CrawlerTicketDto } from './dto/crawler-ticket.dto';
import { MvdisListResDto } from './dto/mvdis-List-res.dto';
import { MvdisOwnerModel } from './entity/mvdis-owner.model';
import MvdisConfog from './mvdis.config';
import { MvdisRepository } from './mvdis.repository';

@Injectable()
export class MvdisService {
  constructor(
    @InjectPinoLogger(MvdisService.name)
    private readonly logger: PinoLogger,
    private readonly mvdisRepository: MvdisRepository,
    private readonly statisticService: StatisticService,
    private readonly sequelize: Sequelize,
  ) {
    const frontendURL = process.env.FRONTEND_URL;
  }

  async createMvdisOwner(
    userId: number,
    data: { uid: string; birthday: string },
  ) {
    const { uid, birthday } = data;
    const owner = await this.mvdisRepository.checkOwnerExist({
      userId,
      uid,
      birthday,
    });
    if (owner)
      throw new MvdisException(
        '車主已存在',
        ErrorTypes.MVDIS_UID_OR_BIRTH_NOT_FOUND,
      );
    if (birthday.length !== 7)
      throw new MvdisException(
        '身分證字號或出生年月日錯誤',
        ErrorTypes.MVDIS_UID_OR_BIRTH_NOT_FOUND,
      );

    const crawlerTickets = await this.getCrawlerMvdisTicketsApi(data);

    const transaction = await this.sequelize.transaction();
    try {
      await this.mvdisRepository.createMvdisOwner(
        { userId, uid, birthday, crawledAt: new Date() },
        crawlerTickets,
        transaction,
      );
      await transaction.commit();
      await this.statisticService.recordSuccessEventVoid(
        TrackEventEnum.PROXY_SEARCH_TICKET,
      );
    } catch (e) {
      if (transaction) await transaction.rollback();
      throw new MvdisException(
        'createMvdisOwner error: ',
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  async deleteMvdisOwner(ownerId: number, userId: number) {
    const transaction = await this.sequelize.transaction();
    try {
      await this.mvdisRepository.deleteMvdisList(
        { ownerId, userId },
        transaction,
      );
      await transaction.commit();
    } catch (e) {
      if (transaction) await transaction.rollback();
      throw new MvdisException(
        'deleteMvdisOwner error',
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  async findMvdisTickets(userId: number) {
    const transaction = await this.sequelize.transaction();

    try {
      const mvdisOwners = await this.mvdisRepository.findAllMvdisOwner(
        {
          userId,
          crawledAt: { [Op.lte]: dayjs().subtract(1, 'day').toDate() },
        },
        true,
        transaction,
      );
      const mvdisResults = await this.fetchMvdisTicketApi(mvdisOwners);
      const newMvdisOwners = await this.updateMvdis(
        userId,
        mvdisResults,
        transaction,
      );
      const results = newMvdisOwners.map((m) => new MvdisListResDto(m));
      this.logger.debug({ a: results }, 'findMvdisTickets OK: ');
      await transaction.commit();
      return results;
    } catch (e) {
      if (transaction) await transaction.rollback();
      throw new MvdisException(
        'findMvdisTickets error',
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  private async getCrawlerMvdisTicketsApi(data: {
    uid: string;
    birthday: string;
  }): Promise<CrawlerTicketDto[]> {
    try {
      const url = MvdisConfog().crawlerMvdisUrl;
      const tickets = await axios.post(url, data);
      return tickets.data as CrawlerTicketDto[];
    } catch (e) {
      const errorData = e?.response?.data;
      if (!errorData)
        throw new MvdisException(
          'crawler server error: ',
          ErrorTypes.SERVER_ERROR,
          e,
        );
      throw new MvdisException(
        errorData?.message,
        errorData?.statusCode === 404
          ? ErrorTypes.MVDIS_UID_OR_BIRTH_NOT_FOUND
          : ErrorTypes.MVDIS_RETRY_ERROR,
      );
    }
  }

  async fetchMvdisTicketApi(
    mvdisList: MvdisOwnerModel[],
  ): Promise<CrawlerTicketResultDto[]> {
    // 同步依序 call api
    try {
      const results = [];
      for (const mvdisOwner of mvdisList) {
        mvdisOwner.crawledAt = new Date();
        const crawlerTickets = await this.getCrawlerMvdisTicketsApi(mvdisOwner);
        results.push({ mvdisOwner, crawlerTickets });
      }
      return results;
    } catch (e) {
      throw new MvdisException(
        'fetchMvdisTicketApi error',
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  async updateMvdis(
    userId: number,
    results: CrawlerTicketResultDto[],
    transaction?: Transaction,
  ): Promise<MvdisOwnerModel[]> {
    try {
      for (const { mvdisOwner, crawlerTickets } of results) {
        mvdisOwner.crawledAt = new Date();
        await this.mvdisRepository.renewMvdisTicketList(
          mvdisOwner.id,
          crawlerTickets,
          transaction,
        );
        await mvdisOwner.save({ transaction });
      }
      return this.mvdisRepository.findMvdisList(userId, transaction);
    } catch (e) {
      throw new MvdisException('updateMvdis error', ErrorTypes.SERVER_ERROR, e);
    }
  }

  private async fetchAndUpdateMvdisTickets(
    mvdisList: MvdisOwnerModel[],
    transaction: Transaction,
  ) {
    for (const mvdisOwner of mvdisList) {
      // if (dayjs(mvdisOwner.crawledAt).isBefore(dayjs().subtract(1, 'day'))) {
      mvdisOwner.crawledAt = new Date();
      const crawlerTickets = await this.getCrawlerMvdisTicketsApi(mvdisOwner);
      await this.mvdisRepository.renewMvdisTicketList(
        mvdisOwner.id,
        crawlerTickets,
        transaction,
      );
      await mvdisOwner.save({ transaction });
      // }
    }
  }
}
