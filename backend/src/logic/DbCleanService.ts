import { MessagingApiClient } from '@line/bot-sdk/dist/messaging-api/api';
import { DynamoDB, S3 } from 'aws-sdk';
import { Converter } from 'aws-sdk/clients/dynamodb';
import { DeleteObjectsRequest } from 'aws-sdk/clients/s3';
import { inject, injectable } from 'inversify';
import { Reservation, Status } from 'src/model/Entity';
import { ReservationService } from './ReservationService';

/**
 * Service class for dbClean
 */
@injectable()
export class DbCleanService {
  @inject(MessagingApiClient)
  private readonly client!: MessagingApiClient;
  @inject(DynamoDB)
  private readonly dynamoDb!: DynamoDB;
  @inject(S3)
  private readonly s3!: S3;
  @inject(ReservationService)
  private readonly reservationService!: ReservationService;
  private readonly tableName = 'Reservation';

  private async emptyS3Directory(dir: string) {
    const bucket = `${process.env.PROJECT}-${process.env.ENVR}-storage`;
    const listParams = {
      Bucket: bucket,
      Prefix: dir,
    };

    const listedObjects = await this.s3.listObjectsV2(listParams).promise();

    if (
      listedObjects.Contents === undefined ||
      listedObjects.Contents.length === 0
    )
      return;

    const deleteParams: DeleteObjectsRequest = {
      Bucket: bucket,
      Delete: { Objects: [] },
    };

    listedObjects.Contents.forEach(({ Key }) => {
      if (Key) deleteParams.Delete.Objects.push({ Key });
    });

    await this.s3.deleteObjects(deleteParams).promise();

    if (listedObjects.IsTruncated) await this.emptyS3Directory(dir);
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

  public async cleanup() {
    const reservation = await this.reservationService.scan();

    const userIdSet = new Set(reservation.map((v) => v.UserId));
    const userIdFriend = new Set<string>();
    const userIdBlock = new Set<string>();
    for (const userId of [...userIdSet])
      try {
        await this.client.getProfile(userId);
        userIdFriend.add(userId);
      } catch {
        userIdBlock.add(userId);
      }

    // delete blocked users
    for (const userId of [...userIdBlock]) {
      await this.emptyS3Directory(userId);
      await Promise.all(
        reservation
          .filter((v) => v.UserId === userId)
          .map((v) => this.deleteReservation(v))
      );
    }

    // check unfinished process and delete for 24hr expired
    for (const r of reservation) {
      if (r.Status === Status.Step8End) continue;
      const createdAt = new Date(r.CreatedAt).getTime();
      if (Date.now() - createdAt > 24 * 60 * 60 * 1000) {
        await this.emptyS3Directory(`${r.UserId}/${r.CreatedAt}`);
        await this.deleteReservation(r);
      }
    }
  }
}
