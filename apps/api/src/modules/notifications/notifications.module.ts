import { Module } from "@nestjs/common";
import { NotificationsRepository } from "./notifications.repository";

@Module({
  providers: [NotificationsRepository],
})
export class NotificationsModule {}
