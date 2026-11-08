// Recherche d'organisations / catégories / équipes, et ajout d'un tournoi (sans toucher au reste)
const DB = "https://ohmtro-26e56-default-rtdb.firebaseio.com";
const get = async p => { const r = await fetch(DB + "/" + p + ".json"); if (!r.ok) throw new Error("lecture " + p + " : " + r.status); return r.json(); };
const put = async (p, v) => { const r = await fetch(DB + "/" + p + ".json", { method: "PUT", body: JSON.stringify(v) }); if (!r.ok) throw new Error("écriture " + p + " : " + r.status); };
const MODE = process.env.MODE, Q = String(process.env.QUERY || "").trim();
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
if (MODE === "find") {
  const orgs = (await get("global/organizations")) || [];
  const list = (Array.isArray(orgs) ? orgs : Object.values(orgs)).filter(Boolean);
  console.log("ORGS " + JSON.stringify(list.map(o => [o.id, o.name, !!o.hidden])));
  for (const o of list) {
    const cats = (await get(o.id + "/categories")) || [];
    const pre = (await get(o.id + "/teams_presets")) || {};
    const hits = Object.entries(pre).filter(([k, t]) => t && (norm(t.name).includes(norm(Q)) || norm(o.name).includes(norm(Q))));
    if (hits.length || norm(o.name).includes(norm(Q))) {
      console.log("ORG " + o.id + " | " + o.name + " | categories " + JSON.stringify(cats));
      for (const [k, t] of hits) console.log("  TEAM " + k + " | " + t.name + " | cat " + t.category + " | own " + !!t.own);
      for (const c of (Array.isArray(cats) ? cats : Object.values(cats)).filter(Boolean)) { const tr = await get(o.id + "/" + c + "/tournaments"); if (tr) console.log("  TOURNAMENTS " + c + " " + JSON.stringify(Object.fromEntries(Object.entries(tr).map(([k, v]) => [k, v && v.name + " " + v.start])))); }
    }
  }
} else if (MODE === "tournament") {
  const [org, cat] = Q.split("/"); if (!/^[a-z0-9_]+$/.test(org + cat)) throw new Error("org/cat invalide");
  const t = JSON.parse(process.env.DATA || "{}"); if (!t.name || !t.start) throw new Error("tournoi incomplet");
  const id = t.id || ("t" + Date.now().toString(36)); delete t.id; t.updatedAt = Date.now();
  await put(org + "/" + cat + "/tournaments/" + id, t);
  console.log("::notice title=Tournoi::" + t.name + " ajouté dans " + org + "/" + cat + " (" + id + ")");
}
