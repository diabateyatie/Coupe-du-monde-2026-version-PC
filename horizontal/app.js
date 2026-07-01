// ─── LOGIQUE APPLICATION — Version PC ───
const EMPTY = { flag: "", name: "?" };
const STORAGE_KEY = "cdm2026_pc_v1";
const API_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

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

function getW(m) { return m?.winner ? (m.winner==="a"?{...m.a}:{...m.b}) : {...EMPTY}; }
function getL(m) { return m?.winner ? (m.winner==="a"?{...m.b}:{...m.a}) : {...EMPTY}; }
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
  const fin={...s.fin, a:fna, b:fnb, winner:chg(s.fin,fna,fnb)?null:s.fin.winner};
  const trd={...s.trd, a:getL(sf[0]), b:getL(sf[1]), winner:null};
  return {...s, r16, qf, sf, fin, trd};
}

// ─── STOCKAGE ───
function loadState() {
  try { const r=localStorage.getItem(STORAGE_KEY); if(r) return JSON.parse(r); } catch(e){}
  return compute(initState());
}
let saveTimeout;
function saveState(s) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e){}
    const bar = document.getElementById("savedBar");
    if (bar) { bar.classList.add("show"); setTimeout(()=>bar.classList.remove("show"), 1500); }
  }, 300);
}

let state = loadState();

// ─── ACTIONS ───
function pick(roundKey, idx, side) {
  if (Array.isArray(state[roundKey])) {
    const arr=[...state[roundKey]];
    arr[idx]={...arr[idx], winner:side};
    state=compute({...state, [roundKey]:arr});
  } else {
    state=compute({...state, [roundKey]:{...state[roundKey], winner:side}});
  }
  saveState(state);
  render();
}

function resetAll() {
  if (!confirm("Réinitialiser tout le bracket ?")) return;
  state=compute(initState());
  saveState(state);
  render();
}

// ─── AUTO-FILL API ───
function winnerSide(score) {
  if (!score) return null;
  if (score.p!=null) return score.p[0]>score.p[1]?"a":"b";
  if (score.et!=null) return score.et[0]>score.et[1]?"a":"b";
  if (score.ft!=null) { if(score.ft[0]===score.ft[1]) return null; return score.ft[0]>score.ft[1]?"a":"b"; }
  return null;
}

async function autoFillFromAPI() {
  const btn = document.getElementById("btnRefresh");
  if (btn) { btn.textContent="⏳ Chargement..."; btn.disabled=true; }
  try {
    const res = await fetch(API_URL+"?t="+Date.now());
    if (!res.ok) throw new Error("HTTP "+res.status);
    const data = await res.json();
    const matches = data.matches||[];
    let changed=false;
    let ns={...state, r32:[...state.r32]};

    for (const m of matches) {
      if (m.round!=="Round of 32") continue;
      const side=winnerSide(m.score); if(!side) continue;
      const nameA=NAME_MAP[m.team1]||m.team1, nameB=NAME_MAP[m.team2]||m.team2;
      const idx=ns.r32.findIndex(r=>(r.a.name===nameA&&r.b.name===nameB)||(r.a.name===nameB&&r.b.name===nameA));
      if (idx===-1) continue;
      const flip=ns.r32[idx].a.name!==nameA;
      const rs=flip?(side==="a"?"b":"a"):side;
      if (ns.r32[idx].winner!==rs) { ns.r32[idx]={...ns.r32[idx],winner:rs}; changed=true; }
    }

    const rounds=[{round:"Round of 16",key:"r16"},{round:"Quarter-final",key:"qf"},{round:"Semi-final",key:"sf"}];
    let cs=compute(ns);
    for (const {round,key} of rounds) {
      const arr=[...cs[key]]; let rc=false;
      for (const m of matches) {
        if (m.round!==round) continue;
        const side=winnerSide(m.score); if(!side) continue;
        if (/^W\d+$/.test(m.team1)||/^W\d+$/.test(m.team2)) continue;
        const nameA=NAME_MAP[m.team1]||m.team1, nameB=NAME_MAP[m.team2]||m.team2;
        const idx=arr.findIndex(r=>(r.a.name===nameA&&r.b.name===nameB)||(r.a.name===nameB&&r.b.name===nameA));
        if (idx===-1) continue;
        const flip=arr[idx].a.name!==nameA;
        const rs=flip?(side==="a"?"b":"a"):side;
        if (arr[idx].winner!==rs) { arr[idx]={...arr[idx],winner:rs}; rc=true; changed=true; }
      }
      if (rc) cs=compute({...cs,[key]:arr});
    }

    for (const m of matches) {
      if (m.round!=="Final") continue;
      const side=winnerSide(m.score); if(!side||/^W\d+$/.test(m.team1)) continue;
      const nameA=NAME_MAP[m.team1]||m.team1;
      const flip=cs.fin.a.name!==nameA;
      const rs=flip?(side==="a"?"b":"a"):side;
      if (cs.fin.winner!==rs) { cs=compute({...cs,fin:{...cs.fin,winner:rs}}); changed=true; }
    }

    if (changed) { state=cs; saveState(state); render(); }
    if (btn) btn.textContent=changed?"✓ Mis à jour !":"✓ Déjà à jour";
  } catch(e) {
    console.error(e);
    if (btn) btn.textContent="✗ Erreur réseau";
  }
  setTimeout(()=>{ if(btn){btn.textContent="🔄 Actualiser les résultats";btn.disabled=false;}},3000);
}

