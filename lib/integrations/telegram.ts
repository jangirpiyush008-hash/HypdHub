export async function fetchTelegramSignalSummary() {
  return {
    status: "pending_channel_list",
    notes: [
      "Waiting for Telegram channel list from HYPD team.",
      "Channels will be read-only and used as trend and popularity signals."
    ]
  };
}
