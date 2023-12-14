import { Readable } from 'stream';
import {
  FollowEvent,
  MessageEvent,
  PostbackEvent,
  WebhookEvent,
  WebhookRequestBody,
} from '@line/bot-sdk';
import {
  MessagingApiBlobClient,
  MessagingApiClient,
} from '@line/bot-sdk/dist/messaging-api/api';
import { DynamoDB, S3 } from 'aws-sdk';
import { Converter } from 'aws-sdk/clients/dynamodb';
import { format } from 'date-fns';
import { fromBuffer } from 'file-type';
import { inject, injectable } from 'inversify';
import {
  MeetingType,
  OrderType,
  Reservation,
  Status,
  TargetType,
} from 'src/model/Entity';
import { InternalServerError } from 'src/model/error';
import { compare } from 'src/util/compare';

/**
 * Service class for chat
 */
@injectable()
export class ChatService {
  @inject(MessagingApiClient)
  private readonly client!: MessagingApiClient;
  @inject(MessagingApiBlobClient)
  private readonly blobClient!: MessagingApiBlobClient;
  @inject(DynamoDB)
  private readonly dynamoDb!: DynamoDB;
  @inject(S3)
  private readonly s3!: S3;
  private readonly tableName = 'Reservation';

  private async getReservation(userId: string) {
    const res = await this.dynamoDb
      .query({
        ExpressionAttributeValues: {
          ':v1': { S: userId },
        },
        KeyConditionExpression: 'UserId = :v1',
        TableName: this.tableName,
      })
      .promise();
    if (res.Items)
      return (
        res.Items.map((v) => Converter.unmarshall(v)) as Reservation[]
      ).sort(compare('CreatedAt', 'desc'));
    throw new InternalServerError('unexpected error');
  }

  private async saveReservation(data: Reservation) {
    await this.dynamoDb
      .putItem({ Item: Converter.marshall(data), TableName: this.tableName })
      .promise();
  }

  private async deleteReservation(data: Reservation) {
    await this.dynamoDb
      .deleteItem({
        Key: Converter.marshall({
          UserId: data.UserId,
          CreatedAt: data.CreatedAt,
        }),
        TableName: this.tableName,
      })
      .promise();
  }

  private genPostbackAction(
    data: string,
    label?: string,
    displayText?: string
  ) {
    return {
      type: 'action',
      action: {
        type: 'postback',
        label: label ?? data,
        displayText: displayText ?? label ?? data,
        data,
      },
    };
  }

  private async sendStep1Message(token: string, username: string) {
    await this.client.replyMessage({
      replyToken: token,
      messages: [
        {
          type: 'text',
          text: `こんにちは。${username}さん、本日はどのようなご用件でしょうか?`,
          quickReply: {
            items: [
              this.genPostbackAction(OrderType.Repair),
              this.genPostbackAction(OrderType.Custom),
              this.genPostbackAction(OrderType.Rework),
              this.genPostbackAction(OrderType.Other),
              this.genPostbackAction(OrderType.Back),
            ],
          },
        },
      ],
    });
  }

  private async sendStep2Message(token: string) {
    await this.client.replyMessage({
      replyToken: token,
      messages: [
        {
          type: 'text',
          text: 'お財布 / 鞄・バッグ / 小物 / 戻る',
          quickReply: {
            items: [
              this.genPostbackAction(TargetType.Wallet),
              this.genPostbackAction(TargetType.Bags),
              this.genPostbackAction(TargetType.Accessories),
              this.genPostbackAction(TargetType.Back),
            ],
          },
        },
      ],
    });
  }

  private async sendStep3Message(token: string) {
    await this.client.replyMessage({
      replyToken: token,
      messages: [
        {
          type: 'text',
          text: '修理/カスタム対象個所は何か所ありますでしょうか?',
          quickReply: {
            items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(
              (v) => this.genPostbackAction(v)
            ),
          },
        },
      ],
    });
  }

  private async sendStep4Message(token: string) {
    await this.client.replyMessage({
      replyToken: token,
      messages: [
        {
          type: 'template',
          altText: 'アップロード',
          template: {
            type: 'buttons',
            text: '修理/カスタム対象の全体像と詳細箇所の写真をお願いします!\nアップロードが終わり次第「完了」ボタンを押してください!',
            actions: [{ type: 'camera', label: 'アップロード' }],
          },
        },
      ],
    });
  }

  private async sendStep5Message(token: string) {
    await this.client.replyMessage({
      replyToken: token,
      messages: [
        {
          type: 'text',
          text: 'お写真ありがとうございます。 改めて状態を確認したうえで料金等ご相談したいのですが\n以下、ご都合はいかがでしょうか?',
          quickReply: {
            items: [
              this.genPostbackAction(MeetingType.Online),
              this.genPostbackAction(MeetingType.Store),
              this.genPostbackAction(MeetingType.No),
            ],
          },
        },
      ],
    });
  }

