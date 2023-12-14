export type LambdaOutput = {
  statusCode: number;
  headers: { [key: string]: string };
  body: string;
};

export type LambdaContext = {
  awsRequestId: string;
};

export type LambdaEvent = {
  resource: string;
  httpMethod: string;
  headers: { [key: string]: string } | null;
  body: string | null;
  pathParameters: { [key: string]: string } | null;
  queryStringParameters: { [key: string]: string } | null;
  requestContext: {
    authorizer?: {
      claims: {
        sub: string;
        email_verified: string;
        iss: string;
        'cognito:username': string;
        origin_jti: string;
        aud: string;
        event_id: string;
        token_use: string;
        auth_time: string;
        exp: string;
        iat: string;
        jti: string;
        email: string;
      };
    };
  };
};

export type WsEvent = {
  queryStringParameters: { [key: string]: string } | null;
  requestContext: {
    routeKey: string;
    eventType: string;
    extendedRequestId: string;
    requestTime: string;
    messageDirection: string;
    stage: string;
    connectedAt: number;
    requestTimeEpoch: number;
    connectionId: string;
  };
  body: string;
};

export type CognitoEvent = {
  version: string;
  region: string;
  userPoolId: string;
  userName: string;
  callerContext: {
    awsSdkVersion: string;
    clientId: string;
  };
  triggerSource: string;
  request: {
    userAttributes: {
      sub: string;
      email_verified: string;
      'cognito:user_status': string;
      'cognito:email_alias': string;
      email: string;
    };
  };
  response: unknown;
};

export type CognitoMessageEvent = {
  version: string;
  region: string;
  userPoolId: string;
  userName: string;
  callerContext: {
    awsSdkVersion: string;
    clientId: string;
  };
  triggerSource:
    | 'CustomMessage_SignUp'
    | 'CustomMessage_ResendCode'
    | 'CustomMessage_ForgotPassword';
  request: {
    userAttributes: {
      sub: string;
      'custom:user_name': string;
      'cognito:email_alias': string;
      email_verified: string;
      'cognito:user_status': string;
      email: string;
    };
    codeParameter: string;
    linkParameter: string;
    usernameParameter: null;
  };
  response: {
    smsMessage: string | null;
    emailMessage: string | null;
    emailSubject: string | null;
  };
};

export type CognitoSignupEvent = {
  version: string;
  region: string;
  userPoolId: string;
  userName: string;
  callerContext: {
    awsSdkVersion: string;
    clientId: string;
  };
  triggerSource: 'PreSignUp_SignUp';
  request: {
    userAttributes: {
      'custom:user_name': string;
      email: string;
    };
    validationData: {};
  };
  response: {
    autoConfirmUser: false;
    autoVerifyEmail: false;
    autoVerifyPhone: false;
  };
};
