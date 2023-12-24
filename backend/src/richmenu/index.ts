import * as fs from 'fs';
import * as path from 'path';
import {
  MessagingApiBlobClient,
  MessagingApiClient,
} from '@line/bot-sdk/dist/messaging-api/api';
import { SSM } from 'aws-sdk';

const main = async () => {
  const ssm = new SSM({ region: 'ap-northeast-1' });

  const res = await ssm
    .getParameter({ Name: 'porrima-prod-line-token' })
    .promise();

  const client = new MessagingApiClient({
    channelAccessToken: res.Parameter?.Value ?? 'xx',
  });
  const blobClient = new MessagingApiBlobClient({
    channelAccessToken: res.Parameter?.Value ?? 'xx',
  });

  // delete existing richmenu
  const old = await client.getRichMenuList();
  for (const r of old.richmenus) await client.deleteRichMenu(r.richMenuId);

  // create new richmenu
  const richmenuResponse = await client.createRichMenu({
    size: {
      width: 1218,
      height: 250,
    },
    selected: true,
    name: 'default',
    chatBarText: 'キーボードの表示は左側のボタ',
    areas: [
      {
        bounds: {
          x: 0,
          y: 0,
          width: 1218,
          height: 250,
        },
        action: {
          type: 'postback',
          data: 'ご相談',
          displayText: 'ご相談',
        },
      },
    ],
  });
  const buffer = fs.readFileSync(path.join(__dirname, './menu.png'));
  await blobClient.setRichMenuImage(
    richmenuResponse.richMenuId,
    new Blob([buffer], { type: 'image/png' })
  );
  await client.setDefaultRichMenu(richmenuResponse.richMenuId);
};

main();