  private async sendStep6Message(token: string) {
    await this.client.replyMessage({
      replyToken: token,
      messages: [
        {
          type: 'template',
          altText: 'ご予約',
          template: {
            type: 'buttons',
            text: 'Choose a Time&date of Online/Shop meeting',
            actions: [
              {
                type: 'datetimepicker',
                label: 'ご予約',
                data: 'ご予約',
                mode: 'datetime',
              },
            ],
          },
        },
      ],
    });
  }

  private async sendStep7Message(
    token: string,
    meeting?: { type: string; time: string }
  ) {
    const message = {
      type: 'text',
      text: '他、当店にお伝えしたいことはありますでしょうか?\ntype "No" if no extra comment',
    };
    await this.client.replyMessage({
      replyToken: token,
      messages: meeting
        ? [
            {
              type: 'text',
              text: `ご予約ありがとうございます。${format(
                new Date(meeting.time),
                'yyyy/MM/ddのHH:mm'
              )}~、${meeting.type} ご予約を承りました。`,
            },
            message,
          ]
        : [message],
    });
  }

  private async handleMessageEvent(event: MessageEvent) {
    if (event.source.type !== 'user') return;
    const user = await this.client.getProfile(event.source.userId);
    const reservation = await this.getReservation(event.source.userId);
    const latestReservation = reservation.length > 0 ? reservation[0] : null;
    if (event.message.type === 'text' && event.message.text === '予約する')
      if (
        latestReservation === null ||
        latestReservation.Status === Status.Step8End
      )
        await this.sendStep1Message(event.replyToken, user.displayName);
      else if (latestReservation.Status === Status.Step2SelectTargetType)
        await this.sendStep2Message(event.replyToken);
      else if (latestReservation.Status === Status.Step3SelectQuantity)
        await this.sendStep3Message(event.replyToken);
      else if (latestReservation.Status === Status.Step4RequestPhoto)
        await this.sendStep4Message(event.replyToken);

    if (
      event.message.type === 'text' &&
      latestReservation?.Status === Status.Step7ExtraComment
    ) {
      await this.saveReservation({
        ...latestReservation,
        Status: Status.Step8End,
        Comment: event.message.text,
      });
      await this.client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'text',
            text: 'ありがとうございます。',
          },
          {
            type: 'text',
            text: `今回のチャットでは以下の通りとなりました。ご確認ください。\nご用件 : ${
              latestReservation.OrderType
            }\n修理対象 : ${latestReservation.TargetType}\n修理箇所 : ${
              latestReservation.Quantity
            }\n写真 : アップロードいただいた通り\nご相談 : ${
              latestReservation.MeetingType
            }\nご相談日時 : ${
              latestReservation.MeetingTime
                ? format(
                    new Date(latestReservation.MeetingTime),
                    'yyyy/MM/ddのHH:mm'
                  )
                : '-'
            }\nその他 : ${event.message.text}`,
          },
          {
            type: 'text',
            text: 'この度はご利用ありがとうございました。また、ご連絡差し上げます。',
          },
        ],
      });
    }

    if (
      event.message.type === 'image' &&
      latestReservation?.Status === Status.Step4RequestPhoto
    ) {
      const contentStream = await this.blobClient.getMessageContent(
        event.message.id
      );
      const bucket = `${process.env.PROJECT}-${process.env.ENVR}-storage`;

      const chunks = [];
      for await (const chunk of contentStream) chunks.push(chunk);

      const buffer = Buffer.concat(chunks);

      const fileType = await fromBuffer(buffer);
      const filename = `${user.userId}/${
        latestReservation.CreatedAt
      }/${Date.now()}.${fileType?.ext}`;
      const readableStream = new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        },
      });
      await this.s3
        .upload({
          Body: readableStream,
          Bucket: bucket,
          Key: filename,
        })
        .promise();
      await this.saveReservation({
        ...latestReservation,
        Photo: latestReservation.Photo
          ? [...latestReservation.Photo, filename]
          : [filename],
      });
      await this.client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'template',
            altText: '完了?',
            template: {
              type: 'buttons',
              text: '完了?',
              actions: [{ type: 'postback', label: '完了', data: '完了' }],
            },
          },
        ],
      });
    }
  }

  private async handlePostbackEvent(event: PostbackEvent) {
    if (event.source.type !== 'user') return;
    const user = await this.client.getProfile(event.source.userId);
    const reservation = await this.getReservation(event.source.userId);
    const latestReservation = reservation.length > 0 ? reservation[0] : null;

    if (
      latestReservation === null ||
      latestReservation.Status === Status.Step8End
    )
      if (event.postback.data === OrderType.Rework)
        await this.client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            { type: 'text', text: '申し訳ございません。ReWorkは準備中です' },
          ],
        });
      else if (event.postback.data === OrderType.Other) {
        await this.saveReservation({
          UserId: user.userId,
          CreatedAt: new Date().toISOString(),
          Status: Status.Step8End,
          OrderType: event.postback.data,
        });
        await this.client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: 'text',
              text: 'Free Comment and Our employee will see comment',
            },
            {
              type: 'text',
              text: 'この度はご利用ありがとうございました。また、ご連絡差し上げます。',
            },
          ],
        });
      } else if (
        event.postback.data === OrderType.Repair ||
        event.postback.data === OrderType.Custom
      ) {
        await this.saveReservation({
          UserId: user.userId,
          CreatedAt: new Date().toISOString(),
          Status: Status.Step2SelectTargetType,
          OrderType: event.postback.data,
        });
        await this.sendStep2Message(event.replyToken);
      } else await this.sendStep1Message(event.replyToken, user.displayName);
    else if (latestReservation.Status === Status.Step2SelectTargetType)
      if (
        event.postback.data === TargetType.Wallet ||
        event.postback.data === TargetType.Bags ||
        event.postback.data === TargetType.Accessories
      ) {
        await this.saveReservation({
          ...latestReservation,
          Status: Status.Step3SelectQuantity,
          TargetType: event.postback.data,
        });
        await this.sendStep3Message(event.replyToken);
      } else if (event.postback.data === TargetType.Back) {
        await this.deleteReservation(latestReservation);
        await this.sendStep1Message(event.replyToken, user.displayName);
      } else await this.sendStep2Message(event.replyToken);
    else if (latestReservation.Status === Status.Step3SelectQuantity)
      if (
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(
          event.postback.data
        )
      ) {
        await this.saveReservation({
          ...latestReservation,
          Status: Status.Step4RequestPhoto,
          Quantity: Number(event.postback.data),
        });
        await this.sendStep4Message(event.replyToken);
      } else await this.sendStep3Message(event.replyToken);
    else if (latestReservation.Status === Status.Step4RequestPhoto)
      if (event.postback.data === '完了') {
        await this.saveReservation({
          ...latestReservation,
          Status: Status.Step5SelectMeetingType,
        });
        await this.sendStep5Message(event.replyToken);
      } else await this.sendStep4Message(event.replyToken);
    else if (latestReservation.Status === Status.Step5SelectMeetingType)
      if (
        event.postback.data === MeetingType.Online ||
        event.postback.data === MeetingType.Store
      ) {
        await this.saveReservation({
          ...latestReservation,
          Status: Status.Step6SelectMeetingTime,
          MeetingType: event.postback.data,
        });
        await this.sendStep6Message(event.replyToken);
      } else if (event.postback.data === MeetingType.No) {
        await this.saveReservation({
          ...latestReservation,
          Status: Status.Step7ExtraComment,
          MeetingType: event.postback.data,
        });
        await this.sendStep7Message(event.replyToken);
      } else await this.sendStep5Message(event.replyToken);
    else if (latestReservation.Status === Status.Step6SelectMeetingTime)
      if (event.postback.data === 'ご予約' && event.postback.params) {
        const datetime = (event.postback.params as { datetime: string })
          .datetime;
        await this.saveReservation({
          ...latestReservation,
          Status: Status.Step7ExtraComment,
          MeetingTime: datetime,
        });
        await this.sendStep7Message(event.replyToken, {
          type: latestReservation.MeetingType ?? '',
          time: datetime,
        });
      } else await this.sendStep6Message(event.replyToken);
    else if (latestReservation.Status === Status.Step7ExtraComment)
      await this.sendStep7Message(event.replyToken);
  }

  private async handleFollowEvent(event: FollowEvent) {
    if (event.source.type !== 'user') return;
    const botInfo = await this.client.getBotInfo();
    const user = await this.client.getProfile(event.source.userId);

    await this.client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: `${user.displayName}さん\nはじめまして！${botInfo.displayName}です。\n友だち追加ありがとうございます\n\nこのアカウントでは、最新情報を定期的に配信していきます\nどうぞお楽しみに`,
        },
        { type: 'text', text: 'Please type "予約する" to start reservation' },
      ],
    });
  }

  private async handleWebhookEvent(event: WebhookEvent) {
    if (event.type === 'message') await this.handleMessageEvent(event);
    if (event.type === 'postback') await this.handlePostbackEvent(event);
    else if (event.type === 'follow') await this.handleFollowEvent(event);
  }

  public async handleRequestBody(event: WebhookRequestBody) {
    for (const ev of event.events) await this.handleWebhookEvent(ev);
  }
}
