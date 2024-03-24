import { Config } from "../../utils/config";
import { TransformManager } from "../../managers/transform-manager";
import { log } from "../../utils/logger";

const globalConfig = new Config();

export const handler = async (event: any) => {
  log.info("incoming event", event);

  const transformManager = new TransformManager();
  const {
    ARBITRATION_API_URL,
    CAREGIVER_API_URL,
    NON_CAREGIVER_API_URL,
    API_KEY,
  } = globalConfig;
  const contentType = "application/json";

  const processEvent = async (parsedBody: any) => {
    try {
      const config = {
        headers: {
          "x-api-key": API_KEY,
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

      if (parsedBody.Caregiver === "Caregiver") {
        const caregiverRequestBody =
          transformManager.getCaregiverRequestBody(parsedBody);

        log.info("Caregiver request body", caregiverRequestBody);

        await transformManager.postRequest(
          CAREGIVER_API_URL,
          caregiverRequestBody,
          config
        );
      } else if (parsedBody.Caregiver === "Non-Caregiver") {
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
