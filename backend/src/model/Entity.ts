export enum Status {
  Step1Greeting = 'greeting',
  Step2SelectOrderType = 'order-type',
  Step3SelectTargetType = 'target-type',
  Step4SelectQuantity = 'quantity',
  Step5RequestPhoto = 'photo',
  Step6SelectMeetingType = 'meeting-type',
  Step7SelectMeetingTime = 'meeting-time',
  Step8ExtraComment = 'extra-comment',
  Step9End = 'end',
}

export enum Step1 {
  Repair = '修理',
  Custom = 'カスタム',
  Rework = 'ReWork',
  Other = 'その他',
  Back = '戻る',
}

export enum Step2 {
  Wallet = 'お財布',
  Bags = '鞄・バッグ',
  Accessories = '小物',
  Back = '戻る',
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
