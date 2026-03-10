/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Iframe embedding (e.g. Shopify) is allowed via middleware, which sets
   * Content-Security-Policy frame-ancestors from FRAME_ANCESTORS_URLS at runtime.
   */
};

module.exports = nextConfig;
