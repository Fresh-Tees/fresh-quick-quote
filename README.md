# Freshtees Customer Gateway

A short qualification flow that routes visitors by outcome: small orders go to your design tool; bulk orders are qualified then shown education, indicative pricing, or a call booking.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

Edit **src/config/flow.json** to set your design tool URL, Calendly link, privacy policy URL, questions, and routing rules.

### Artwork uploads (optional)

To enable “Upload artwork” in the configurator and store files in [Vercel Blob](https://vercel.com/docs/storage/vercel-blob):

1. Copy `.env.example` to `.env.local`.
2. Create a Blob store in the Vercel dashboard and set `BLOB_READ_WRITE_TOKEN` in `.env.local`.

Without this token, the upload API returns 503 and the UI will show an error when a user tries to upload.

## Deploy and Shopify

To run the gateway on your Shopify site: deploy to Vercel (or similar), then link or iframe the deployed URL from your theme. See **[docs/DEPLOY-SHOPIFY.md](docs/DEPLOY-SHOPIFY.md)** for step-by-step env vars, custom domain, and Shopify nav/iframe snippets.

For iframe embeds, set `FRAME_ANCESTORS_URLS` in production (see `.env.example`) so the app can be framed by your storefront.