// ─── RENDU ───
function flagHTML(team) {
  if (!team.flag) return `<span class="flag-empty"></span>`;
  return `<img class="flag" src="${team.flag}" alt="${team.name}" loading="lazy" onerror="this.style.display='none'">`;
}

function cardHTML(match, roundKey, idx) {
  const can = match.a.name!=="?" && match.b.name!=="?";
  function teamHTML(side) {
    const t=match[side], won=match.winner===side, lost=match.winner&&!won;
    const cls=`team${won?" winner":lost?" loser":""}${can?" can-click":""}`;
    const oc=can?`onclick="pick('${roundKey}',${idx===null?"null":idx},'${side}')"` :"";
    return `<div class="${cls}" ${oc}>${flagHTML(t)}<span class="name">${t.name}</span>${won?'<span class="check">✓</span>':''}</div>`;
  }
  return `
    <div class="card${match.winner?" has-winner":""}">
      ${match.day?`<div class="meta"><span>${match.day}</span><span class="time">${match.time} GMT</span></div>`:""}
      ${teamHTML("a")}${teamHTML("b")}
    </div>`;
}

function sectionHTML(label, emoji, matches, roundKey, cols) {
  const cards = matches.map((m,i) => `
    <div>
      <div class="match-num">${m.fifa}</div>
      ${cardHTML(m, roundKey, i)}
    </div>`).join("");
  return `
    <div class="section">
      <div class="section-header">
        ${emoji?`<span class="emoji">${emoji}</span>`:""}
        <span class="label">${label}</span>
        <div class="line"></div>
        <span class="count">${matches.length} match${matches.length>1?"s":""}</span>
      </div>
      <div class="grid cols-${cols}">${cards}</div>
    </div>`;
}

function render() {
  const root = document.getElementById("bracketRoot");

  // Champion
  const badge = document.getElementById("championBadge");
  if (state.fin?.winner) {
    const c=state.fin.winner==="a"?state.fin.a:state.fin.b;
    badge.innerHTML=`<span>🥇 Champion :</span>${flagHTML(c)}<strong style="color:#c9a84c">${c.name}</strong>`;
    badge.style.display="inline-flex";
  } else { badge.innerHTML=""; badge.style.display="none"; }

  root.innerHTML = [
    sectionHTML("Seizièmes de finale", "", state.r32, "r32", 4),
    sectionHTML("Huitièmes de finale", "⚡", state.r16, "r16", 4),
    sectionHTML("Quarts de finale", "🔥", state.qf, "qf", 4),
    sectionHTML("Demi-finales", "🌟", state.sf, "sf", 2),
    sectionHTML("Finale", "🏆", [state.fin], "fin", 1),
    sectionHTML("3e Place", "🥉", [state.trd], "trd", 1),
  ].join("");
}

render();
autoFillFromAPI();
