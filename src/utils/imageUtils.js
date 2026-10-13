/**
 * imageUtils.js
 * Centralised image URL resolution and cleaning for Heritage Explorer.
 *
 * Strategy (in priority order):
 *  1. Convert Wikimedia thumbnail URL to direct upload URL (removes thumb resize path)
 *  2. Strip all UTM/tracking query parameters
 *  3. Ensure HTTPS
 */

import { API_BASE_URL } from '../config/api';

/**
 * Convert a Wikimedia Commons thumbnail URL to the direct (full-res) upload URL.
 * Handles:
 *   https://thumb.wikimedia.org/wikipedia/commons/thumb/X/YY/File.jpg/330px-File.jpg
 *   https://thumb.wikimedia.org/wikipedia/commons/thumb/X/YY/File.svg/330px-File.svg.png
 *
 * Returns clean https://upload.wikimedia.org/... URL, or null if not a Wikimedia thumb.
 */
export function wikiThumbToUpload(url) {
  if (!url || typeof url !== 'string') return null;
  // Match both thumb.wikimedia.org and upload.wikimedia.org with /thumb/ and optional dimension suffix
  const thumbMatch = url.match(
    /(?:thumb|upload)\.wikimedia\.org\/(wikipedia\/[^/]+\/)thumb\/([^/]+\/[^/]+\/)([^/?#]+)(?:\/[^/?#]+)?/
  );
  if (!thumbMatch) return null;
  return `https://upload.wikimedia.org/${thumbMatch[1]}${thumbMatch[2]}${thumbMatch[3]}`;
}

/**
 * Normalise any image URL:
 * 1. Wikimedia thumb -> direct upload URL
 * 2. Strip UTM/tracking params
 * 3. Force HTTPS
 */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let result = url.trim();

  // 1. Convert Wikimedia thumb to direct upload URL
  const uploadUrl = wikiThumbToUpload(result);
  if (uploadUrl) {
    result = uploadUrl;
  }

  // 2. Strip UTM and tracking query parameters
  try {
    const parsed = new URL(result);
    ['utm_source', 'utm_campaign', 'utm_content', 'utm_medium', 'utm_term'].forEach(
      k => parsed.searchParams.delete(k)
    );
    result = parsed.toString();
    // Remove trailing '?' if no params remain
    if (result.endsWith('?')) result = result.slice(0, -1);
  } catch {
    // Non-parseable URL – leave as-is
  }

  // 3. Force HTTPS
  if (result.startsWith('http://')) {
    result = 'https://' + result.slice(7);
  }

  return result || null;
}

/**
 * Build the backend proxy URL for a given image URL.
 * Used as a reliable fallback when direct Wikimedia URL fails in the app.
 */
export function buildProxyUrl(imageUrl) {
  if (!imageUrl) return null;
  const baseWithoutApi = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${baseWithoutApi}/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Returns the best resolved image URI for a site record.
 */
export function resolveSiteImageUrl(site) {
  const raw =
    site?.image_url || site?.image || site?.imageUrl || site?.images?.[0];
  return normalizeImageUrl(raw);
}
