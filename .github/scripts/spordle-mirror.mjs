// Copie des calendriers Spordle des équipes (adresse inscrite dans la fiche de l'équipe) dans le dossier spordle/.
// Sert de relais si le navigateur ne peut pas lire l'adresse Spordle directement. Aucune page web n'est visitée :
// seulement l'adresse d'abonnement publique (.ics) fournie par Spordle.
import fs from "node:fs";
const DB = "https://ohmtro-26e56-default-rtdb.firebaseio.com";
const get = async p => { const r = await fetch(DB + "/" + p + ".json"); if (!r.ok) throw new Error(p + " : HTTP " + r.status); return r.json(); };
fs.mkdirSync("spordle", { recursive: true });
const orgs = (await get("global/organizations")) || [];
const list = Array.isArray(orgs) ? orgs : Object.values(orgs);
let n = 0, bad = 0;
for (const o of list) {
  if (!o || !o.id) continue;
  const teams = (await get(o.id + "/teams_presets")) || {};
  for (const [key, t] of Object.entries(teams)) {
    if (!t || !t.icsUrl || !/^https:\/\//.test(t.icsUrl)) continue;
    const file = "spordle/" + o.id + "__" + key + ".ics";
    try {
      const r = await fetch(t.icsUrl, { headers: { Accept: "text/calendar" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      let text = await r.text();
      if (!/BEGIN:VCALENDAR/.test(text)) throw new Error("pas un calendrier");
      text = text.replace(/\r?\nDTSTAMP:[^\r\n]*/g, "");           // change à chaque lecture : pas de faux changements
      fs.writeFileSync(file, text); n++;
      console.log("OK " + file + " (" + (text.match(/BEGIN:VEVENT/g) || []).length + " événements)");
    } catch (e) { bad++; console.log("::warning title=" + t.name + "::" + e.message); }
  }
}
console.log(n + " calendrier(s) copiés, " + bad + " erreur(s)");
