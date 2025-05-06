import { Injectable } from '@nestjs/common';

@Injectable()
export class TaskService {
  constructor() {}

  async checkAndRecognize() {
    console.log('checkAndRecognize');
  }
}
