export interface SendSmsRes {
  readonly totalCount: number;
  readonly sendSmsErrors: SendSmsError[];
}

export interface SendSmsError {
  readonly phone: string;
  readonly message: string;
}
