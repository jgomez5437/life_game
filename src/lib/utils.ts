// src/lib/utils.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared utility functions — TypeScript port of public/utils.js
// These are PURE FUNCTIONS with no side effects. Testable without any DOM or game state.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a number as a USD currency string.
 * Replaces: `Utils.formatMoney(num)` from utils.js
 *
 * @example formatMoney(55000) → "$55,000"
 * @example formatMoney(-24000) → "-$24,000"
 */
export function formatMoney(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Returns a random integer between min and max (inclusive).
 * Replaces: `Utils.getRandomInt(min, max)` from utils.js
 */
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns the 2-letter ISO country code for a given city name.
 * Replaces: `Utils.getCountryCode(city)` from utils.js
 *
 * Why `string | null` return type:
 *   - The old JS returned `null` for unknown cities but typed it as nothing.
 *   - Now callers MUST handle the null case: `const code = getCountryCode(city) ?? 'us'`
 */
export function getCountryCode(city: string): string | null {
  if (!city) return null;

  const CITY_CODES: Record<string, string> = {
    'New York': 'us',
    'Los Angeles': 'us',
    'San Francisco': 'us',
    Miami: 'us',
    Tucson: 'us',
    Chicago: 'us',
    Houston: 'us',
    London: 'gb',
    Manchester: 'gb',
    Tokyo: 'jp',
    Osaka: 'jp',
    Paris: 'fr',
    Berlin: 'de',
    Madrid: 'es',
    Rome: 'it',
    'Bandar Seri Begawan': 'bn',
    Beijing: 'cn',
    Shanghai: 'cn',
    Seoul: 'kr',
    Sydney: 'au',
    Toronto: 'ca',
    'Rio de Janeiro': 'br',
    Mumbai: 'in',
    'Mexico City': 'mx',
    Cairo: 'eg',
  };

  const foundKey = Object.keys(CITY_CODES).find(
    (k) => k.toLowerCase() === city.trim().toLowerCase()
  );

  return foundKey ? CITY_CODES[foundKey] : null;
}

/**
 * Clamps a number between min and max.
 * Useful for keeping health (0–100), bond (0–100), etc. in range.
 *
 * @example clamp(105, 0, 100) → 100
 * @example clamp(-5, 0, 100)  → 0
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
