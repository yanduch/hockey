// Copie complète d'une catégorie (parties, historique, calendrier, pratiques, tableaux, équipes, réglages)
// vers une nouvelle catégorie. Refuse d'écraser une catégorie qui existe déjà.
// Les comptes (mots de passe) ne sont pas copiés.
const DB = "https://ohmtro-26e56-default-rtdb.firebaseio.com";
process.on("unhandledRejection", e => { console.log("::error title=Copie::" + String(e && e.message || e)); process.exit(1); });
process.on("uncaughtException", e => { console.log("::error title=Copie::" + String(e && e.message || e)); process.exit(1); });
const [ORG, SRC, DST] = [process.env.ORG, process.env.SRC, process.env.DST].map(s => String(s || "").trim().toLowerCase());
const note = t => console.log("::notice title=Copie::" + String(t).replace(/\n/g, "%0A"));
const get = async (p, q) => { const r = await fetch(DB + "/" + p + ".json" + (q || "")); if (!r.ok) throw new Error("lecture " + p + " : " + r.status); return r.json(); };
const put = async (p, v) => { const r = await fetch(DB + "/" + p + ".json", { method: "PUT", body: JSON.stringify(v) }); if (!r.ok) throw new Error("écriture " + p + " : " + r.status + " " + await r.text()); };
if (!/^[a-z0-9_]+$/.test(ORG + SRC + DST) || SRC === DST) throw new Error("Paramètres invalides");

const cats = (await get(ORG + "/categories")) || [];
const list = Array.isArray(cats) ? cats.filter(Boolean) : Object.values(cats);
if (!list.includes(SRC)) throw new Error("La catégorie " + SRC + " n'existe pas (" + list.join(", ") + ")");
if (list.includes(DST) || (await get(ORG + "/" + DST, "?shallow=true"))) throw new Error("La catégorie " + DST + " existe déjà : rien n'est fait");

// Équipes de la catégorie : nouvelles clés (aigles_m15a -> aigles_m15atest)
const presets = (await get(ORG + "/teams_presets")) || {};
const map = {};
for (const k of Object.keys(presets)) if (presets[k] && presets[k].category === SRC)
  map[k] = k.endsWith("_" + SRC) ? k.slice(0, -SRC.length) + DST : k + "_" + DST;
const swapKey = s => { if (map[s]) return map[s]; for (const o in map) if (s.startsWith(o + "__")) return map[o] + s.slice(o.length); return s; };
const deep = v => Array.isArray(v) ? v.map(deep) : (v && typeof v === "object")
  ? Object.fromEntries(Object.entries(v).map(([k, x]) => [swapKey(k), deep(x)])) : (typeof v === "string" ? swapKey(v) : v);

// 1. Toutes les données de la catégorie
const data = await get(ORG + "/" + SRC);
if (data) await put(ORG + "/" + DST, deep(data));
note("Données de " + SRC + " copiées : " + Object.keys(data || {}).join(", "));
// 2. Les équipes
for (const [o, n] of Object.entries(map)) { const t = deep(presets[o]); t.category = DST; await put(ORG + "/teams_presets/" + n, t); }
note(Object.keys(map).length + " équipe(s) copiée(s) : " + Object.values(map).join(", "));
// 3. Réglages de la catégorie et droits des gérants
const cfg = (await get(ORG + "/config")) || {};
for (const f of ["phases", "regStart"]) if (cfg[f] && cfg[f][SRC] != null) await put(ORG + "/config/" + f + "/" + DST, cfg[f][SRC]);
const gp = (await get(ORG + "/gerantPerms")) || {};
for (const [o, n] of Object.entries(map)) if (gp[o]) await put(ORG + "/gerantPerms/" + n, gp[o]);
// 4. La catégorie dans la liste (en dernier : elle n'apparaît qu'une fois tout copié)
await put(ORG + "/categories", list.concat([DST]));
note("Catégorie " + DST.toUpperCase() + " ajoutée à " + ORG);
