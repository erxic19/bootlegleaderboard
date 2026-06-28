# bootlegleaderboard

GitHub Pages frontend for the Bootleg Juice & Co. iExpo leaderboard.

## Cloudflare Worker

The frontend reads scores through the Cloudflare Worker in `worker.js`, so the
SilentWolf API key does not have to be committed to this public repo.

Set these Worker environment variables in Cloudflare:

- `SW_API_KEY`: current SilentWolf API key
- `SW_GAME_ID`: SilentWolf game ID

Endpoint:

- `GET /scores?max=15&ldboard_name=main`

Score submission stays in the game. This Worker is read-only.
