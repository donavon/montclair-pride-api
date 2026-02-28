# 🏳️‍🌈 Montclair Pride API

A high-performance, edge-cached API gateway for **Montclair Pride 2026**. This service is built on **Cloudflare Workers** and serves as a high-speed middle layer between Google Sheets and the frontend application.

## 🚀 Key Features

- **Edge-First Caching**: Leverages Cloudflare's global network for sub-10ms response times.
- **Stale-While-Revalidate (SWR)**: Delivers instant responses from cache while triggering a background refresh to Google Sheets.
- **Smart ETag Negotiation**: Automatically handles `304 Not Modified` handshakes to save user bandwidth and battery.
- **Human-Readable Debugging**: Custom headers like `x-pride-data-age` show exactly how fresh your data is (e.g., `2m 14s`).
- **Type-Safe Transformation**: Automatically maps raw Google Sheet rows into clean, keyed JSON objects.

---

## 🛠️ Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.dev.vars` file in the root directory for local development secrets (this file is ignored by Git):

```env
GOOGLE_SHEET_ID="your_id"
GOOGLE_API_KEY="your_key"
ADMIN_KEY="your_secret_key"
```

### 3. Run locally

Start the local development server (Wrangler):

```bash
npm run dev
```

The API will be available at `http://localhost:8787`.

### 4. Deploy

Push your changes to the Cloudflare global network:

```bash
npm run deploy
```

---

## 📡 API Behavior

### Cache Strategy

- **Edge Cache**: Data is cached at the edge for 10 minutes (`s-maxage=600`).
- **SWR**: If the cache is older than 10 minutes, the user still gets the "stale" data instantly while the Worker updates the cache in the background.

### Manual Cache Refresh

To bypass the cache and force a fresh fetch from Google Sheets, append your admin key to the URL:
`https://api.montclairpride.org/?refresh=YOUR_ADMIN_KEY`

---

## 🔍 Headers & Debugging

Inspect the **Network Tab** to see the API's performance metadata:

| Header               | Example        | Description                                           |
| :------------------- | :------------- | :---------------------------------------------------- |
| `x-cache`            | `HIT` / `MISS` | Indicates if the response was served from the edge.   |
| `x-pride-data-age`   | `5m 20s`       | How long ago the data was fetched from Google.        |
| `ETag`               | `"hash123"`    | A unique fingerprint of the data for browser caching. |
| `X-Pride-Version-ID` | `5b12...`      | The specific deployment ID of the Worker.             |

---

## 📂 Project Structure

- `src/index.ts`: Entry point and request routing.
- `src/lib/with-cache.ts`: Caching wrapper and ETag comparison logic.
- `src/lib/response.ts`: Generic `JsonValue` helper for type-safe JSON generation.
- `src/lib/transformers.ts`: Logic to turn Google Sheet `string[][]` into usable JSON.
- `src/lib/utils.ts`: Helper functions (e.g., the time formatter for age headers).

---

### 🎨 The "Keen" Touch

This API includes an `x-pride` header. It is "Made with PRIDE by Keen."
