import 'reflect-metadata';
import { MessagingApiClient } from '@line/bot-sdk/dist/messaging-api/api';
import { DynamoDB } from 'aws-sdk';
import { Container } from 'inversify';
import { ChatService } from './logic/ChatService';

const container: Container = new Container();

// service
container.bind<ChatService>(ChatService).toSelf();

// LINE
container.bind(MessagingApiClient).toDynamicValue(
  () =>
    new MessagingApiClient({
      channelAccessToken: process.env.CHANNEL_TOKEN || '',
    })
);

// AWS
container.bind(DynamoDB).toDynamicValue(() => new DynamoDB());

export { container as bindings };
