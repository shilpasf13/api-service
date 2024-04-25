import { DynamoDB, SQS } from "aws-sdk";
import { Config } from "../../utils/config";
import { log } from "../../utils/logger";
import { getEmailByContactType, getFormattedDate } from "../../utils/helpers";

const dynamoDB = new DynamoDB.DocumentClient();
const config = new Config();

export const handler = async (event: any) => {
  log.info("incoming event", event);

  const messages = JSON.parse(event.body);

  try {
    if (!messages || Object.keys(messages).length === 0) {
      return { statusCode: 400, body: "No data found from source system" };
    }

    const sqs = new SQS();
    const batchSize = 10;
    const totalRecords = messages.Employees.length;

    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = messages.Employees.slice(i, i + batchSize);
      const batchEntries = batch.map((msg: any, index: any) => ({
        Id: `${i + index}`,
        MessageBody: JSON.stringify({ ...msg, createdAt: getFormattedDate() }),
      }));

      const existingEntries = await getExistingEntries(batch);

      log.info("existing entries", existingEntries);

      const filteredBatchEntries = batchEntries.filter((entry: any) => {
        const messageBody = JSON.parse(entry.MessageBody);
        const matchingExistingEntries = existingEntries.filter(
          (existingEntry) =>
            existingEntry.id === messageBody.EmployeeXrefCode &&
            existingEntry.StateCode === messageBody.StateCode
        );

        if (matchingExistingEntries.length > 0) {
          log.info(
            `Existing data already exists in DynamoDB table with EmployeeXrefCode ${matchingExistingEntries[0].id} and StateCode ${matchingExistingEntries[0].StateCode}`
          );
          return false;
        }

        return true;
      });

      log.info("filtered entries", filteredBatchEntries);

      const filteredBatch = filteredBatchEntries.map((entry: any) =>
        JSON.parse(entry.MessageBody)
      );

      const putPromises = filteredBatch.map(async (message: any) => {
        const data = {
          FirstName: message.FirstName,
          LastName: message.LastName,
          EmployeeNumber: message.EmployeeXrefCode,
          DateOfHire: message.DateOfHire,
          EmploymentStatus: message.EmploymentStatus,
          EmploymentStatusReason: message.EmploymentStatusReason,
          EmploymentType: message.EmploymentType,
          OperatingGroup: message.OperatingGroup,
          StateCode: message.StateCode,
          PersonalEmail: getEmailByContactType(message).personalEmail
            ? getEmailByContactType(message).personalEmail.EmailAddress
            : null,
          BusinessEmail: getEmailByContactType(message).businessEmail
            ? getEmailByContactType(message).businessEmail.EmailAddress
            : null,
          Status: "Success",
          createdAt: getFormattedDate(),
        };

        log.info("Data to save in DB: ", data);

        const dynamoParams = {
          TableName: "DayforceConcordEventTable",
          Item: { ...data, id: message.EmployeeXrefCode },
        };

        await dynamoDB.put(dynamoParams).promise();
      });

      try {
        await Promise.all(putPromises);

        const params = {
          Entries: filteredBatchEntries,
          QueueUrl: config.QUEUE_URL,
        };

        if (filteredBatchEntries.length > 0) {
          await sqs.sendMessageBatch(params).promise();
        } else {
          log.error("No messages available to send to queue");
          return {
            statusCode: 500,
            body: "No messages available to send to queue",
          };
        }
      } catch (error) {
        log.error("Error sending messages to queue", error);
        return { statusCode: 500, body: "Error sending messages to queue" };
      }
    }
    return {
      statusCode: 200,
      body: "Messages saved to DynamoDB and sent to queue successfully",
    };
  } catch (error) {
    log.info("incoming event message", messages);

    const messageData = {
      EmployeeNumber: messages.data.EmployeeXRefCode,
      Status: "Failed",
    };

    // const uuid = uuidv4();
    log.info("Message data to save in DB: ", messageData);

    const dynamoParams = {
      TableName: "DayforceConcordEventTable",
      Item: { ...messageData, id: messages.data.EmployeeXRefCode },
    };

    await dynamoDB.put(dynamoParams).promise();

    return {
      statusCode: 200,
      body: "Message saved to DynamoDB for failed event",
    };
  }
};

const getExistingEntries = async (batch: any[]) => {
  const existingEntries: any[] = [];


  const existingEntriesPromises = batch.map(async (message: any) => {
    const existingEntry = await dynamoDB
      .query({
        TableName: "DayforceConcordEventTable",
        KeyConditionExpression: "id = :id_value",
        ExpressionAttributeValues: {
          ":id_value": message.EmployeeXrefCode,
        },
      })
      .promise();

    if (existingEntry.Items && existingEntry.Items.length > 0) {
      existingEntries.push(existingEntry.Items[0]);
    }
  });

  await Promise.all(existingEntriesPromises);

  return existingEntries;
};
