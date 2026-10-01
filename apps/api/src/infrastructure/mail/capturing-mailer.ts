import type { AuthEmail, NotificationsPort } from "../../modules/notifications/notifications.public-port";

const CAPTURED_LIMIT = 50;

export class CapturingMailer implements NotificationsPort {
  private readonly messages: AuthEmail[] = [];

  async sendAuthEmail(message: AuthEmail): Promise<void> {
    this.messages.push({ to: message.to, purpose: message.purpose, url: message.url });
    if (this.messages.length > CAPTURED_LIMIT) {
      this.messages.shift();
    }
  }

  capturedAuthEmails(): readonly AuthEmail[] {
    return this.messages.map((message) => ({ ...message }));
  }

  captureEnabled(): boolean {
    return process.env.EMAIL_PROVIDER === "capture";
  }
}
