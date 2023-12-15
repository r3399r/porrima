import { bindings } from 'src/bindings';
import { ReservationService } from 'src/logic/ReservationService';
import { BadRequestError } from 'src/model/error';
import { LambdaEvent } from 'src/model/Lambda';

let event: LambdaEvent;
let service: ReservationService;

export default async (lambdaEvent: LambdaEvent) => {
  event = lambdaEvent;
  service = bindings.get(ReservationService);

  switch (event.resource) {
    case '/api/reservation':
      return await defaultReservation();
  }

  throw new BadRequestError('unexpected resource');
};

const defaultReservation = async () => {
  switch (event.httpMethod) {
    case 'GET':
      return await service.getAllReservations();
  }

  throw new Error('unexpected httpMethod');
};
