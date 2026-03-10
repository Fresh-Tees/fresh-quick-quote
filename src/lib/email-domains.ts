/**
 * Domains we treat as free/personal email (no indicative pricing shown).
 * Professional/business domains are any other domain.
 */
export const BLOCKED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "live.com.au",
  "msn.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.com.au",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "mail.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "inbox.com",
  "ymail.com",
  "bigpond.com",
  "optusnet.com.au",
  "outlook.com.au",
]);

/**
 * Returns true if the email's domain is in the free-email blocklist.
 * Use to gate indicative pricing (blocked = free email = we'll call you).
 */
export function isBlockedEmailDomain(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf("@");
  if (at === -1) return false;
  const domain = normalized.slice(at + 1);
  return BLOCKED_EMAIL_DOMAINS.has(domain);
}
