// Rebus puzzles. Answers stay on the server so players can't peek.
const f = (t, b) => `<span class="frac"><span>${t}</span><span>${b}</span></span>`;
const V = t => `<span class="vert">${[...t].map(c => `<i>${c}</i>`).join("")}</span>`;
const W = t => {
  const r = [-16, 11, -7, 18, -12];
  return `<span class="wob">${[...t].map((c, i) => `<i style="transform:rotate(${r[i % 5]}deg) translateY(${i % 2 ? .1 : -.1}em)">${c}</i>`).join("")}</span>`;
};
const s = (...x) => x.map(v => v.startsWith("<") ? v : `<span>${v}</span>`).join("");

// [id, level 1-3, html, answer, alternates]
// To add your own puzzle, copy a line, give it a new id, and restart the server.
const RAW = [
  [1, 1, s("GOOD", "GOOD", "2B", "TRUE"), "too good to be true", ["two good to be true"]],
  [2, 1, f("MIND", "MATTER"), "mind over matter"],
  [3, 1, s("DEATH", "LIFE"), "life after death"],
  [4, 1, s("CYCLE", "CYCLE", "CYCLE"), "tricycle", ["three cycles"]],
  [5, 1, s("B4"), "before"],
  [6, 1, s("XQQME"), "excuse me"],
  [7, 1, s("GO", "IT", "IT", "IT", "IT"), "go for it"],
  [8, 1, s("BAN", "ANA"), "banana split"],
  [9, 1, f("HEAD", "HEELS"), "head over heels"],
  [10, 1, s("TIME", "TIME"), "time after time"],
  [11, 1, s('<span class="box">SAND</span>'), "sandbox"],
  [12, 1, f("STAND", "I"), "i understand"],
  [13, 1, f("MAN", "BOARD"), "man overboard"],
  [14, 1, s("NOON", "GOOD"), "good afternoon"],
  [15, 1, s("SIDE", "SIDE"), "side by side"],
  [16, 1, s("ME", "REPEAT"), "repeat after me"],
  [17, 2, s("DICE", "DICE"), "paradise", ["pair of dice", "pair a dice"]],
  [18, 2, s("MILL1ON"), "one in a million"],
  [19, 2, s("HANHANDD"), "hand in hand"],
  [20, 2, s("JOB", "IN", "JOB"), "in between jobs", ["between jobs"]],
  [21, 2, s("YOU", "JUST", "ME"), "just between you and me", ["between you and me"]],
  [22, 2, s("HISTORY", "HISTORY"), "history repeats itself", ["history repeats"]],
  [23, 2, f("WEAR", "LONG"), "long underwear"],
  [24, 2, f("EGGS", "EASY"), "eggs over easy"],
  [25, 2, s("ECNALG"), "backward glance", ["backwards glance"]],
  [26, 2, s("LE", "VEL"), "split level"],
  [27, 2, s('<span class="tiny">WORLD</span>'), "small world", ["its a small world"]],
  [28, 2, s("HE'S", "HIMSELF"), "he's beside himself", ["beside himself"]],
  [29, 2, V("TOWN"), "downtown"],
  [30, 2, s("SGEG"), "scrambled eggs"],
  [31, 2, f("ONCE", "TIME"), "once upon a time"],
  [32, 2, W("SHAPE"), "out of shape"],
  [33, 2, s("PAWALKRK"), "walk in the park"],
  [34, 2, s("BJAOCXK"), "jack in the box"],
  [35, 2, s("YOUR", 'P<b class="hl">ANTS</b>'), "ants in your pants"],
  [36, 2, s("PROM", '<span class="tilt">ISE</span>'), "broken promise"],
  [37, 2, f("STOOD", "MISS"), "misunderstood"],
  [38, 2, s('<span class="lines">READING</span>'), "reading between the lines"],
  [39, 3, s("1T3456789"), "tea for two"],
  [40, 3, s("MOMANON"), "man in the moon"],
  [41, 3, s("SYMPHON"), "unfinished symphony"],
  [42, 3, s("TIM", "ING"), "split second timing", ["split second"]],
  [43, 3, f("WEATHER", "FEELING"), "feeling under the weather", ["under the weather"]],
  [44, 3, f("0", '<span class="sm">B.A.&nbsp; M.A.&nbsp; Ph.D.</span>'), "three degrees below zero"],
  [45, 3, f("GROUND", '<span class="feet">FEET FEET FEET<br>FEET FEET FEET</span>'), "six feet underground", ["six feet under"]],
  [46, 3, s("CCCCCCC"), "seven seas"],
  [47, 3, s("HIJKLMNO"), "water", ["h2o", "h to o"]],
  [48, 3, f("WORKED", "PAID"), "overworked and underpaid"],
  [49, 3, s("DOC", "DOC"), "paradox", ["pair of docs"]],
  [50, 3, s("EVERYRIGHTTHING"), "right in the middle of everything", ["in the middle of everything"]]
];

const PUZ = new Map(RAW.map(r => [r[0], { id: r[0], lv: r[1], h: r[2], a: r[3], alts: r[4] || [] }]));

// Forgiving answer check: ignores case, punctuation, "a/the/it's",
// treats to/too/two, for/four etc. as the same, and allows small typos.
const FILL = new Set(["a", "an", "the", "its", "it", "is", "s"]);
const HOMO = { to: "2", too: "2", two: "2", for: "4", four: "4", one: "1", won: "1", be: "b", you: "u", ate: "8", eight: "8" };
function norm(t) {
  return String(t).toLowerCase().replace(/&/g, " and ").replace(/['’`]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
    .split(" ").filter(w => w && !FILL.has(w)).map(w => HOMO[w] || w).join("");
}
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function isRight(guess, p) {
  const g = norm(guess);
  if (!g) return false;
  return [p.a, ...p.alts].some(ans => {
    const t = norm(ans);
    const tol = t.length >= 14 ? 2 : t.length >= 7 ? 1 : 0;
    return lev(g, t) <= tol;
  });
}

module.exports = { PUZ, isRight };
