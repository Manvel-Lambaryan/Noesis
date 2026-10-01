import { Global, Module } from "@nestjs/common";
import { CapturingMailer } from "../../infrastructure/mail/capturing-mailer";
import { NotificationsRepository } from "./notifications.repository";
import { NOTIFICATIONS_PORT } from "./notifications.public-port";

@Global()
@Module({
  providers: [
    NotificationsRepository,
    CapturingMailer,
    { provide: NOTIFICATIONS_PORT, useExisting: CapturingMailer },
  ],
  exports: [NOTIFICATIONS_PORT],
})
export class NotificationsModule {}
