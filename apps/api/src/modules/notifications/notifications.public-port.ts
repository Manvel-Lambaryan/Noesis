export type AuthEmail = {
  to: string;
  purpose: "email_verification" | "password_reset";
  url: string;
};

export interface NotificationsPort {
  sendAuthEmail(message: AuthEmail): Promise<void>;
  capturedAuthEmails(): readonly AuthEmail[];
  captureEnabled(): boolean;
}

export const NOTIFICATIONS_PORT = Symbol("NOTIFICATIONS_PORT");
