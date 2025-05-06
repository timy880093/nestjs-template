import { AutoIncrement, Column, PrimaryKey, Table } from 'sequelize-typescript';
import { BaseModel } from '../../../common/dto/base.model';

@Table({ tableName: 'penalty' })
export class PenaltyModel extends BaseModel {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ allowNull: false })
  article: string;

  @Column
  item: string;

  @Column
  clause: string;

  @Column
  description: string;

  @Column
  minAmount: number;

  @Column
  maxAmount: number;

  // toDto(): PenaltyDto | undefined {
  //   return super.toDto(PenaltyDto);
  // }
  //
  // static toDtoArray(models: PenaltyModel[]): PenaltyDto[] {
  //   return super.toDtoArray(models, PenaltyDto);
  // }
}
