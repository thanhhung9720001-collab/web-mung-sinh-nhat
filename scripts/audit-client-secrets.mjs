import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const CLIENT_OUTPUT_DIRECTORY = join(process.cwd(), ".next", "static");
const SECRET_ENVIRONMENT_VARIABLES = [
  "ADMIN_PASSWORD_HASH",
  "GIFT_PASSWORD_HASH",
  "SESSION_SECRET",
  "SUPABASE_SECRET_KEY",
];
const SCANNED_EXTENSIONS = new Set([".js", ".json", ".map", ".txt"]);

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(path)));
    } else if (
      SCANNED_EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf(".")))
    ) {
      files.push(path);
    }
  }

  return files;
}

function getForbiddenValues() {
  const values = new Map();

  for (const variableName of SECRET_ENVIRONMENT_VARIABLES) {
    values.set(variableName, `environment variable name ${variableName}`);

    const configuredValue = process.env[variableName];

    if (configuredValue && configuredValue.length >= 12) {
      values.set(configuredValue, `configured value of ${variableName}`);
    }
  }

  return values;
}

async function main() {
  let files;

  try {
    files = await listFiles(CLIENT_OUTPUT_DIRECTORY);
  } catch {
    throw new Error(
      "Client build output was not found. Run `pnpm build` before this audit.",
    );
  }

  const forbiddenValues = getForbiddenValues();
  const findings = [];

  for (const file of files) {
    const contents = await readFile(file, "utf8");

    for (const [value, description] of forbiddenValues) {
      if (contents.includes(value)) {
        findings.push(`${description} found in ${file}`);
      }
    }
  }

  if (findings.length > 0) {
    throw new Error(`Client secret audit failed:\n${findings.join("\n")}`);
  }

  console.log(`Client secret audit passed (${files.length} files scanned).`);
}

await main();
