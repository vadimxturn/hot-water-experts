import "server-only";

export interface SyncResult {
  status: "stubbed" | "sent" | "error";
  at: string;
  detail: string;
}

export async function syncLeadToGhl(payload: unknown): Promise<SyncResult> {
  const at = new Date().toISOString();
  const url = process.env.GHL_WEBHOOK_URL;
  if (!url) {
    return {
      status: "stubbed",
      at,
      detail: "GHL_WEBHOOK_URL is not set. The lead is saved here only.",
    };
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return { status: "error", at, detail: `GoHighLevel webhook returned ${response.status}.` };
    }
    return { status: "sent", at, detail: "Posted to the GoHighLevel webhook." };
  } catch (error) {
    return {
      status: "error",
      at,
      detail: error instanceof Error ? error.message : "GoHighLevel webhook failed.",
    };
  }
}

export async function sendSms(to: string, body: string): Promise<SyncResult> {
  const at = new Date().toISOString();
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    return {
      status: "stubbed",
      at,
      detail: "Twilio is not configured. The text is saved on the job and was not sent.",
    };
  }
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  if (!response.ok) {
    return { status: "error", at, detail: `Twilio returned ${response.status}. The text was kept on the job.` };
  }
  return { status: "sent", at, detail: "Sent with Twilio." };
}

export async function createDepositIntent(amountCents = 10000) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { mode: "stub" as const, ref: `stub_${Date.now()}` };
  }
  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      amount: String(amountCents),
      currency: "usd",
      "automatic_payment_methods[enabled]": "true",
      description: "Hot Water Experts refundable deposit",
    }),
  });
  if (!response.ok) {
    return { mode: "stub" as const, ref: `stub_${Date.now()}`, warning: "Stripe rejected the request. Recorded as a stub." };
  }
  const json = (await response.json()) as { id?: string };
  return { mode: "stripe" as const, ref: json.id || `pi_${Date.now()}` };
}

export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export async function driveEta(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
) {
  const fallback = () => {
    const miles = Math.round(haversineMiles(origin, destination) * 10) / 10;
    const minutes = Math.max(4, Math.round((miles / 28) * 60));
    return { miles, minutes, source: "estimate" as const };
  };
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return fallback();
  try {
    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: "DRIVE",
      }),
    });
    if (!response.ok) return fallback();
    const json = (await response.json()) as {
      routes?: { duration?: string; distanceMeters?: number }[];
    };
    const route = json.routes?.[0];
    if (!route?.distanceMeters || !route.duration) return fallback();
    const seconds = Number(String(route.duration).replace("s", ""));
    return {
      miles: Math.round((route.distanceMeters / 1609.34) * 10) / 10,
      minutes: Math.max(1, Math.round(seconds / 60)),
      source: "google" as const,
    };
  } catch {
    return fallback();
  }
}
