import { Config } from "../../utils/config";
import { TransformManager } from "../../managers/transform-manager";
import { log } from "../../utils/logger";
import { SecretManager } from "../../managers/secret-manager";

const globalConfig = new Config();

export const handler = async (event: any) => {
  log.info("incoming event", event);

  const transformManager = new TransformManager();
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

      const arbitrationRequestBody =
        transformManager.getArbitrationRequestBody(parsedBody);

      log.info("Arbitration request body", arbitrationRequestBody);

      await transformManager.postRequest(
        ARBITRATION_API_URL,
        arbitrationRequestBody,
        config
      );

      if (parsedBody.EmploymentType === "Caregiver") {
        const caregiverRequestBody =
          transformManager.getCaregiverRequestBody(parsedBody);

        log.info("Caregiver request body", caregiverRequestBody);

        await transformManager.postRequest(
          CAREGIVER_API_URL,
          caregiverRequestBody,
          config
        );
      } else if (parsedBody.EmploymentType === "Non-Caregiver") {
        const nonCaregiverRequestBody =
          transformManager.getNonCaregiverRequestBody(parsedBody);

        log.info("Non-Caregiver request body", nonCaregiverRequestBody);

        await transformManager.postRequest(
          NON_CAREGIVER_API_URL,
          nonCaregiverRequestBody,
          config
        );
      }
    } catch (error) {
      log.error("Error in transform handler:", error);
      throw new Error("Failed in transform handler");
    }
  };

  try {
    const parsedEventBodies = event.Records.map((record: { body: string }) =>
      JSON.parse(record.body)
    );

    log.info("event bodies", parsedEventBodies);

    const batchSize = 100; // Adjust batch size as needed
    for (let i = 0; i < parsedEventBodies.length; i += batchSize) {
      const batch = parsedEventBodies.slice(i, i + batchSize);
      await Promise.all(batch.map(processEvent));
    }
  } catch (error) {
    log.error("Error processing event:", error);
    throw new Error("Failed to process event");
  }
};
