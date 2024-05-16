import { Config } from "../../utils/config";
import { TransformManager } from "../../managers/transform-manager";
import { log } from "../../utils/logger";
import { SecretManager } from "../../managers/secret-manager";
import AWS from "aws-sdk";

const globalConfig = new Config();

export const handler = async (event: any) => {
  log.info("incoming event", event);

  const dynamoDB = new AWS.DynamoDB.DocumentClient();

  const transformManager = new TransformManager(dynamoDB);
  const { TARGET_SYSTEM_API_URL, API_SECRET } = globalConfig;
  const contentType = "application/json";

  const secretManager = new SecretManager();

  const apiSecret = await secretManager.getSecret(API_SECRET);

  const ARBITRATION_API_URL =
    TARGET_SYSTEM_API_URL + String(apiSecret.arbitrationApiUrl);

  const CAREGIVER_API_URL =
    TARGET_SYSTEM_API_URL + String(apiSecret.caregiverApiUrl);

  const NON_CAREGIVER_API_URL =
    TARGET_SYSTEM_API_URL + String(apiSecret.nonCaregiverApiUrl);

  const processEvent = async (parsedBody: any) => {
    try {
      const config = {
        headers: {
          "x-api-key": apiSecret.apiKey,
          "Content-Type": contentType,
        },
      };

      if (parsedBody.isChangingFromCaregiverToNonCaregiver) {
        if (parsedBody.EmploymentType === "Non-Caregiver") {
          const nonCaregiverRequestBody =
            transformManager.getNonCaregiverRequestBody(parsedBody);

          log.info("Non-Caregiver request body", nonCaregiverRequestBody);

          await transformManager.postRequest(
            NON_CAREGIVER_API_URL,
            nonCaregiverRequestBody,
            config,
            parsedBody
          );
        }
      } else if (parsedBody.isChangingFromNonCaregiverToCaregiver) {
        if (parsedBody.EmploymentType === "Caregiver") {
          const caregiverRequestBody =
            transformManager.getCaregiverRequestBody(parsedBody);

          log.info("Caregiver request body", caregiverRequestBody);

          await transformManager.postRequest(
            CAREGIVER_API_URL,
            caregiverRequestBody,
            config,
            parsedBody
          );
        }
      } else if (parsedBody.isChangingFromCAtoNonCA) {
        if (parsedBody.EmploymentType === "Caregiver") {
          const caregiverRequestBody =
            transformManager.getCaregiverRequestBody(parsedBody);

          log.info("Caregiver request body", caregiverRequestBody);

          await transformManager.postRequest(
            CAREGIVER_API_URL,
            caregiverRequestBody,
            config,
            parsedBody
          );
        } else if (parsedBody.EmploymentType === "Non-Caregiver") {
          const nonCaregiverRequestBody =
            transformManager.getNonCaregiverRequestBody(parsedBody);

          log.info("Non-Caregiver request body", nonCaregiverRequestBody);

          await transformManager.postRequest(
            NON_CAREGIVER_API_URL,
            nonCaregiverRequestBody,
            config,
            parsedBody
          );
        }
      } else {
        const arbitrationRequestBody =
          transformManager.getArbitrationRequestBody(parsedBody);

        log.info("Arbitration request body", arbitrationRequestBody);

        await transformManager.postRequest(
          ARBITRATION_API_URL,
          arbitrationRequestBody,
          config,
          parsedBody
        );

        if (parsedBody.StateCode !== "CA") {
          if (parsedBody.EmploymentType === "Caregiver") {
            const caregiverRequestBody =
              transformManager.getCaregiverRequestBody(parsedBody);

            log.info("Caregiver request body", caregiverRequestBody);

            await transformManager.postRequest(
              CAREGIVER_API_URL,
              caregiverRequestBody,
              config,
              parsedBody
            );
          } else if (parsedBody.EmploymentType === "Non-Caregiver") {
            const nonCaregiverRequestBody =
              transformManager.getNonCaregiverRequestBody(parsedBody);

            log.info("Non-Caregiver request body", nonCaregiverRequestBody);

            await transformManager.postRequest(
              NON_CAREGIVER_API_URL,
              nonCaregiverRequestBody,
              config,
              parsedBody
            );
          }
        }
      }
    } catch (error) {
      log.error("Error in transform handler:", error);
      throw new Error("Failed in transform handler");
    }
  };

  try {
    const parsedEventBodies = event.Records.map((record: any) =>
      JSON.parse(record.body)
    );

    log.info("event bodies", parsedEventBodies);

    const batchSize = 100; // Adjust batch size as needed
    const filteredEventBodies = parsedEventBodies.filter((eventBody: any) => {
      // Check if unchangedStateCA is true OR isChangingToCAfromNonCA is true and discard the record
      return !(eventBody.unchangedStateCA || eventBody.isChangingToCAfromNonCA);
    });

    for (let i = 0; i < filteredEventBodies.length; i += batchSize) {
      const batch = filteredEventBodies.slice(i, i + batchSize);
      await Promise.all(batch.map(processEvent));
    }
  } catch (error) {
    log.error("Error processing event:", error);
    throw new Error("Failed to process event");
  }
};
