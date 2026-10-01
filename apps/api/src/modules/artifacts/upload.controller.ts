import { Controller, HttpCode, Inject, Param, Put, Req } from "@nestjs/common";
import type { Request } from "express";
import { AuthFailure } from "../../auth/auth-failure";
import { QUARANTINE_STORAGE, QuarantineStorage } from "../../infrastructure/storage/quarantine-storage";
import { ArtifactsService } from "./artifacts.service";

@Controller("uploads/quarantine")
export class QuarantineUploadController {
  constructor(
    private readonly artifacts: ArtifactsService,
    @Inject(QUARANTINE_STORAGE) private readonly storage: QuarantineStorage,
  ) {}

  @Put(":token")
  @HttpCode(204)
  async put(@Param("token") token: string, @Req() request: Request): Promise<void> {
    const opened = await this.artifacts.openUpload(token);
    try {
      const written = await this.storage.writeStream(opened.objectKey, request, opened.byteSize);
      await this.artifacts.finishUpload(token, written);
    } catch (error) {
      await this.storage.remove(opened.objectKey);
      if (error instanceof Error && error.message === "too_large") {
        throw new AuthFailure(413, "payload_too_large", "Archive is larger than the upload intent.");
      }
      throw error;
    }
  }
}
