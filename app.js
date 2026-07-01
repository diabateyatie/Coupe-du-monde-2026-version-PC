// ─── LOGIQUE APPLICATION — Version PC ───
const EMPTY = { flag: "", name: "?" };
const STORAGE_KEY = "cdm2026_pc_v1";
const API_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

// Correspondance noms anglais (API) → noms français (bracket)
const NAME_MAP = {
  "South Africa":"Afrique du Sud", "Canada":"Canada",
  "Germany":"Allemagne",           "Paraguay":"Paraguay",
  "Netherlands":"Pays-Bas",        "Morocco":"Maroc",
  "Brazil":"Brésil",               "Japan":"Japon",
  "France":"France",               "Sweden":"Suède",
  "Ivory Coast":"Côte d'Ivoire",   "Norway":"Norvège",
  "Mexico":"Mexique",              "Ecuador":"Équateur",
  "England":"Angleterre",          "DR Congo":"RD Congo",
  "USA":"États-Unis",              "Bosnia & Herzegovina":"Bosnie-Herz.",
  "Belgium":"Belgique",            "Senegal":"Sénégal",
  "Portugal":"Portugal",           "Croatia":"Croatie",
  "Spain":"Espagne",               "Austria":"Autriche",
  "Switzerland":"Suisse",          "Algeria":"Algérie",
  "Argentina":"Argentine",         "Cape Verde":"Cap-Vert",
  "Colombia":"Colombie",           "Ghana":"Ghana",
  "Australia":"Australie",         "Egypt":"Égypte",
};

// ─── ÉTAT INITIAL ───
function initState() {
  return {
    r32: R32.map((m,i) => ({...m, id:`r32_${i}`, winner:null})),
    r16: R16_PAIRS.map((p,i) => ({...p, id:`r16_${i}`, a:{...EMPTY}, b:{...EMPTY}, winner:null})),
    qf:  QF_PAIRS.map((p,i)  => ({...p, id:`qf_${i}`,  a:{...EMPTY}, b:{...EMPTY}, winner:null})),
    sf:  SF_PAIRS.map((p,i)  => ({...p, id:`sf_${i}`,  a:{...EMPTY}, b:{...EMPTY}, winner:null})),
    fin: {...FINALE,    id:"fin", a:{...EMPTY}, b:{...EMPTY}, winner:null},
    trd: {...TROISIEME, id:"trd", a:{...EMPTY}, b:{...EMPTY}, winner:null},
  };
}

function getW(m) { return (m?.winner) ? (m.winner==="a"?{...m.a}:{...m.b}) : {...EMPTY}; }
function getL(m) { return (m?.winner) ? (m.winner==="a"?{...m.b}:{...m.a}) : {...EMPTY}; }
function chg(m,na,nb) { return na.name!==m.a.name || nb.name!==m.b.name; }

function compute(s) {
  const r16 = R16_PAIRS.map((p,i) => {
    const na=getW(s.r32[p.src[0]]), nb=getW(s.r32[p.src[1]]);
    return {...s.r16[i], a:na, b:nb, winner:chg(s.r16[i],na,nb)?null:s.r16[i].winner};
  });
  const qf = QF_PAIRS.map((p,i) => {
    const na=getW(r16[p.src[0]]), nb=getW(r16[p.src[1]]);
    return {...s.qf[i], a:na, b:nb, winner:chg(s.qf[i],na,nb)?null:s.qf[i].winner};
  });
  const sf = SF_PAIRS.map((p,i) => {
    const na=getW(qf[p.src[0]]), nb=getW(qf[p.src[1]]);
    return {...s.sf[i], a:na, b:nb, winner:chg(s.sf[i],na,nb)?null:s.sf[i].winner};
  });
  const fna=getW(sf[0]), fnb=getW(sf[1]);
  const fin = {...s.fin, a:fna, b:fnb, winner:chg(s.fin,fna,fnb)?null:s.fin.winner};
  const trd = {...s.trd, a:getL(sf[0]), b:getL(sf[1]), winner:null};
  return {...s, r16, qf, sf, fin, trd};
}

// ─── STOCKAGE localStorage (natif, fiable sur PC) ───
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return compute(initState());
}

let saveTimeout;
function saveState(s) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e){}
    const bar = document.getElementById("savedBar");
    bar.classList.add("show");
    setTimeout(() => bar.classList.remove("show"), 1500);
  }, 300);
}

