import axios from "axios";
import { log } from "../utils/logger";
import { getEmailByContactType } from "../utils/helpers";

export class TransformManager {
  constructor() {}

  public getArbitrationRequestBody(parsedBody: any) {
    const operatingGroup = parsedBody.OperatingGroup;
    const state = parsedBody.StateCode;
    return {
      title: "Arbitration Agreements",
      tags: [`${operatingGroup} ${state} Arbitration`],
      signatureRequired: 2,
      variables: {
        Contractdescription: `${parsedBody.FirstName} ${parsedBody.LastName} ${parsedBody.EmployeeXrefCode}`,
      },
      inviteNowEmails: this.getInviteNowEmails(parsedBody),
      sendWithDocument: true,
      customMessageName: "Name of custom message",
      customMessageTitle:
        "Sevita - 1st of 2 New Hire documents - PLEASE REVIEW",
      customMessageContent:
        parsedBody.State === "CA"
          ? this.messageContentForCA()
          : this.messageContentForNonCA(),
    };
  }

  public getCaregiverRequestBody(parsedBody: any) {
    const operatingGroup = parsedBody.OperatingGroup;
    const state = parsedBody.StateCode;
    return {
      title: "NDA for New Hires (Caregiver)",
      tags: [`${operatingGroup} ${state} Caregiver NDA`],
      signatureRequired: 2,
      variables: {
        Contractdescription: `${parsedBody.FirstName} ${parsedBody.LastName} ${parsedBody.EmployeeXrefCode}`,
      },
      inviteNowEmails: this.getInviteNowEmails(parsedBody),
      sendWithDocument: true,
      customMessageName: "Name of custom message",
      customMessageTitle:
        "Sevita - 2nd of 2 New Hire Documents - PLEASE REVIEW",
      customMessageContent:
        parsedBody.State === "CA"
          ? this.messageContentForCA()
          : this.messageContentForNonCA(),
    };
  }

  public getNonCaregiverRequestBody(parsedBody: any) {
    const operatingGroup = parsedBody.OperatingGroup;
    const state = parsedBody.StateCode;
    return {
      title: "NDA for New Hires",
      tags: [`${operatingGroup} ${state} Non-Caregiver NDA`],
      signatureRequired: 2,
      variables: {
        Contractdescription: `${parsedBody.FirstName} ${parsedBody.LastName} ${parsedBody.EmployeeXrefCode}`,
      },
      inviteNowEmails: this.getInviteNowEmails(parsedBody),
      sendWithDocument: true,
      customMessageName: "Name of custom message",
      customMessageTitle:
        "Sevita - 2nd of 2 New Hire Documents - PLEASE REVIEW",
      customMessageContent:
        parsedBody.State === "CA"
          ? this.messageContentForCA()
          : this.messageContentForNonCA(),
    };
  }

  public async postRequest(apiUrl: any, requestData: any, config: any) {
    try {
      const response = await axios.post(apiUrl, requestData, config);
      log.info("Successfully sent to target system", response.data);
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

  public getInviteNowEmails(messageBody: any) {
    const { personalEmail, businessEmail } = getEmailByContactType(messageBody);
    const personalEmailAddress = personalEmail
      ? personalEmail.EmailAddress
      : null;
    const businessEmailAddress = businessEmail
      ? businessEmail.EmailAddress
      : null;

    if (!personalEmailAddress && !businessEmailAddress) {
      return {
        "shilpa.ronda@gmail.com": "NO_EDIT",
        "shilpa.nannuri@test.com": "NO_EDIT",
      };
    }

    // if (personalEmailAddress && !businessEmailAddress) {
    //   return {
    //     [personalEmailAddress]: "NO_EDIT",
    //   };
    // }

    // if (!personalEmailAddress && businessEmailAddress) {
    //   return {
    //     [businessEmailAddress]: "NO_EDIT",
    //   };
    // }

    // return {
    //   [personalEmailAddress]: "NO_EDIT",
    //   [businessEmailAddress]: "NO_EDIT",
    // };
    return {
      "shilpa.ronda@gmail.com": "NO_EDIT",
      "shilpa.nannuri@test.com": "NO_EDIT",
    };
  }
}
