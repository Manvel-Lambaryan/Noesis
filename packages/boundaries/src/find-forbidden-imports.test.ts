import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import { findForbiddenImports, readTypeScriptFiles } from "./find-forbidden-imports";

const modulesDir = path.resolve(__dirname, "../../../apps/api/src/modules");
const fixturePath = path.resolve(
  __dirname,
  "../../../apps/api/test-fixtures/forbidden-import.ts",
);

describe("module boundaries", () => {
  it("accepts public-port imports between modules", () => {
    const violations = findForbiddenImports(readTypeScriptFiles(modulesDir));
    assert.deepEqual(violations, []);
  });

  it("flags a fixture that imports another module repository", () => {
    const violations = findForbiddenImports(readTypeScriptFiles(path.dirname(fixturePath)));
    assert.equal(violations.length > 0, true);
    assert.match(violations[0]?.reason ?? "", /forbidden/);
  });

  it("flags a domain module that imports Prisma", () => {
    const violations = findForbiddenImports([
      {
        path: "/repo/apps/api/src/modules/catalog/catalog.repository.ts",
        source: 'import { PrismaClient } from "@prisma/client";\n',
      },
    ]);
    assert.equal(violations.length, 1);
  });
});
