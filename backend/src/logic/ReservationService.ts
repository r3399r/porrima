import { Profile } from '@line/bot-sdk';
import { MessagingApiClient } from '@line/bot-sdk/dist/messaging-api/api';
import { DynamoDB, S3 } from 'aws-sdk';
import { Converter, Key, ScanOutput } from 'aws-sdk/clients/dynamodb';
import { inject, injectable } from 'inversify';
import { Reservation } from 'src/model/Entity';
import { compare } from 'src/utils/compare';

/**
 * Service class for reservation
 */
@injectable()
export class ReservationService {
  @inject(MessagingApiClient)
  private readonly client!: MessagingApiClient;
  @inject(DynamoDB)
  private readonly dynamoDb!: DynamoDB;
  @inject(S3)
  private readonly s3!: S3;
  private readonly tableName = 'Reservation';

  public async scan() {
    let reservations: Reservation[] = [];
    let key: Key | undefined = undefined;
    do {
      const res: ScanOutput = await this.dynamoDb
        .scan({
          TableName: this.tableName,
          ExclusiveStartKey: key,
        })
        .promise();
      if (res.Items)
        reservations = [
          ...reservations,
          ...res.Items.map((v) => Converter.unmarshall(v) as Reservation),
        ];
      key = res.LastEvaluatedKey;
    } while (key !== undefined);

    return reservations.sort(compare('CreatedAt', 'desc'));
  }

  public async getAllReservations(): Promise<
    (Reservation & { Profile: Profile })[]
  > {
    const reservation = await this.scan();
    const userIdSet = new Set(reservation.map((v) => v.UserId));
    const userMap = new Map<string, Profile>();
    const userIdBlock = new Set<string>();
    for (const userId of [...userIdSet])
      if (!userMap.has(userId))
        try {
          const user = await this.client.getProfile(userId);
          userMap.set(userId, user);
        } catch {
          userIdBlock.add(userId);
        }

    const bucket = `${process.env.PROJECT}-${process.env.ENVR}-storage`;

    return reservation
      .filter((v) => !userIdBlock.has(v.UserId))
      .map((v) => {
        const profile = userMap.get(v.UserId);
        if (profile === undefined) throw new Error();

        const photo = v.Photo?.map((v) =>
          this.s3.getSignedUrl('getObject', {
            Bucket: bucket,
            Key: v,
          })
        );

        return {
          ...v,
          MeetingTime: v.MeetingTime ?? '-',
          Photo: photo,
          Profile: profile,
        };
      });
  }
}
