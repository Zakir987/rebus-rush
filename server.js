// Rebus Rush — multiplayer server
// Run:  npm install  &&  npm start     (then open http://localhost:3000)
const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { Server } = require("socket.io");
const { PUZ, isRight } = require("./puzzles");

const app = express();
app.get(["/", "/index.html"], (_req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/health", (_req, res) => res.send("ok"));
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 10000, pingTimeout: 8000 });

const MAX_PLAYERS = 80;
const REVEAL_MS = 8000;
const rooms = new Map();
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function newCode() {
  let c;
  do { c = ""; for (let i = 0; i < 4; i++) c += LETTERS[crypto.randomInt(LETTERS.length)]; } while (rooms.has(c));
  return c;
}
function pickOrder(n) {
  const all = [...PUZ.values()];
  for (let i = all.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [all[i], all[j]] = [all[j], all[i]]; }
  return all.slice(0, Math.min(n, all.length)).sort((a, b) => a.lv - b.lv).map(p => p.id);
}
const clampInt = (v, lo, hi, dflt) => { v = parseInt(v, 10); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : dflt; };

function freshState(R) {
  R.order = pickOrder(R.opts.n);
  R.S = { ph: "lobby", r: 0, n: R.order.length, p: 0, l: R.opts.d, d: R.opts.d, sv: {}, nx: 0 };
  R.endsAt = 0; R.revealAt = 0; R.allAt = 0;
}

function publicState(R) {
  const S = R.S, p = S.p ? PUZ.get(S.p) : null;
  return {
    code: R.code, ph: S.ph, r: S.r, n: S.n, l: S.l, d: S.d, nx: S.nx,
    puzzle: p ? { id: p.id, lv: p.lv, h: p.h } : null,
    ans: S.ph === "reveal" && p ? p.a : "",
    solved: S.sv,
    sc: [...R.players.values()].map(x => [x.key, x.name, x.score, x.sockets.size > 0]).sort((a, b) => b[2] - a[2]),
    hostOnline: R.hostSockets.size > 0
  };
}
function broadcast(R) { R.touched = Date.now(); io.to(R.code).emit("state", publicState(R)); }

// ---- game flow ----
function nextRound(R) {
  const S = R.S;
  if (S.r >= S.n) { S.ph = "end"; broadcast(R); return; }
  S.r++; S.p = R.order[S.r - 1]; S.ph = "play"; S.sv = {}; R.allAt = 0;
  R.endsAt = Date.now() + S.d * 1000; S.l = S.d;
  broadcast(R);
}
function reveal(R) { R.S.ph = "reveal"; R.revealAt = Date.now() + REVEAL_MS; R.S.nx = REVEAL_MS / 1000; broadcast(R); }
function onlineKeys(R) { return [...R.players.values()].filter(p => p.sockets.size > 0).map(p => p.key); }

setInterval(() => {
  const now = Date.now();
  for (const R of rooms.values()) {
    const S = R.S;
    if (S.ph === "play") {
      const l = Math.max(0, Math.ceil((R.endsAt - now) / 1000));
      if (l <= 0) { S.l = 0; reveal(R); continue; }
      const on = onlineKeys(R);
      if (on.length && on.every(k => S.sv[k] != null)) {
        if (!R.allAt) R.allAt = now + 1300;
        if (now >= R.allAt) { reveal(R); continue; }
      } else R.allAt = 0;
      if (l !== S.l) { S.l = l; broadcast(R); }
    } else if (S.ph === "reveal") {
      const nx = Math.max(0, Math.ceil((R.revealAt - now) / 1000));
      if (nx <= 0) { nextRound(R); continue; }
      if (nx !== S.nx) { S.nx = nx; broadcast(R); }
    }
  }
}, 200);

// Remove rooms nobody has touched for 3 hours
setInterval(() => {
  const cutoff = Date.now() - 3 * 3600 * 1000;
  for (const [c, R] of rooms) {
    const anyone = R.hostSockets.size || [...R.players.values()].some(p => p.sockets.size);
    if (!anyone && R.touched < cutoff) rooms.delete(c);
  }
}, 10 * 60 * 1000);

