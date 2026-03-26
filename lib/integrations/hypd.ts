export async function fetchHypdProducts() {
  return {
    status: "pending_real_api",
    notes: [
      "Awaiting HYPD product API credentials.",
      "Will ingest product, pricing, sold count, clicks, and conversion metadata."
    ]
  };
}

export async function fetchHypdUserSession() {
  return {
    status: "pending_real_auth",
    notes: [
      "Awaiting HYPD auth API / SSO flow.",
      "Will exchange credentials for user profile and creator session."
    ]
  };
}
