const BASE =
  "https://docs.google.com/forms/d/e/1FAIpQLSczSHajB_h_ylU53zbHs5Z_G4mcUbDqo00JkB1QZKNGgWlhiA";

export default async function handler(req, res) {
  // Only Vercel's cron (or someone with the secret) may trigger this
  const secret = (process.env.CRON_SECRET || "").trim();
  const auth = (req.headers.authorization || "").trim();
  if (!secret || auth !== `Bearer ${secret}`) {
    console.log("Unauthorized", { secretSet: !!secret, authSent: !!auth });
    return res.status(401).end();
  }

  // Order date = the next Tuesday, in Lagos time (UTC+1)
  const now = new Date(Date.now() + 36e5);
  const days = (2 - now.getUTCDay() + 7) % 7 || 7;
  const t = new Date(now.getTime() + days * 864e5);
  const date = t.toISOString().slice(0, 10);

  // Load the form first to get its session token (fbzx) and cookies
  const view = await fetch(`${BASE}/viewform`);
  const html = await view.text();
  const fbzx =
    (html.match(/name="fbzx" value="(-?\d+)"/) || [])[1] ||
    String(Math.floor(Math.random() * 9e18));
  const cookie = (view.headers.getSetCookie?.() || [])
    .map((c) => c.split(";")[0])
    .join("; ");

  const body = new URLSearchParams({
    emailAddress: "david.o@aestheticclinicgroup.com",
    "entry.186815289": "David Ogunye",
    "entry.171314676_year": String(t.getUTCFullYear()),
    "entry.171314676_month": String(t.getUTCMonth() + 1),
    "entry.171314676_day": String(t.getUTCDate()),
    "entry.412735679": "Jollof Rice and Chicken",
    "entry.412735679_sentinel": "",
    "entry.2074004688": "No Pepper",
    "entry.2074004688_sentinel": "",
    emailReceipt: "true",
    fvv: "1",
    partialResponse: JSON.stringify([null, null, fbzx]),
    pageHistory: "0",
    fbzx,
    submissionTimestamp: "-1",
  });

  const r = await fetch(`${BASE}/formResponse`, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `${BASE}/viewform`,
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });

  if (r.ok) {
    console.log(`Submitted order for ${date}`);
    return res.status(200).send(`Submitted order for ${date}`);
  }
  const text = await r.text();
  const reason = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 300);
  console.log(`Failed: ${r.status} (fbzx found: ${html.includes('name="fbzx"')}) ${reason}`);
  res.status(500).send(`Failed: ${r.status}`);
}
