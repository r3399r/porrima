import { WebhookRequestBody } from '@line/bot-sdk';
import { bindings } from 'src/bindings';
import { ChatService } from 'src/logic/ChatService';
import { BadRequestError } from 'src/model/error';
import { LambdaEvent } from 'src/model/Lambda';

let event: LambdaEvent;
let service: ChatService;

export default async (lambdaEvent: LambdaEvent) => {
  event = lambdaEvent;
  service = bindings.get(ChatService);

  switch (event.resource) {
    case '/api/line':
      return await defaultLine();
  }

  throw new BadRequestError('unexpected resource');
};

const defaultLine = async () => {
  switch (event.httpMethod) {
    case 'POST':
      if (event.body === null)
        throw new BadRequestError('body should not be empty');

      return await service.handleRequestBody(
        JSON.parse(event.body) as WebhookRequestBody
      );
  }

  throw new Error('unexpected httpMethod');
};
