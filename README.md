# Montclair Pride API

This is a minimal TypeScript + Netlify Functions starter that gives you all the plumbing
to run a Node-based function

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Login to Netlify (if you have not already):

   ```bash
   npx netlify-cli login
   ```

3. Initialize the site (once):

   ```bash
   npx netlify-cli init
   ```

   - Choose "Create & configure a new site" (or link an existing one).
   - Build command: `npm run build` (or leave blank if you just want type checking).
   - Publish directory: `public`.

4. Run locally:

   ```bash
   npm run dev
   ```

   Netlify Dev will start a server (usually at http://localhost:8888).

   Try:
   - http://localhost:8888/
   - http://localhost:8888/events

5. Deploy:

   ```bash
   npm run deploy          # draft deploy
   npm run deploy:prod     # production deploy
   ```

## Where to put your events logic

The function lives at:

- `netlify/functions/events/events.ts`

Right now it just echoes back some JSON but will eventually
hit AirTable or Google sheets.

- Return a `Response` with the JSON and appropriate headers.
