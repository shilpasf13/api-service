import { SQS } from "aws-sdk";
import { Config } from "../../utils/config";
import { log } from "../../utils/logger";

const sqs = new SQS();

const config = new Config();
export const handler = async (event: any) => {
  log.info("incoming event", event);

  const messages = JSON.parse(event.body); // populate messages to send to queue

  if (!messages || Object.keys(messages).length === 0) {
    return { statusCode: 400, body: "No data found from source system" };
  }

  const batchSize = 10;
  const totalRecords = messages.Employees.length;

  for (let i = 0; i < totalRecords; i += batchSize) {
    const batch = messages.Employees.slice(i, i + batchSize);
    const batchEntries = batch.map((msg: any, index: any) => ({
      Id: `${i + index}`,
      MessageBody: JSON.stringify(msg),
    }));

    log.info("Messages in batch:", batchEntries);

    const params = {
      Entries: batch.map((msg: any, index: any) => ({
        Id: `${i + index}`,
        MessageBody: JSON.stringify(msg),
      })),
      QueueUrl: config.QUEUE_URL,
    };

    try {
      await sqs.sendMessageBatch(params).promise();
    } catch (error) {
      log.error("Error sending messages to queue", error);
      return { statusCode: 500, body: "Error sending messages to queue" };
    }
  }

  return { statusCode: 200, body: "Messages sent to queue successfully" };
};
