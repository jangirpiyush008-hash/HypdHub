import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env.local");

function readEnvFile() {
  return fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
}

function readEnvValue(name, raw) {
  const match = raw.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

function writeEnvValue(name, value) {
  const raw = readEnvFile();
  const line = `${name}=${value}`;

  if (new RegExp(`^${name}=`, "m").test(raw)) {
    fs.writeFileSync(envPath, raw.replace(new RegExp(`^${name}=.*$`, "m"), line));
    return;
  }

  const separator = raw.endsWith("\n") || raw.length === 0 ? "" : "\n";
  fs.writeFileSync(envPath, `${raw}${separator}${line}\n`);
}

const envRaw = readEnvFile();
const apiId = Number(readEnvValue("TELEGRAM_API_ID", envRaw));
const apiHash = readEnvValue("TELEGRAM_API_HASH", envRaw);

if (!apiId || !apiHash) {
  console.error("Missing TELEGRAM_API_ID or TELEGRAM_API_HASH in .env.local");
  process.exit(1);
}

const rl = readline.createInterface({ input, output });
const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
  connectionRetries: 5
});

try {
  await client.start({
    phoneNumber: async () => rl.question("Telegram phone number (with country code): "),
    password: async () => rl.question("Telegram 2FA password (press enter if none): "),
    phoneCode: async () => rl.question("Telegram login code: "),
    onError: (error) => console.error(error)
  });

  writeEnvValue("TELEGRAM_SESSION_STRING", client.session.save());
  console.log("\nTelegram session saved to .env.local");
} finally {
  await client.disconnect();
  rl.close();
}
