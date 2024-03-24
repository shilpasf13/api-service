export class Config {
  public QUEUE_URL: string;
  public DLQ_URL: string;
  public ARBITRATION_API_URL: string;
  public CAREGIVER_API_URL: string;
  public NON_CAREGIVER_API_URL: string;
  public API_KEY: string;

  constructor() {
    const {
      QUEUE_URL,
      DLQ_URL,
      ARBITRATION_API_URL,
      CAREGIVER_API_URL,
      NON_CAREGIVER_API_URL,
      API_KEY,
    } = process.env;
    if (
      !QUEUE_URL ||
      !DLQ_URL ||
      !ARBITRATION_API_URL ||
      !API_KEY ||
      !CAREGIVER_API_URL ||
      !NON_CAREGIVER_API_URL
    ) {
      throw new Error("Missing required environment variables");
    }
    this.QUEUE_URL = QUEUE_URL;
    this.DLQ_URL = DLQ_URL;
    this.ARBITRATION_API_URL = ARBITRATION_API_URL;
    this.CAREGIVER_API_URL = CAREGIVER_API_URL;
    this.NON_CAREGIVER_API_URL = NON_CAREGIVER_API_URL;
    this.API_KEY = API_KEY;
  }
}
