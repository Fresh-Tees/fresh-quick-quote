# Deploy the gateway and surface it on Shopify

The app is a standalone Next.js site. It does not run inside Shopify’s servers—you deploy it (e.g. to Vercel), then link or iframe that URL from your storefront.

## 1. Deploy to Vercel

1. Push this repo to GitHub (or use Vercel CLI: `vercel` from the project root).
2. In [Vercel](https://vercel.com) → **Add New Project** → import the repo. Next.js is auto-detected.
3. **Environment variables** (Project → Settings → Environment Variables). Add all of these for **Production** (and Preview if you use preview deploys):

   | Variable | Notes |
   |----------|--------|
   | `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for artwork uploads (preferred) |
   | `FRESHBLOB_READ_WRITE_TOKEN` | Optional alias if your project uses a different name |
   | `QUOTE_NOTIFY_EMAIL` | Inbox that receives quote emails |
   | `SMTP_HOST` | e.g. `smtp.elasticemail.com` |
   | `SMTP_PORT` | e.g. `2525` or `587` |
   | `SMTP_USER` | SMTP username |
   | `SMTP_PASS` | SMTP password |
   | `SMTP_FROM` | e.g. `FRESH <info@freshtees.com.au>` |
   | `FRAME_ANCESTORS_URLS` | **Only if using iframe**—see below |

4. **Redeploy** after saving env vars so the build/runtime picks them up.
5. **Custom domain** (optional): Project → Settings → Domains → add e.g. `quote.freshtees.com.au` and follow DNS instructions.

After deploy, note the production URL (e.g. `https://your-project.vercel.app` or your custom domain). That is the **gateway URL** you’ll use in Shopify.

### FRAME_ANCESTORS_URLS (iframe only)

If you embed the gateway in an iframe on Shopify, the browser needs your app to allow that origin. Set:

```text
FRAME_ANCESTORS_URLS=https://your-store.myshopify.com,https://www.your-custom-domain.com
```

Use your real storefront domain(s)—comma-separated, no spaces (or trim is applied). Redeploy after changing.

---

## 2. Surface on Shopify

### Option A: Navigation link (simplest)

1. Shopify Admin → **Online Store** → **Navigation**.
2. Edit the menu where you want “Get a quote” (e.g. Main menu).
3. **Add menu item** → Link: paste your **gateway URL** (open in new tab if your theme supports it, or users stay on your site by default).

### Option B: Page with button

1. **Online Store** → **Pages** → **Add page** (e.g. title “Bulk quote”).
2. In the page body, add a button or link HTML pointing to the gateway URL, or use your theme’s button block with external URL.

### Option C: Iframe embed (stays on your domain)

1. **Online Store** → **Themes** → **Customize**.
2. Open the page where you want the wizard (or create a **page** and assign a template that includes custom content).
3. Add a **Custom Liquid** block (OS 2.0) or edit a template that allows custom HTML/Liquid.
4. Paste this snippet (**keep the quotes around `src`**—without them the iframe may not load):

```liquid
<div class="page-width" style="max-width: 100%;">
  <iframe
    src="https://freshtees-gateway-visualiser.vercel.app"
    title="Get a quote"
    style="width: 100%; min-height: 85vh; border: 0;"
    loading="lazy"
  ></iframe>
</div>
```

5. **Required for iframe to work:** In Vercel → Project → Settings → Environment Variables, set **FRAME_ANCESTORS_URLS** for Production to your Shopify origin(s), e.g.:
   ```text
   https://your-store.myshopify.com,https://www.freshtees.com.au
   ```
   Then **Redeploy** the project. Without this, the iframe will be blank or "refused to connect".

If the iframe is still blank or blocked:

- **Check the exact origin:** When you view the Shopify page that has the iframe, look at the browser address bar. The origin must match exactly (e.g. `https://your-store.myshopify.com` or `https://www.freshtees.com.au`). Add every origin you use (with and without `www`) to **FRAME_ANCESTORS_URLS**, comma-separated.
- **Confirm the header:** After redeploying, open the gateway URL in a new tab → DevTools → Network → reload → click the document request → Response Headers. You should see `Content-Security-Policy: frame-ancestors 'self' https://...`. If you only see `frame-ancestors 'self'`, the env var wasn’t applied (check spelling, environment = Production, then redeploy).
- Check the browser console for CSP/frame errors and that the gateway URL uses **https**.

---

## 3. Optional: UTM tracking

Append query params when linking from Shopify so you can track traffic:

```text
https://your-gateway-url/?utm_source=shopify&utm_medium=nav
```

---

## Summary checklist

- [ ] Vercel project created, env vars set, production URL known
- [ ] Custom domain configured (optional)
- [ ] Shopify nav or page links to gateway URL
- [ ] If iframe: `FRAME_ANCESTORS_URLS` set + iframe snippet added + redeploy

No Shopify app or theme app extension is required for this setup.
