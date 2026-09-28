import { Controller, Get, Header, Inject, NotFoundException, Param, StreamableFile } from "@nestjs/common";
import { PUBLIC_STORAGE, type PublicObjectStorage } from "./local-public-storage";

const ID = /^[0-9a-f-]{36}$/;
const FILE = /^[0-9a-f-]{36}\.(png|jpg|webp)$/;

@Controller("media/previews")
export class MediaController {
  constructor(@Inject(PUBLIC_STORAGE) private readonly storage: PublicObjectStorage) {}

  @Get(":sellerId/:productId/:file")
  @Header("cache-control", "public, max-age=3600")
  async read(
    @Param("sellerId") sellerId: string,
    @Param("productId") productId: string,
    @Param("file") file: string,
  ): Promise<StreamableFile> {
    if (!ID.test(sellerId) || !ID.test(productId) || !FILE.test(file)) {
      throw new NotFoundException();
    }
    const bytes = await this.storage.readPreview(`previews/${sellerId}/${productId}/${file}`);
    if (bytes === null) {
      throw new NotFoundException();
    }
    return new StreamableFile(bytes, { type: contentType(file) });
  }
}

function contentType(file: string): string {
  if (file.endsWith(".png")) {
    return "image/png";
  }
  return file.endsWith(".jpg") ? "image/jpeg" : "image/webp";
}
