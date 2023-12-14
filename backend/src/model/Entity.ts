export enum Status {
  Step1SelectOrderType = 'order-type',
  Step2SelectTargetType = 'target-type',
  Step3SelectQuantity = 'quantity',
  Step4RequestPhoto = 'photo',
  Step5SelectMeetingType = 'meeting-type',
  Step6SelectMeetingTime = 'meeting-time',
  Step7ExtraComment = 'extra-comment',
  Step8End = 'end',
}

export enum OrderType {
  Repair = '修理',
  Custom = 'カスタム',
  Rework = 'ReWork',
  Other = 'その他',
  Back = '戻る',
}

export enum TargetType {
  Wallet = 'お財布',
  Bags = '鞄・バッグ',
  Accessories = '小物',
  Back = '戻る',
}

export enum MeetingType {
  Online = 'オンライン通話でご相談',
  Store = '店頭でご相談',
  No = '相談不要',
}

export type Reservation = {
  UserId: string;
  CreatedAt: string;
  Status: Status;
  OrderType?: string;
  TargetType?: string;
  Quantity?: number;
  Photo?: string[];
  MeetingType?: string;
  MeetingTime?: string;
  Comment?: string;
};
