import 'reflect-metadata';
import { MessagingApiClient } from '@line/bot-sdk/dist/messaging-api/api';
import { Container } from 'inversify';
import { ChatService } from './logic/ChatService';

const container: Container = new Container();

// service
container.bind<ChatService>(ChatService).toSelf();

// AWS
container.bind(MessagingApiClient).toDynamicValue(
  () =>
    new MessagingApiClient({
      channelAccessToken: process.env.CHANNEL_TOKEN || '',
    })
);

export { container as bindings };
