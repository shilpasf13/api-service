import { DynamoDB, SQS } from "aws-sdk";
import { Config } from "../../utils/config";
import { log } from "../../utils/logger";
import {
  getEmailByContactType,
  getFormattedDate,
  isWithinLastFourteenDays,
} from "../../utils/helpers";

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

      // Wait for all existingEntriesPromises to complete before filtering
      await Promise.all(existingEntriesPromises);

      const filteredBatchEntries = batchEntries.filter((entry: any) => {
        let isChangingFromCAtoNonCA = false;
        let isChangingToCAfromNonCA = false;
        let isChangingFromNonCaregiverToCaregiver = false;
        let isChangingFromCaregiverToNonCaregiver = false;
        let unchangedStateCA = false;

        const messageBody = JSON.parse(entry.MessageBody);

        const existingEntry = existingEntries.find(
          (existingEntry) =>
            existingEntry.id === messageBody.EmployeeXrefCode &&
            existingEntry.ArbitrationUid !== "" &&
            existingEntry.StateCode === messageBody.StateCode &&
            existingEntry.EmploymentType === messageBody.EmploymentType
        );

        if (existingEntry) {
          log.info(`Existing entry found for ${messageBody.EmployeeXrefCode}`);
          return false; // Remove entry if conditions met
        }

        if (
          existingEntries.some(
            (existingEntry) =>
              existingEntry.id === messageBody.EmployeeXrefCode &&
              existingEntry.StateCode === "CA" &&
              messageBody.StateCode === "CA" &&
              existingEntry.EmploymentType !== messageBody.EmploymentType
          )
        ) {
          unchangedStateCA = true;
          entry.MessageBody = JSON.stringify({
            ...messageBody,
            unchangedStateCA,
            ArbitrationUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode === "CA" &&
                  messageBody.StateCode === "CA" &&
                  existingEntry.EmploymentType !== messageBody.EmploymentType
              ).ArbitrationUid || null,
            ArbitrationTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode === "CA" &&
                  messageBody.StateCode === "CA" &&
                  existingEntry.EmploymentType !== messageBody.EmploymentType
              ).ArbitrationTitle || null,
            CaregiverUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode === "CA" &&
                  messageBody.StateCode === "CA" &&
                  existingEntry.EmploymentType !== messageBody.EmploymentType
              ).CaregiverUid || null,
            CaregiverTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode === "CA" &&
                  messageBody.StateCode === "CA" &&
                  existingEntry.EmploymentType !== messageBody.EmploymentType
              ).CaregiverTitle || null,
            NonCaregiverUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode === "CA" &&
                  messageBody.StateCode === "CA" &&
                  existingEntry.EmploymentType !== messageBody.EmploymentType
              ).NonCaregiverUid || null,
            NonCaregiverTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode === "CA" &&
                  messageBody.StateCode === "CA" &&
                  existingEntry.EmploymentType !== messageBody.EmploymentType
              ).NonCaregiverTitle || null,
          });
        }

        if (
          existingEntries.some(
            (existingEntry) =>
              existingEntry.id === messageBody.EmployeeXrefCode &&
              existingEntry.StateCode !== "CA" &&
              messageBody.StateCode === "CA"
          )
        ) {
          isChangingToCAfromNonCA = true;
          entry.MessageBody = JSON.stringify({
            ...messageBody,
            isChangingToCAfromNonCA,
            ArbitrationUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode !== "CA" &&
                  messageBody.StateCode === "CA"
              ).ArbitrationUid || null,
            CaregiverUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode !== "CA" &&
                  messageBody.StateCode === "CA"
              ).CaregiverUid || null,
            NonCaregiverUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode !== "CA" &&
                  messageBody.StateCode === "CA"
              ).NonCaregiverUid || null,
            ArbitrationTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode !== "CA" &&
                  messageBody.StateCode === "CA"
              ).ArbitrationTitle || null,
            CaregiverTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode !== "CA" &&
                  messageBody.StateCode === "CA"
              ).CaregiverTitle || null,
            NonCaregiverTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode !== "CA" &&
                  messageBody.StateCode === "CA"
              ).NonCaregiverTitle || null,
          });
        }

        if (!isWithinLastFourteenDays(messageBody.DateOfHire)) {
          return false; // Remove entry if conditions met
        }

        if (
          existingEntries.some(
            (existingEntry) =>
              existingEntry.id === messageBody.EmployeeXrefCode &&
              existingEntry.StateCode === "CA" &&
              messageBody.StateCode !== "CA"
          )
        ) {
          isChangingFromCAtoNonCA = true;
          entry.MessageBody = JSON.stringify({
            ...messageBody,
            isChangingFromCAtoNonCA,
            ArbitrationUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode === "CA" &&
                  messageBody.StateCode !== "CA"
              ).ArbitrationUid || null,
            CaregiverUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode === "CA" &&
                  messageBody.StateCode !== "CA"
              ).CaregiverUid || null,
            NonCaregiverUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode === "CA" &&
                  messageBody.StateCode !== "CA"
              ).NonCaregiverUid || null,
            ArbitrationTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode === "CA" &&
                  messageBody.StateCode !== "CA"
              ).ArbitrationTitle || null,
            CaregiverTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode === "CA" &&
                  messageBody.StateCode !== "CA"
              ).CaregiverTitle || null,
            NonCaregiverTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.StateCode === "CA" &&
                  messageBody.StateCode !== "CA"
              ).NonCaregiverTitle || null,
          });
        }

        if (
          existingEntries.some(
            (existingEntry) =>
              existingEntry.id === messageBody.EmployeeXrefCode &&
              existingEntry.EmploymentType === "Caregiver" &&
              messageBody.EmploymentType === "Non-Caregiver" &&
              messageBody.StateCode !== "CA"
          )
        ) {
          isChangingFromCaregiverToNonCaregiver = true;
          entry.MessageBody = JSON.stringify({
            ...messageBody,
            isChangingFromCaregiverToNonCaregiver,
            ArbitrationUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.EmploymentType === "Caregiver" &&
                  messageBody.EmploymentType === "Non-Caregiver" &&
                  messageBody.StateCode !== "CA"
              ).ArbitrationUid || null,
            CaregiverUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.EmploymentType === "Caregiver" &&
                  messageBody.EmploymentType === "Non-Caregiver" &&
                  messageBody.StateCode !== "CA"
              ).CaregiverUid || null,
            NonCaregiverUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.EmploymentType === "Caregiver" &&
                  messageBody.EmploymentType === "Non-Caregiver" &&
                  messageBody.StateCode !== "CA"
              ).NonCaregiverUid || null,
            ArbitrationTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.EmploymentType === "Caregiver" &&
                  messageBody.EmploymentType === "Non-Caregiver" &&
                  messageBody.StateCode !== "CA"
              ).ArbitrationTitle || null,
            CaregiverTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.EmploymentType === "Caregiver" &&
                  messageBody.EmploymentType === "Non-Caregiver" &&
                  messageBody.StateCode !== "CA"
              ).CaregiverTitle || null,
            NonCaregiverTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.EmploymentType === "Caregiver" &&
                  messageBody.EmploymentType === "Non-Caregiver" &&
                  messageBody.StateCode !== "CA"
              ).NonCaregiverTitle || null,
          });
        }

        if (
          existingEntries.some(
            (existingEntry) =>
              existingEntry.id === messageBody.EmployeeXrefCode &&
              existingEntry.EmploymentType === "Non-Caregiver" &&
              messageBody.EmploymentType === "Caregiver" &&
              messageBody.StateCode !== "CA"
          )
        ) {
          isChangingFromNonCaregiverToCaregiver = true;
          entry.MessageBody = JSON.stringify({
            ...messageBody,
            isChangingFromNonCaregiverToCaregiver,
            ArbitrationUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.EmploymentType === "Non-Caregiver" &&
                  messageBody.EmploymentType === "Caregiver" &&
                  messageBody.StateCode !== "CA"
              ).ArbitrationUid || null,
            CaregiverUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.EmploymentType === "Non-Caregiver" &&
                  messageBody.EmploymentType === "Caregiver" &&
                  messageBody.StateCode !== "CA"
              ).CaregiverUid || null,
            NonCaregiverUid:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.EmploymentType === "Non-Caregiver" &&
                  messageBody.EmploymentType === "Caregiver" &&
                  messageBody.StateCode !== "CA"
              ).NonCaregiverUid || null,
            ArbitrationTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.EmploymentType === "Non-Caregiver" &&
                  messageBody.EmploymentType === "Caregiver" &&
                  messageBody.StateCode !== "CA"
              ).ArbitrationTitle || null,
            CaregiverTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.EmploymentType === "Non-Caregiver" &&
                  messageBody.EmploymentType === "Caregiver" &&
                  messageBody.StateCode !== "CA"
              ).CaregiverTitle || null,
            NonCaregiverTitle:
              existingEntries.find(
                (existingEntry) =>
                  existingEntry.id === messageBody.EmployeeXrefCode &&
                  existingEntry.EmploymentType === "Non-Caregiver" &&
                  messageBody.EmploymentType === "Caregiver" &&
                  messageBody.StateCode !== "CA"
              ).NonCaregiverTitle || null,
          });
        }

        entry.MessageBody = JSON.stringify({
          ...messageBody,
          isChangingToCAfromNonCA,
          isChangingFromCAtoNonCA,
          isChangingFromCaregiverToNonCaregiver,
          isChangingFromNonCaregiverToCaregiver,
          unchangedStateCA,
          ArbitrationUid:
            existingEntries.find(
              (existingEntry) =>
                existingEntry.id === messageBody.EmployeeXrefCode
            ).ArbitrationUid || null,
          CaregiverUid:
            existingEntries.find(
              (existingEntry) =>
                existingEntry.id === messageBody.EmployeeXrefCode
            ).CaregiverUid || null,
          NonCaregiverUid:
            existingEntries.find(
              (existingEntry) =>
                existingEntry.id === messageBody.EmployeeXrefCode
            ).NonCaregiverUid || null,
          ArbitrationTitle:
            existingEntries.find(
              (existingEntry) =>
                existingEntry.id === messageBody.EmployeeXrefCode
            ).ArbitrationTitle || null,
          CaregiverTitle:
            existingEntries.find(
              (existingEntry) =>
                existingEntry.id === messageBody.EmployeeXrefCode
            ).CaregiverTitle || null,
          NonCaregiverTitle:
            existingEntries.find(
              (existingEntry) =>
                existingEntry.id === messageBody.EmployeeXrefCode
            ).NonCaregiverTitle || null,
        });

        return true; // Keep entry if conditions not met
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
          ArbitrationUid: message.ArbitrationUid,
          CaregiverUid: message.CaregiverUid,
          NonCaregiverUid: message.NonCaregiverUid,
          ArbitrationTitle: message.ArbitrationTitle,
          CaregiverTitle: message.CaregiverTitle,
          NonCaregiverTitle: message.NonCaregiverTitle,
        };

        log.info("Data to save in DB: ", data);

        const dynamoParams = {
          TableName: "DayforceConcordEventTable",
          Item: { ...data, id: message.EmployeeXrefCode },
        };

        await dynamoDB.put(dynamoParams).promise();
      });

      try {
        await Promise.allSettled(putPromises);

        const params = {
          Entries: filteredBatchEntries,
          QueueUrl: config.QUEUE_URL,
        };

        if (filteredBatchEntries.length > 0) {
          await sqs.sendMessageBatch(params).promise();
        } else {
          log.error("No messages available to send to queue");
          return {
            statusCode: 200,
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
      EmployeeNumber: messages.EmployeeXrefCode,
      Status: "Failed",
    };

    log.info("Message data to save in DB: ", messageData);

    const dynamoParams = {
      TableName: "DayforceConcordEventTable",
      Item: { ...messageData, id: messages.EmployeeXrefCode },
    };

    await dynamoDB.put(dynamoParams).promise();

    return {
      statusCode: 200,
      body: "Message saved to DynamoDB for failed event",
    };
  }
};
