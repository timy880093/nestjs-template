import { MailLogCategory } from '../../mail-log/dto/mail-log.enum';

export interface ProgressMailDto {
  subject: string;
  template: string;
  category: MailLogCategory;
  context: Record<string, any>;
}
