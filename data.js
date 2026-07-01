// ─── DONNÉES OFFICIELLES FIFA — Coupe du Monde 2026 ───
// Drapeaux : images flagcdn.com (s'affichent partout, PC et mobile)
// Heures converties ET → GMT (+4h, heure d'été US) — sources CBS News / Yahoo Sports

const F = (code) => `https://flagcdn.com/w40/${code}.png`;

const R32 = [
  { fifa:"M73", day:"Dim 28 juin", time:"19:00", a:{flag:F("za"),name:"Afrique du Sud"}, b:{flag:F("ca"),name:"Canada"} },
  { fifa:"M76", day:"Lun 29 juin", time:"17:00", a:{flag:F("br"),name:"Brésil"},          b:{flag:F("jp"),name:"Japon"} },
  { fifa:"M74", day:"Lun 29 juin", time:"20:30", a:{flag:F("de"),name:"Allemagne"},       b:{flag:F("py"),name:"Paraguay"} },
  { fifa:"M75", day:"Mar 30 juin", time:"06:00", a:{flag:F("nl"),name:"Pays-Bas"},        b:{flag:F("ma"),name:"Maroc"} },
  { fifa:"M78", day:"Mar 30 juin", time:"17:00", a:{flag:F("ci"),name:"Côte d'Ivoire"},   b:{flag:F("no"),name:"Norvège"} },
  { fifa:"M77", day:"Mar 30 juin", time:"21:00", a:{flag:F("fr"),name:"France"},          b:{flag:F("se"),name:"Suède"} },
  { fifa:"M79", day:"Mer 1 juil.", time:"01:00", a:{flag:F("mx"),name:"Mexique"},         b:{flag:F("ec"),name:"Équateur"} },
  { fifa:"M80", day:"Mer 1 juil.", time:"16:00", a:{flag:F("gb-eng"),name:"Angleterre"},  b:{flag:F("cd"),name:"RD Congo"} },
  { fifa:"M82", day:"Mer 1 juil.", time:"20:00", a:{flag:F("be"),name:"Belgique"},        b:{flag:F("sn"),name:"Sénégal"} },
  { fifa:"M81", day:"Jeu 2 juil.", time:"00:00", a:{flag:F("us"),name:"États-Unis"},      b:{flag:F("ba"),name:"Bosnie-Herz."} },
  { fifa:"M84", day:"Jeu 2 juil.", time:"19:00", a:{flag:F("es"),name:"Espagne"},         b:{flag:F("at"),name:"Autriche"} },
  { fifa:"M83", day:"Jeu 2 juil.", time:"23:00", a:{flag:F("pt"),name:"Portugal"},        b:{flag:F("hr"),name:"Croatie"} },
  { fifa:"M85", day:"Ven 3 juil.", time:"03:00", a:{flag:F("ch"),name:"Suisse"},          b:{flag:F("dz"),name:"Algérie"} },
  { fifa:"M88", day:"Ven 3 juil.", time:"18:00", a:{flag:F("au"),name:"Australie"},       b:{flag:F("eg"),name:"Égypte"} },
  { fifa:"M86", day:"Ven 3 juil.", time:"22:00", a:{flag:F("ar"),name:"Argentine"},       b:{flag:F("cv"),name:"Cap-Vert"} },
  { fifa:"M87", day:"Sam 4 juil.", time:"01:30", a:{flag:F("co"),name:"Colombie"},        b:{flag:F("gh"),name:"Ghana"} },
];

// 8es — liaisons FIFA officielles
// M90 = W(M73) vs W(M75) → idx[0] vs idx[3]
// M89 = W(M74) vs W(M77) → idx[2] vs idx[5]
// M91 = W(M76) vs W(M78) → idx[1] vs idx[4]  ← Brésil croise CIV
// M92 = W(M79) vs W(M80) → idx[6] vs idx[7]
// M93 = W(M83) vs W(M84) → idx[11] vs idx[10]
// M94 = W(M81) vs W(M82) → idx[9] vs idx[8]
// M95 = W(M86) vs W(M88) → idx[14] vs idx[13]
// M96 = W(M85) vs W(M87) → idx[12] vs idx[15]
const R16_PAIRS = [
  { fifa:"M90", day:"Sam 4 juil.", time:"17:00", src:[0,3]   },
  { fifa:"M89", day:"Sam 4 juil.", time:"21:00", src:[2,5]   },
  { fifa:"M91", day:"Dim 5 juil.", time:"20:00", src:[1,4]   },
  { fifa:"M92", day:"Lun 6 juil.", time:"00:00", src:[6,7]   },
  { fifa:"M93", day:"Lun 6 juil.", time:"19:00", src:[11,10] },
  { fifa:"M94", day:"Mar 7 juil.", time:"00:00", src:[9,8]   },
  { fifa:"M95", day:"Mar 7 juil.", time:"16:00", src:[14,13] },
  { fifa:"M96", day:"Mar 7 juil.", time:"20:00", src:[12,15] },
];

// QF — M97=W89vsW90, M98=W93vsW94, M99=W91vsW92, M100=W95vsW96
const QF_PAIRS = [
  { fifa:"M97",  day:"Jeu 9 juil.",  time:"20:00", src:[0,1] },
  { fifa:"M98",  day:"Ven 10 juil.", time:"19:00", src:[4,5] },
  { fifa:"M99",  day:"Sam 11 juil.", time:"21:00", src:[2,3] },
  { fifa:"M100", day:"Dim 12 juil.", time:"01:00", src:[6,7] },
];

// SF — M101=W97vsW98, M102=W99vsW100
const SF_PAIRS = [
  { fifa:"M101", day:"Mar 14 juil.", time:"19:00", src:[0,1] },
  { fifa:"M102", day:"Mer 15 juil.", time:"19:00", src:[2,3] },
];

const FINALE    = { fifa:"M104", day:"Dim 19 juil.", time:"19:00" };
const TROISIEME = { fifa:"M103", day:"Sam 18 juil.", time:"21:00" };
