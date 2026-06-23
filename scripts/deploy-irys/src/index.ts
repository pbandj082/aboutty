import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";

const { values } = parseArgs({
  options: {
    dir: {
      type: "string",
      default: "apps/studio/dist"
    },
    index: {
      type: "string",
      default: "index.html"
    }
  }
});

const privateKey = process.env.IRYS_PRIVATE_KEY;

if (!privateKey) {
  throw new Error("Set IRYS_PRIVATE_KEY to a Solana wallet secret key before deploying.");
}

const distDir = resolve(values.dir ?? "apps/studio/dist");

if (!existsSync(distDir)) {
  throw new Error(`Build directory does not exist: ${distDir}`);
}

const irys = await Uploader(Solana).withWallet(privateKey);
const receipt = await irys.uploadFolder(distDir, {
  indexFile: values.index ?? "index.html"
});

if (!receipt) {
  throw new Error("Irys upload did not return a receipt.");
}

console.log(`Uploaded ${distDir}`);
console.log(`Transaction: ${receipt.id}`);
console.log(`Gateway: https://gateway.irys.xyz/${receipt.id}`);
