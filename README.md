# bootlegleaderboard

GitHub Pages frontend for the Bootleg Juice & Co. iExpo leaderboard.

## Cloudflare Worker

The frontend reads scores through the Cloudflare Worker in `worker.js`, so the
SilentWolf API key does not have to be committed to this public repo.

Set these Worker environment variables in Cloudflare:

- `SW_API_KEY`: current SilentWolf API key
- `SW_GAME_ID`: SilentWolf game ID

Endpoints:

- `GET /scores?max=15&ldboard_name=main`
- `POST /scores`

Example score submit body:

```json
{
  "player_name": "Ada",
  "score": 1234,
  "ldboard_name": "main",
  "metadata": {
    "time": 92
  }
}
```
