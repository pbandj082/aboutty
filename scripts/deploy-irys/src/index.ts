import { existsSync, readFileSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";

const workspaceRoot = process.env.INIT_CWD ? resolve(process.env.INIT_CWD) : process.cwd();

loadEnvFile(workspaceRoot);

const { values } = parseArgs({
  options: {
    dir: {
      type: "string",
      default: process.env.IRYS_DEPLOY_DIR ?? "apps/studio/dist"
    },
    index: {
      type: "string",
      default: process.env.IRYS_INDEX_FILE ?? "index.html"
    },
    yes: {
      type: "boolean",
      short: "y",
      default: false
    }
  }
});

const distDir = resolveWorkspacePath(values.dir ?? "apps/studio/dist");

if (!existsSync(distDir)) {
  throw new Error(`Build directory does not exist: ${distDir}`);
}

const wallet = await loadWallet();
const irys = await Uploader(Solana).withWallet(wallet);
const folderInfo = await getFolderInfo(distDir);
const price = await irys.utils.estimateFolderPrice(folderInfo);
const balance = await irys.getBalance();

printPreflight({
  balance,
  distDir,
  fileCount: folderInfo.fileCount,
  indexFile: values.index ?? "index.html",
  price,
  totalBytes: folderInfo.totalBytes,
  token: irys.token
});

if (!values.yes && process.env.IRYS_SKIP_CONFIRM !== "true") {
  await confirmUpload();
}

const receipt = await irys.uploadFolder(distDir, {
  indexFile: values.index ?? "index.html"
});

if (!receipt) {
  throw new Error("Irys upload did not return a receipt.");
}

console.log(`Uploaded ${distDir}`);
console.log(`Transaction: ${receipt.id}`);
console.log(`Gateway: https://gateway.irys.xyz/${receipt.id}`);

interface FolderInfo {
  fileCount: number;
  totalBytes: number;
}

async function getFolderInfo(path: string): Promise<FolderInfo> {
  const entry = await stat(path);

  if (entry.isFile()) {
    return { fileCount: 1, totalBytes: entry.size };
  }

  if (!entry.isDirectory()) {
    return { fileCount: 0, totalBytes: 0 };
  }

  let fileCount = 0;
  let totalBytes = 0;

  for (const child of await readdir(path, { withFileTypes: true })) {
    const childPath = join(path, child.name);

    if (child.isDirectory()) {
      const childInfo = await getFolderInfo(childPath);
      fileCount += childInfo.fileCount;
      totalBytes += childInfo.totalBytes;
      continue;
    }

    if (child.isFile()) {
      const childStat = await stat(childPath);
      fileCount += 1;
      totalBytes += childStat.size;
    }
  }

  return { fileCount, totalBytes };
}

function printPreflight({
  balance,
  distDir,
  fileCount,
  indexFile,
  price,
  token,
  totalBytes
}: {
  balance: { toFixed(decimalPlaces?: number): string };
  distDir: string;
  fileCount: number;
  indexFile: string;
  price: { gt(value: unknown): boolean; toFixed(decimalPlaces?: number): string };
  token: string;
  totalBytes: number;
}): void {
  const priceAtomic = price.toFixed(0);
  const balanceAtomic = balance.toFixed(0);
  const priceDecimal = irys.utils.fromAtomic(priceAtomic).toFixed();
  const balanceDecimal = irys.utils.fromAtomic(balanceAtomic).toFixed();

  console.log("Irys deploy preflight");
  console.log(`Directory: ${distDir}`);
  console.log(`Index file: ${indexFile}`);
  console.log(`Files: ${fileCount}`);
  console.log(`Size: ${formatBytes(totalBytes)} (${totalBytes} bytes)`);
  console.log(`Estimated cost: ${priceAtomic} atomic units (${priceDecimal} ${token})`);
  console.log(`Irys balance: ${balanceAtomic} atomic units (${balanceDecimal} ${token})`);

  if (price.gt(balanceAtomic)) {
    console.warn(
      "Warning: current Irys balance appears lower than the estimated upload cost."
    );
  }
}

async function confirmUpload(): Promise<void> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const answer = await readline.question("Type \"deploy\" to continue: ");

    if (answer.trim() !== "deploy") {
      throw new Error("Deploy cancelled.");
    }
  } finally {
    readline.close();
  }
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"] as const;
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

async function loadWallet(): Promise<string | number[]> {
  const keyFilePath = process.env.IRYS_PRIVATE_KEY_FILE;

  if (keyFilePath) {
    const resolvedKeyFilePath = resolveInputPath(keyFilePath);
    const rawKeyFile = await readFile(resolvedKeyFilePath, "utf8");

    return parseWallet(rawKeyFile, resolvedKeyFilePath);
  }

  if (process.env.IRYS_PRIVATE_KEY) {
    return parseWallet(process.env.IRYS_PRIVATE_KEY, "IRYS_PRIVATE_KEY");
  }

  throw new Error(
    "Set IRYS_PRIVATE_KEY_FILE to a Solana keypair file path before deploying."
  );
}

function parseWallet(value: string, source: string): string | number[] {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`Wallet source is empty: ${source}`);
  }

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as unknown;

    if (!isSolanaSecretKey(parsed)) {
      throw new Error(`Wallet file must contain a Solana secret key array: ${source}`);
    }

    return parsed;
  }

  return trimmed;
}

function isSolanaSecretKey(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)
  );
}

function resolveInputPath(path: string): string {
  if (path === "~") {
    return homedir();
  }

  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }

  return resolveWorkspacePath(path);
}

function resolveWorkspacePath(path: string): string {
  if (path.startsWith("/")) {
    return path;
  }

  return resolve(workspaceRoot, path);
}

function loadEnvFile(root: string): void {
  const envPath = resolve(root, ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const env = readFileSync(envPath, "utf8");

  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);

    if (!match) {
      continue;
    }

    const key = match[1];
    const rawValue = match[2];

    if (!key || rawValue === undefined) {
      continue;
    }

    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = stripEnvQuotes(rawValue.trim());
  }
}

function stripEnvQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
