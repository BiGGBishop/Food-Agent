const FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLSczSHajB_h_ylU53zbHs5Z_G4mcUbDqo00JkB1QZKNGgWlhiA/formResponse";

export default async function handler(req, res) {
  // Only Vercel's cron (or someone with the secret) may trigger this
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  // Order date = next Tuesday (runs on Friday, so +4 days)
  const t = new Date(Date.now() + 4 * 864e5);

  const body = new URLSearchParams({
    emailAddress: "david.o@aestheticclinicgroup.com",
    "entry.186815289": "David Ogunye",
    "entry.171314676_year": String(t.getUTCFullYear()),
    "entry.171314676_month": String(t.getUTCMonth() + 1),
    "entry.171314676_day": String(t.getUTCDate()),
    "entry.412735679": "Jollof Rice and Chicken",
    "entry.2074004688": "No Pepper",
  });

  const r = await fetch(FORM, { method: "POST", body });
  const date = t.toISOString().slice(0, 10);
  console.log(r.ok ? `Submitted order for ${date}` : `Failed: ${r.status}`);
  res.status(r.ok ? 200 : 500).send(r.ok ? `Submitted order for ${date}` : `Failed: ${r.status}`);
}
