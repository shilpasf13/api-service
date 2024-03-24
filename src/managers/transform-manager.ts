import { getOperatingGroup, getStateFullName } from "../utils/helpers";
import axios from "axios";
import { log } from "../utils/logger";

export class TransformManager {
  constructor() {}

  public getArbitrationRequestBody(parsedBody: any) {
    const operatingGroup = getOperatingGroup(parsedBody.OperatingGroup);
    const state = getStateFullName(parsedBody.State);
    return {
      title: "Arbitration Agreements",
      tags: [`${operatingGroup} ${state} Arbitration`],
      signatureRequired: 2,
      variables: {
        Contractdescription: parsedBody.EmployeeDisplayName
          ? parsedBody.EmployeeDisplayName
          : "null",
      },
      inviteNowEmails: {
        "Shilpasf2@gmail.com": "NO_EDIT",
      },
      sendWithDocument: true,
      customMessageName: "Name of custom message",
      customMessageTitle: "Arbitration Agreement",
      customMessageContent:
        parsedBody.State === "CA"
          ? this.messageContentForCA()
          : this.messageContentForNonCA(),
    };
  }

  public getCaregiverRequestBody(parsedBody: any) {
    const operatingGroup = getOperatingGroup(parsedBody.OperatingGroup);
    const state = getStateFullName(parsedBody.State);
    return {
      title: "NDA for New Hires (Caregiver)",
      tags: [`${operatingGroup} ${state} Caregiver NDA`],
      signatureRequired: 2,
      variables: {
        Contractdescription: parsedBody.EmployeeDisplayName
          ? parsedBody.EmployeeDisplayName
          : "null",
      },
      inviteNowEmails: {
        "Shilpasf2@gmail.com": "NO_EDIT",
      },
      sendWithDocument: true,
      customMessageName: "Name of custom message",
      customMessageTitle: "NDA",
      customMessageContent:
        parsedBody.State === "CA"
          ? this.messageContentForCA()
          : this.messageContentForNonCA(),
    };
  }

  public getNonCaregiverRequestBody(parsedBody: any) {
    const operatingGroup = getOperatingGroup(parsedBody.OperatingGroup);
    const state = getStateFullName(parsedBody.State);
    return {
      title: "NDA for New Hires",
      tags: [`${operatingGroup} ${state} Non-Caregiver NDA`],
      signatureRequired: 2,
      variables: {
        Contractdescription: parsedBody.EmployeeDisplayName
          ? parsedBody.EmployeeDisplayName
          : "null",
      },
      inviteNowEmails: {
        "Shilpasf2@gmail.com": "NO_EDIT",
      },
      sendWithDocument: true,
      customMessageName: "Name of custom message",
      customMessageTitle: "NDA",
      customMessageContent:
        parsedBody.State === "CA"
          ? this.messageContentForCA()
          : this.messageContentForNonCA(),
    };
  }

  public async postRequest(apiUrl: any, requestData: any, config: any) {
    try {
      const response = await axios.post(apiUrl, requestData, config);
      log.info("Successfully sent POST request", response.data);
      return response.data;
    } catch (error) {
      log.error("Failed to send POST request:", error);
      throw new Error("Failed to send POST request");
    }
  }

  public messageContentForCA() {
    return "CA email content";
  }

  public messageContentForNonCA() {
    return "Non-CA email content";
  }
}
