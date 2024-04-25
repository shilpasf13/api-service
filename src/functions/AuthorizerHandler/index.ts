import { log } from "../../utils/logger";
import { SecretManager } from "../../managers/secret-manager";
import { Config } from "../../utils/config";

const globalConfig = new Config();
export const handler = async (event: any) => {
  log.info("event", event);

  const token = event.authorizationToken;

  const { API_SECRET } = globalConfig;

  const secretManager = new SecretManager();

  const apiSecret = await secretManager.getSecret(API_SECRET);

  if (!token || token !== String(apiSecret.authorizationToken)) {
    log.info("Invalid Token");
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized",
      }),
    };
  }

  log.info("Authorization successful");

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
