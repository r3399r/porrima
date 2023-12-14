import 'reflect-metadata';
import {
  MessagingApiBlobClient,
  MessagingApiClient,
} from '@line/bot-sdk/dist/messaging-api/api';
import { DynamoDB, S3 } from 'aws-sdk';
import { Container } from 'inversify';
import { ChatService } from './logic/ChatService';
import { ReservationService } from './logic/ReservationService';

const container: Container = new Container();

// service
container.bind(ChatService).toSelf();
container.bind(ReservationService).toSelf();

// LINE
container.bind(MessagingApiClient).toDynamicValue(
  () =>
    new MessagingApiClient({
      channelAccessToken: process.env.CHANNEL_TOKEN || '',
    })
);
container.bind(MessagingApiBlobClient).toDynamicValue(
  () =>
    new MessagingApiBlobClient({
      channelAccessToken: process.env.CHANNEL_TOKEN || '',
    })
);

// AWS
container.bind(DynamoDB).toDynamicValue(() => new DynamoDB());
container.bind(S3).toDynamicValue(() => new S3());

export { container as bindings };
