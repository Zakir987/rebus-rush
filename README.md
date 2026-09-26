# Rebus Rush

A live multiplayer rebus word-puzzle game. The host puts the game on a big screen, and players join from their own laptops or phones with a 4-letter room code or an invite link. Each puzzle stays up for 60 seconds, and faster correct answers score more points.

## Play

**https://zakir987.github.io/rebus-rush/**

1. The host opens the link and clicks **Create room**.
2. The screen shows a room code, an invite link and a QR code.
3. Players open the invite link (or the main link and type the code), enter their name, and join.
4. The host clicks **Start game**.

The host's browser runs the game and players connect to it directly, so no server or sign-up is needed. **The host must keep their tab open** for the whole game.

## Features

- 50 rebus puzzles (Easy, Medium, Tricky), picked at random and ordered from easy to hard.
- Spelling is forgiving: capitals, punctuation, "a/the" and small typos are all accepted.
- Points: 500 for a correct answer, plus up to 500 more for speed, plus 100 for the first to solve.
- If a player reloads or loses Wi-Fi, they rejoin automatically and keep their score.
- The host can remove players, reveal answers early, skip ahead, end the game, and play again.

## Add your own puzzles

Open `index.html`, find the list that starts with `const RAW=[`, and copy any line, giving it a new number:

```js
[51,2,s("WORD","WORD"),"the answer",["another accepted answer"]],
```

- `s("A","B")` shows words side by side.
- `f("TOP","BOTTOM")` puts one word over another.
- `V("WORD")` writes a word vertically.
- The level is 1 = Easy, 2 = Medium, 3 = Tricky.

Commit the change and the live site updates within a minute or two.

## If a player can't connect

The game uses a direct browser-to-browser connection. It works on almost all home and mobile networks. Some strict office or college networks block it. If one player can't join, have them switch to a phone hotspot.

## Other files

The whole game is in `index.html`. `server.js`, `puzzles.js`, `package.json` and `render.yaml` are optional: they let you serve the same page from your own Node.js server (`npm install`, then `npm start`) instead of GitHub Pages.
