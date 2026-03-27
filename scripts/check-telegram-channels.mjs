import fs from "node:fs";
import path from "node:path";
import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const channelUrls = [
  "https://t.me/+kTvbwlaPbH1mM2E1",
  "https://t.me/addlist/tYS3168v3CAzN2Y1",
  "https://t.me/+10LxDtJO6SIxZGM1",
  "https://t.me/Loot_DealsX",
  "https://t.me/+lEEQraQyKwljNGQ1",
  "https://t.me/dealdost",
  "https://t.me/+F3S5BE_u6gE4Yjc1",
  "https://t.me/indlootdeals",
  "https://t.me/addlist/kuItf28wEAE2ZTBl",
  "https://t.me/+_WhgYzSWa8UwNmE1",
  "https://t.me/+UdmfyH1wg4k4MDRl",
  "https://t.me/+qOb_vqtJQahkMmM9",
  "https://t.me/rapiddeals_unlimited",
  "https://t.me/+SHMJO014m9MxNDFl",
  "https://t.me/mspdealsofficial",
  "https://t.me/RaredealsX",
  "https://t.me/nikhilfkm",
  "https://t.me/nonstopdeals",
  "https://t.me/+87hjP41TjrJjNmY9",
  "https://t.me/+7ufF-z6CPo8zYzI1",
  "https://t.me/+Sxbr5rxf5wNl7-NW",
  "https://t.me/+KgUrCwnDny02ZDk1",
  "https://t.me/+qY-Q9jrNB181YmE1",
  "https://t.me/+MFd-niD2wJJiZjBl",
  "https://t.me/+yqgcolaIc-BjNDBl",
  "https://t.me/TrickXpert",
  "https://t.me/+hTJVrdcJhh40M2I1",
  "https://telegram.me/+U73hXkdre7hxyQ6H",
  "https://telegram.me/+-8rgA-qcVohjMmY1",
  "https://t.me/Mojdealzone",
  "https://t.me/+EA1nJVHLfPw0YzQ1",
  "https://t.me/+Th6aG5Zaxz_i_u7a",
  "https://t.me/+0gqlB6-vq8I4OWJl"
];

const cwd = process.cwd();
const envPath = path.join(cwd, ".env.local");
const envRaw = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

function readEnvValue(name) {
  const match = envRaw.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

function parseChannel(url) {
  const normalized = url.replace(/^https?:\/\/(t|telegram)\.me\//, "");

  if (normalized.startsWith("addlist/")) {
    return { kind: "addlist", value: normalized.replace("addlist/", "") };
  }

  if (normalized.startsWith("+")) {
    return { kind: "invite", value: normalized.slice(1) };
  }

  return { kind: "public", value: normalized };
}

const apiId = Number(readEnvValue("TELEGRAM_API_ID"));
const apiHash = readEnvValue("TELEGRAM_API_HASH");
const session = readEnvValue("TELEGRAM_SESSION_STRING");

if (!apiId || !apiHash || !session) {
  console.error("Missing TELEGRAM_API_ID, TELEGRAM_API_HASH, or TELEGRAM_SESSION_STRING in .env.local");
  process.exit(1);
}

const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
  connectionRetries: 5
});

async function resolveChannel(url) {
  const parsed = parseChannel(url);

  if (parsed.kind === "addlist") {
    return { url, status: "needs_manual_expansion", title: null };
  }

  if (parsed.kind === "public") {
    const entity = await client.getEntity(parsed.value);
    const messages = await client.getMessages(entity, { limit: 3 });
    return {
      url,
      status: "readable",
      title: "title" in entity ? entity.title : parsed.value,
      messageCount: messages.length
    };
  }

  const invite = await client.invoke(new Api.messages.CheckChatInvite({ hash: parsed.value }));

  if (invite instanceof Api.ChatInviteAlready) {
    const messages = await client.getMessages(invite.chat, { limit: 3 });
    return {
      url,
      status: "readable",
      title: "title" in invite.chat ? invite.chat.title : parsed.value,
      messageCount: messages.length
    };
  }

  return {
    url,
    status: "invite_visible_but_not_joined",
    title: "title" in invite ? invite.title : null
  };
}

try {
  await client.connect();

  for (const url of channelUrls) {
    try {
      const result = await resolveChannel(url);
      console.log(JSON.stringify(result));
    } catch (error) {
      console.log(JSON.stringify({ url, status: "error", error: String(error) }));
    }
  }
} finally {
  await client.disconnect();
}
