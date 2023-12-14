import { LambdaContext, LambdaEvent } from './model/Lambda';
import line from './routes/line';
import reservation from './routes/reservation';
import { errorOutput, successOutput } from './utils/LambdaHelper';

export const api = async (event: LambdaEvent, _context: LambdaContext) => {
  console.log(event.httpMethod, event.resource, event.body);

  try {
    let res: any;

    const resource = event.resource.split('/')[2];
    switch (resource) {
      case 'line':
        res = await line(event);
        break;
      case 'reservation':
        res = await reservation(event);
    }

    return successOutput(res);
  } catch (e) {
    console.log(e);

    return errorOutput(e);
  }
};
