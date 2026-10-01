export type ArchiveLimits = {
  maxBytes: number;
  maxUncompressed: number;
  maxEntries: number;
  maxRatio: number;
};

export function archiveLimits(env: Record<string, string | undefined> = process.env): ArchiveLimits {
  return {
    maxBytes: positive(env.ARCHIVE_MAX_BYTES, 2_147_483_648),
    maxUncompressed: positive(env.ARCHIVE_MAX_UNCOMPRESSED, 8_589_934_592),
    maxEntries: positive(env.ARCHIVE_MAX_ENTRIES, 10_000),
    maxRatio: positive(env.ARCHIVE_MAX_RATIO, 100),
  };
}

function positive(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
