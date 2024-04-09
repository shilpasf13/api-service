export class Config {
  public QUEUE_URL: string;
  public DLQ_URL: string;
  public TARGET_SYSTEM_API_URL: string;
  public API_SECRET: string;

  constructor() {
    const { QUEUE_URL, DLQ_URL, TARGET_SYSTEM_API_URL, API_SECRET } =
      process.env;
    if (!QUEUE_URL || !DLQ_URL || !TARGET_SYSTEM_API_URL || !API_SECRET) {
      throw new Error("Missing required environment variables");
    }
    this.QUEUE_URL = QUEUE_URL;
    this.DLQ_URL = DLQ_URL;
    this.TARGET_SYSTEM_API_URL = TARGET_SYSTEM_API_URL;
    this.API_SECRET = API_SECRET;
  }
}