// ---- sockets ----
io.on("connection", socket => {
  const reply = (cb, v) => { if (typeof cb === "function") cb(v); };
  const myRoom = () => socket.data.code && rooms.get(socket.data.code);
  const isHost = () => { const R = myRoom(); return R && socket.data.role === "host" && R.hostSockets.has(socket.id) ? R : null; };

  function detach() {
    const R = myRoom(); if (!R) return;
    if (socket.data.role === "host") R.hostSockets.delete(socket.id);
    if (socket.data.role === "player") { const p = R.players.get(socket.data.key); if (p) p.sockets.delete(socket.id); }
    socket.leave(R.code);
    socket.data = {};
    broadcast(R);
  }

  socket.on("host:create", (opts, cb) => {
    detach();
    const code = newCode();
    const R = {
      code, token: crypto.randomBytes(16).toString("hex"),
      opts: { n: clampInt(opts && opts.n, 5, 50, 15), d: clampInt(opts && opts.d, 15, 120, 60) },
      players: new Map(), hostSockets: new Set([socket.id]), touched: Date.now()
    };
    freshState(R);
    rooms.set(code, R);
    socket.data = { code, role: "host" };
    socket.join(code);
    reply(cb, { code, token: R.token });
    broadcast(R);
  });

  socket.on("host:resume", (d, cb) => {
    const R = rooms.get(String(d && d.code || "").toUpperCase());
    if (!R || !d || d.token !== R.token) return reply(cb, { error: "That room has closed." });
    detach();
    R.hostSockets.add(socket.id);
    socket.data = { code: R.code, role: "host" };
    socket.join(R.code);
    reply(cb, { code: R.code });
    broadcast(R);
  });

  socket.on("player:join", (d, cb) => {
    const code = String(d && d.code || "").toUpperCase().trim();
    const R = rooms.get(code);
    if (!R) return reply(cb, { error: `No room with code ${code || "—"}. Check the code on the host's screen.` });
    let name = String(d.name || "").replace(/\s+/g, " ").trim().slice(0, 16);
    const key = String(d.key || "");
    if (!name) return reply(cb, { error: "Add your name first." });
    if (!/^[a-z0-9-]{6,40}$/.test(key)) return reply(cb, { error: "Please reload the page and try again." });
    let p = R.players.get(key);
    if (!p) {
      if (R.players.size >= MAX_PLAYERS) return reply(cb, { error: "This room is full." });
      const taken = new Set([...R.players.values()].map(x => x.name.toLowerCase()));
      if (taken.has(name.toLowerCase())) { let i = 2; while (taken.has(`${name} ${i}`.toLowerCase())) i++; name = `${name} ${i}`.slice(0, 18); }
      p = { key, name, score: 0, sockets: new Set(), lastGuess: 0 };
      R.players.set(key, p);
    }
    detach();
    p.sockets.add(socket.id);
    socket.data = { code, role: "player", key };
    socket.join(code);
    reply(cb, { code, name: p.name });
    broadcast(R);
  });

  socket.on("player:guess", (d, cb) => {
    const R = myRoom();
    if (!R || socket.data.role !== "player") return reply(cb, { error: "You're not in a room." });
    const S = R.S, p = R.players.get(socket.data.key);
    if (!p) return reply(cb, { error: "You're not in a room." });
    if (S.ph !== "play") return reply(cb, { error: "Wait for the next puzzle." });
    if (S.sv[p.key] != null) return reply(cb, { ok: true, pts: S.sv[p.key] });
    const now = Date.now();
    if (now - p.lastGuess < 350) return reply(cb, { error: "Slow down a little." });
    p.lastGuess = now;
    const text = String(d && d.text || "").slice(0, 80);
    if (isRight(text, PUZ.get(S.p))) {
      const rem = Math.max(0, (R.endsAt - now) / 1000);
      let pts = 500 + Math.round(500 * rem / S.d);
      const first = Object.keys(S.sv).length === 0;
      if (first) pts += 100;
      S.sv[p.key] = pts; p.score += pts;
      reply(cb, { ok: true, pts, first });
      broadcast(R);
    } else reply(cb, { ok: false });
  });

  socket.on("host:start", () => { const R = isHost(); if (R && R.S.ph === "lobby") nextRound(R); });
  socket.on("host:reveal", () => { const R = isHost(); if (R && R.S.ph === "play") reveal(R); });
  socket.on("host:next", () => { const R = isHost(); if (R && R.S.ph === "reveal") nextRound(R); });
  socket.on("host:end", () => { const R = isHost(); if (R && R.S.ph !== "end") { R.S.ph = "end"; broadcast(R); } });
  socket.on("host:again", () => {
    const R = isHost(); if (!R) return;
    for (const p of R.players.values()) p.score = 0;
    for (const [k, p] of R.players) if (!p.sockets.size) R.players.delete(k);
    freshState(R); broadcast(R);
  });
  socket.on("host:kick", key => {
    const R = isHost(); if (!R) return;
    const p = R.players.get(String(key)); if (!p) return;
    for (const id of p.sockets) { const s = io.sockets.sockets.get(id); if (s) { s.emit("kicked"); s.leave(R.code); s.data = {}; } }
    R.players.delete(p.key); broadcast(R);
  });
  socket.on("host:close", () => {
    const R = isHost(); if (!R) return;
    io.to(R.code).emit("closed");
    for (const id of [...(io.sockets.adapter.rooms.get(R.code) || [])]) { const s = io.sockets.sockets.get(id); if (s) { s.leave(R.code); s.data = {}; } }
    rooms.delete(R.code);
  });
  socket.on("leave", detach);
  socket.on("disconnect", detach);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Rebus Rush running on http://localhost:${PORT}`));
