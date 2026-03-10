/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Allow the app to be embedded in an iframe from Shopify (or other origins).
   * Set FRAME_ANCESTORS_URLS in Vercel to a comma-separated list of origins, e.g.:
   *   https://your-store.myshopify.com,https://www.yourdomain.com
   * If unset, only 'self' is allowed (no cross-origin iframe).
   */
  async headers() {
    const extra =
      process.env.FRAME_ANCESTORS_URLS?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
    const ancestors = ["'self'", ...extra].join(" ");
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${ancestors}`,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
