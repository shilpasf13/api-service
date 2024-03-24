import { SQS } from "aws-sdk";
import { Config } from "../../utils/config";
import { log } from "../../utils/logger";

const sqs = new SQS();
const config = new Config();
export const handler = async (event: any) => {
  try {
    log.info("Reprocessing message from DLQ Queue:", event);

    if (event && event.Records && event.Records.length > 0) {
      // Assuming the message is in JSON format
      const originalMessage = JSON.parse(event.Records[0].body);

      for (let i = 0; i < originalMessage.Employees.length; i++) {
        const msg = originalMessage.Employees[i];

        await sqs
          .sendMessage({
            QueueUrl: config.DLQ_URL,
            MessageBody: JSON.stringify(msg),
          })
          .promise();
      }

      return { statusCode: 200, body: "Message reprocessed successfully" };
    } else {
      log.error("Invalid event format for DLQ message:", event);
      throw new Error("Invalid event format for DLQ message");
    }
  } catch (error) {
    log.error("Error reprocessing message:", error);
    throw error;
  }
};
