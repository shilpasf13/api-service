import AWS from "aws-sdk";
import { log } from "../utils/logger";
export class SecretManager {
  constructor() {}

  public async getSecret(secretName: string) {
    AWS.config.update({ region: "us-east-1" });

    const client = new AWS.SecretsManager();

    const params = {
      SecretId: secretName,
    };

    try {
      const data = await client.getSecretValue(params).promise();

      if (data.SecretString) {
        const secret = JSON.parse(data.SecretString);
        return secret;
      } else {
        const decodedBinarySecret = Buffer.from(
          data.SecretBinary as string,
          "base64"
        ).toString("ascii");
        return decodedBinarySecret;
      }
    } catch (err) {
      log.error("Error retrieving secret:", err);
    }
  }
}