// ─── ÉTAT GLOBAL ───
let state = loadState();

// ─── ACTIONS ───
function pick(roundKey, idx, side) {
  if (Array.isArray(state[roundKey])) {
    const arr = [...state[roundKey]];
    arr[idx] = {...arr[idx], winner:side};
    state = compute({...state, [roundKey]:arr});
  } else {
    state = compute({...state, [roundKey]:{...state[roundKey], winner:side}});
  }
  saveState(state);
  render();
}

function resetAll() {
  if (!confirm("Réinitialiser tout le bracket ?")) return;
  state = compute(initState());
  saveState(state);
  render();
}

// ─── AUTO-FILL depuis l'API openfootball ───
function winnerSide(score) {
  if (!score) return null;
  if (score.p != null) return score.p[0] > score.p[1] ? "a" : "b";
  if (score.et != null) return score.et[0] > score.et[1] ? "a" : "b";
  if (score.ft != null) {
    if (score.ft[0] === score.ft[1]) return null;
    return score.ft[0] > score.ft[1] ? "a" : "b";
  }
  return null;
}

async function autoFillFromAPI() {
  const btn = document.querySelector(".btn.primary");
  if (btn) { btn.textContent = "⏳ Chargement..."; btn.disabled = true; }
  try {
    const res = await fetch(API_URL + "?t=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const matches = data.matches || [];
    let changed = false;
    let ns = {...state, r32:[...state.r32]};

    // Round of 32
    for (const m of matches) {
      if (m.round !== "Round of 32") continue;
      const side = winnerSide(m.score);
      if (!side) continue;
      const nameA = NAME_MAP[m.team1] || m.team1;
      const nameB = NAME_MAP[m.team2] || m.team2;
      const idx = ns.r32.findIndex(r =>
        (r.a.name===nameA && r.b.name===nameB) ||
        (r.a.name===nameB && r.b.name===nameA)
      );
      if (idx === -1) continue;
      const flip = ns.r32[idx].a.name !== nameA;
      const realSide = flip ? (side==="a"?"b":"a") : side;
      if (ns.r32[idx].winner !== realSide) {
        ns.r32[idx] = {...ns.r32[idx], winner:realSide};
        changed = true;
      }
    }

    // Rounds suivants (noms résolus)
    const roundKeys = [
      {round:"Round of 16", key:"r16"},
      {round:"Quarter-final", key:"qf"},
      {round:"Semi-final", key:"sf"},
    ];
    let cs = compute(ns);
    for (const {round, key} of roundKeys) {
      const arr = [...cs[key]];
      let rc = false;
      for (const m of matches) {
        if (m.round !== round) continue;
        const side = winnerSide(m.score);
        if (!side) continue;
        if (/^W\d+$/.test(m.team1) || /^W\d+$/.test(m.team2)) continue;
        const nameA = NAME_MAP[m.team1] || m.team1;
        const nameB = NAME_MAP[m.team2] || m.team2;
        const idx = arr.findIndex(r =>
          (r.a.name===nameA && r.b.name===nameB) ||
          (r.a.name===nameB && r.b.name===nameA)
        );
        if (idx === -1) continue;
        const flip = arr[idx].a.name !== nameA;
        const realSide = flip ? (side==="a"?"b":"a") : side;
        if (arr[idx].winner !== realSide) { arr[idx]={...arr[idx],winner:realSide}; rc=true; changed=true; }
      }
      if (rc) cs = compute({...cs, [key]:arr});
    }

    // Finale
    for (const m of matches) {
      if (m.round !== "Final") continue;
      const side = winnerSide(m.score);
      if (!side || /^W\d+$/.test(m.team1)) continue;
      const nameA = NAME_MAP[m.team1] || m.team1;
      const flip = cs.fin.a.name !== nameA;
      const realSide = flip ? (side==="a"?"b":"a") : side;
      if (cs.fin.winner !== realSide) {
        cs = compute({...cs, fin:{...cs.fin, winner:realSide}});
        changed = true;
      }
    }

    if (changed) { state = cs; saveState(state); render(); }
    if (btn) btn.textContent = changed ? "✓ Mis à jour !" : "✓ Déjà à jour";
  } catch(e) {
    console.error("API error:", e);
    if (btn) btn.textContent = "✗ Erreur réseau";
  }
  setTimeout(() => {
    if (btn) { btn.textContent = "🔄 Actualiser les résultats"; btn.disabled = false; }
  }, 3000);
}

// ─── RENDU HTML ───
function flagHTML(team) {
  if (!team.flag) return `<span class="flag-empty"></span>`;
  return `<img class="flag" src="${team.flag}" alt="${team.name}" loading="lazy" onerror="this.style.display='none'">`;
}

function teamHTML(match, side, roundKey, idx) {
  const t = match[side];
  const can = match.a.name!=="?" && match.b.name!=="?";
  const won  = match.winner === side;
  const lost = match.winner && !won;
  const cls  = `team${won?" winner":lost?" loser":""}${can?" can-click":""}`;
  const onclick = can ? `onclick="pick('${roundKey}',${idx===null?"null":idx},'${side}')"` : "";
  return `
    <div class="${cls}" ${onclick}>
      ${flagHTML(t)}
      <span class="name">${t.name}</span>
      ${won ? '<span class="check">✓</span>' : ''}
    </div>`;
}

function cardHTML(match, roundKey, idx) {
  return `
    <div class="card ${match.winner?"has-winner":""}">
      ${match.day ? `<div class="meta"><span>${match.day}</span><span class="time">${match.time} GMT</span></div>` : ""}
      ${teamHTML(match,"a",roundKey,idx)}
      ${teamHTML(match,"b",roundKey,idx)}
    </div>`;
}

// ─── LAYOUT EN COLONNES AVEC CONNECTEURS SVG ───
function connectorSVG(count, matchH, gap, dir) {
  const W = 20;
  const unit = matchH * 2 + gap;
  const H = count * unit + (count-1) * gap;
  const lines = [];
  for (let i=0; i<count; i++) {
    const base = i * (unit + gap);
    const y1 = base + matchH/2;
    const y2 = base + matchH + gap + matchH/2;
    const cx = dir==="right" ? W : 0;
    const ox = dir==="right" ? 0 : W;
    lines.push(
      `<line x1="${ox}" y1="${y1}" x2="${cx}" y2="${y1}" stroke="#1a3354" stroke-width="1"/>`,
      `<line x1="${ox}" y1="${y2}" x2="${cx}" y2="${y2}" stroke="#1a3354" stroke-width="1"/>`,
      `<line x1="${cx}" y1="${y1}" x2="${cx}" y2="${y2}" stroke="#1a3354" stroke-width="1"/>`
    );
  }
  return `<div class="connector"><svg width="${W}" height="${H}">${lines.join("")}</svg></div>`;
}

function colHTML(title, matches, roundKey, gap, dir) {
  const MATCH_H = 30; // hauteur approximative d'une carte (2 teams)
  const spacerH = gap;
  let matchesHTML = matches.map((m,i) => `
    <div class="match-wrap">
      <div class="match-num">${m.fifa}</div>
      ${cardHTML(m, roundKey, i)}
    </div>
    ${i < matches.length-1 ? `<div class="match-spacer" style="height:${spacerH}px"></div>` : ""}
  `).join("");
  return `
    <div class="round-col">
      <div class="round-title">${title}</div>
      <div class="matches-list">${matchesHTML}</div>
    </div>`;
}

function render() {
  const root = document.getElementById("bracketRoot");

  // Champion
  const badge = document.getElementById("championBadge");
  if (state.fin?.winner) {
    const c = state.fin.winner==="a" ? state.fin.a : state.fin.b;
    badge.innerHTML = `<span>🥇 Champion :</span>${flagHTML(c)}<strong style="color:#c9a84c">${c.name}</strong>`;
    badge.style.display = "inline-flex";
  } else {
    badge.innerHTML = "";
    badge.style.display = "none";
  }

  const G32=4, G16=36, GQF=110, GSF=258;

  // Layout : R32 gauche → conn → R16 → conn → QF → conn → SF → conn → FINALE ← conn ← SF ← conn ← QF ← conn ← R16 ← conn ← R32 droite
  // Pour simplifier sur PC, on fait un layout vertical par tour (plus lisible)
  // avec les 16es en 2 colonnes de 8, puis 8es en 2 colonnes de 4, etc.

  root.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:0;padding:0 8px">

      <!-- R32 gauche (M73-M87 ordre chrono, indices pairs côté gauche) -->
      ${colHTML("Seizièmes de finale (1-8)", state.r32.slice(0,8), "r32", G32, "right")}
      ${connectorSVG(4, 30+18, G32, "right")}

      <!-- 8es gauche -->
      ${colHTML("Huitièmes", state.r16.slice(0,4), "r16", G16, "right")}
      ${connectorSVG(2, 30+18, G16, "right")}

      <!-- QF gauche -->
      ${colHTML("Quarts", state.qf.slice(0,2), "qf", GQF, "right")}
      ${connectorSVG(1, 30+18, GQF, "right")}

      <!-- SF gauche -->
      ${colHTML("Demi-finales", [state.sf[0]], "sf", GSF, "right")}

      <!-- Connexion SF → Finale -->
      <div class="connector" style="padding-top:18px">
        <svg width="20" height="48"><line x1="0" y1="24" x2="20" y2="24" stroke="#1a3354" stroke-width="1"/></svg>
      </div>

      <!-- CENTRE : Finale + 3e place -->
      <div class="center-col">
        <div class="center-section">
          <div class="center-title">🏆 Finale</div>
          <div class="match-num">${state.fin.fifa}</div>
          ${cardHTML(state.fin, "fin", null)}
        </div>
        <div class="center-section" style="margin-top:20px">
          <div class="center-title">🥉 3e Place</div>
          <div class="match-num">${state.trd.fifa}</div>
          ${cardHTML(state.trd, "trd", null)}
        </div>
      </div>

      <!-- Connexion Finale ← SF -->
      <div class="connector" style="padding-top:18px">
        <svg width="20" height="48"><line x1="0" y1="24" x2="20" y2="24" stroke="#1a3354" stroke-width="1"/></svg>
      </div>

      <!-- SF droite -->
      ${colHTML("Demi-finales", [state.sf[1]], "sf_r", GSF, "left")}
      ${connectorSVG(1, 30+18, GQF, "left")}

      <!-- QF droite -->
      ${colHTML("Quarts", state.qf.slice(2), "qf_r", GQF, "left")}
      ${connectorSVG(2, 30+18, G16, "left")}

      <!-- 8es droite -->
      ${colHTML("Huitièmes", state.r16.slice(4), "r16_r", G16, "left")}
      ${connectorSVG(4, 30+18, G32, "left")}

      <!-- R32 droite -->
      ${colHTML("Seizièmes de finale (9-16)", state.r32.slice(8), "r32_r", G32, "right")}
    </div>`;

  // Rebrancher les picks pour sf_r, qf_r, r16_r (alias)
  document.querySelectorAll("[onclick*='sf_r']").forEach(el => {
    el.setAttribute("onclick", el.getAttribute("onclick").replace("'sf_r',", "'sf',").replace(",0,",",(1),").replace(",1,",",(1),"));
  });
  // Gestion manuelle des alias de colonnes miroir
  fixMirrorClicks();
}

function fixMirrorClicks() {
  // SF droite = sf[1]
  document.querySelectorAll("[onclick*=\"'sf_r'\"]").forEach(el => {
    const side = el.getAttribute("onclick").match(/'([ab])'\)/)[1];
    el.setAttribute("onclick", `pick('sf',1,'${side}')`);
  });
  // QF droite = qf[2] et qf[3]
  document.querySelectorAll("[onclick*=\"'qf_r'\"]").forEach((el,i) => {
    const side = el.getAttribute("onclick").match(/'([ab])'\)/)[1];
    const idx = Math.floor(i/2) + 2;
    el.setAttribute("onclick", `pick('qf',${idx},'${side}')`);
  });
  // R16 droite = r16[4..7]
  document.querySelectorAll("[onclick*=\"'r16_r'\"]").forEach((el,i) => {
    const side = el.getAttribute("onclick").match(/'([ab])'\)/)[1];
    const idx = Math.floor(i/2) + 4;
    el.setAttribute("onclick", `pick('r16',${idx},'${side}')`);
  });
  // R32 droite = r32[8..15]
  document.querySelectorAll("[onclick*=\"'r32_r'\"]").forEach((el,i) => {
    const side = el.getAttribute("onclick").match(/'([ab])'\)/)[1];
    const idx = Math.floor(i/2) + 8;
    el.setAttribute("onclick", `pick('r32',${idx},'${side}')`);
  });
}

// ─── DÉMARRAGE ───
render();
autoFillFromAPI();
