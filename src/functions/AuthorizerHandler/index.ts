 import { log } from "../../utils/logger";
 export const handler = async (event: any) => {
  const token = event.headers["Authorization"];

  log.info("event", event);

  if (!token || token !== "my-secret-token") {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized",
      }),
    };
  }

  return {
    principalId: "user",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: "execute-api:Invoke",
          Resource: event.methodArn,
        },
      ],
    },
  };
};
