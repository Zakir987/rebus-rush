# Rebus Rush

A live multiplayer rebus word-puzzle game. The host puts the game on a big screen, and players join from their own laptops or phones using a 4-letter room code or an invite link. Each puzzle stays up for 60 seconds, and faster correct answers score more points.

- 50 rebus puzzles (Easy, Medium, Tricky). Answers stay on the server, so players can't peek.
- Spelling is forgiving: capitals, punctuation, "a/the" and small typos are all accepted.
- The invite link and QR code fill in the room code automatically.
- If a player reloads or loses Wi-Fi, they rejoin and keep their score.

## Put it on GitHub (no coding needed)

1. Sign in at https://github.com and click **New repository**. Name it `rebus-rush` and make it **Public**. Click **Create repository**.
2. On the new page, click **uploading an existing file**.
3. Unzip `rebus-rush.zip`. Drag everything inside the folder into the upload box: `index.html`, `server.js`, `puzzles.js`, `package.json`, `render.yaml` and `README.md`.
4. Click **Commit changes**.

## Put it online for free (Render)

1. Go to https://render.com and sign up with your GitHub account.
2. Click **New +** and choose **Blueprint**. Pick your `rebus-rush` repository, then click **Apply**. Render reads `render.yaml` and sets everything up.
3. Wait about 2 to 3 minutes. You'll get a link like `https://rebus-rush-xxxx.onrender.com`.
4. Open that link, click **Create room**, and share the invite link or code with your players.

On Render's free plan, the site sleeps after 15 minutes with no visitors. The first visit after that takes about 30 to 50 seconds to wake it up, so open it a minute before your session starts.

## Run it on your own computer

You need Node.js 18 or newer from https://nodejs.org.

```
npm install
npm start
```

Then open http://localhost:3000. Players on the same Wi-Fi can join at `http://YOUR-COMPUTER-IP:3000`.

## Add your own puzzles

Open `puzzles.js` and copy any line in the list, giving it a new number:

```js
[51, 2, s("WORD", "WORD"), "the answer", ["another accepted answer"]],
```

- `s("A","B")` shows words side by side.
- `f("TOP","BOTTOM")` puts one word over another.
- `V("WORD")` writes a word vertically.
- The level is 1 = Easy, 2 = Medium, 3 = Tricky.

Commit the change on GitHub, and Render redeploys automatically.
