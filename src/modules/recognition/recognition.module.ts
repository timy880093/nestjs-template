import { Module } from '@nestjs/common';
import { RecognitionService } from './recognition.service';
import { RecognitionController } from './recognition.controller';

@Module({
  providers: [RecognitionService],
  controllers: [RecognitionController],
  exports: [RecognitionService],
})
export class RecognitionModule {}
