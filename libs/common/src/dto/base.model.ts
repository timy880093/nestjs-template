import { plainToInstance } from 'class-transformer';
import { Column, Model, Table } from 'sequelize-typescript';

@Table({
  timestamps: true, // 自動加 createdAt, updatedAt
  paranoid: true, // 啟用軟刪除 deletedAt, remove 操作會變成 update 此欄位, 且查詢會自動去除有 deletedAt 的結果
})
export class BaseModel extends Model {
  @Column
  createdAt: Date;
  @Column
  updatedAt: Date;
  @Column
  deletedAt: Date;

  toDto<D>(dtoClass?: new () => D): D | undefined {
    if (!this) return undefined;
    return plainToInstance(dtoClass, this.toJSON());
  }

  static toDtoArray<D>(models: BaseModel[], dtoClass?: new () => D): D[] {
    return models.map((model) => model.toDto(dtoClass));
  }
}
