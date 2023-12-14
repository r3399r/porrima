import { WebhookRequestBody } from '@line/bot-sdk';
import { MessagingApiClient } from '@line/bot-sdk/dist/messaging-api/api';
import { inject, injectable } from 'inversify';

/**
 * Service class for chat
 */
@injectable()
export class ChatService {
  @inject(MessagingApiClient)
  private readonly client!: MessagingApiClient;

  public async chat(event: WebhookRequestBody) {
    for (const e of event.events) {
      if (e.type !== 'message' || !e.message || e.message.type !== 'text')
        return;

      await this.client.replyMessage({
        replyToken: e.replyToken,
        messages: [
          {
            type: 'text',
            text: 'hello world',
          },
        ],
      });
    }
  }
}
