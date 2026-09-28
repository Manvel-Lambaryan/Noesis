import { Module } from "@nestjs/common";
import { ReviewsRepository } from "./reviews.repository";

@Module({
  providers: [ReviewsRepository],
})
export class ReviewsModule {}
