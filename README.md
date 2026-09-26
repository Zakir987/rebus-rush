# Rebus Rush

A live multiplayer rebus word-puzzle game. The host puts the game on a big screen, and players join from their own laptops or phones with a 4-letter room code or an invite link. Each puzzle stays up for 60 seconds, and faster correct answers score more points.

## Play

**https://zakir987.github.io/rebus-rush/**

1. The host opens the link, types their name (to play too), and clicks **Create room**.
2. The host clicks **Copy invite link** or **Share on WhatsApp** and sends it to friends.
3. Friends tap the link, type their name, and press **Join**. The room code is filled in for them.
4. The host clicks **Start game**.

The host's browser runs the game, and everyone connects through free public relay servers, so no sign-up is needed. **The host must keep their tab open** for the whole game.

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

The host connects to three public relay servers at once, and each player uses whichever one their network allows, so it works on almost every home, mobile and office network. If someone still can't join, make sure the host's tab is open, check the 4-letter code, and try a phone hotspot.

## Other files

The whole game is in `index.html`. `server.js`, `puzzles.js`, `package.json` and `render.yaml` are optional: they let you serve the same page from your own Node.js server (`npm install`, then `npm start`) instead of GitHub Pages.
