/**
 * Extract the requesting origin from a Request's headers.
 * For <script src> loads the browser sends Referer but not Origin.
 */
export function getRequestOrigin(req: Request): string | null {
  const origin = req.headers.get('origin')
  if (origin) return origin

  const referer = req.headers.get('referer')
  if (referer) {
    try {
      const url = new URL(referer)
      return `${url.protocol}//${url.host}`
    } catch {
      return null
    }
  }

  return null
}

/**
 * Check if a requesting origin matches the allowlist.
 * Supported patterns:
 *   *                      → allow all
 *   https://example.com    → exact origin
 *   example.com            → shorthand for https://example.com
 *   *.example.com          → any subdomain of example.com
 */
export function isOriginAllowed(requestOrigin: string, allowed: string[]): boolean {
  if (allowed.includes('*')) return true

  return allowed.some((pattern) => {
    if (pattern === '*') return true

    // Wildcard subdomain: *.example.com
    if (pattern.startsWith('*.')) {
      const base = pattern.slice(2)
      try {
        const reqHost = new URL(requestOrigin).host
        return reqHost === base || reqHost.endsWith(`.${base}`)
      } catch {
        return false
      }
    }

    // Exact match — normalise shorthand domains to https://
    const normalized = pattern.includes('://') ? pattern : `https://${pattern}`
    return (
      requestOrigin === normalized ||
      requestOrigin === normalized.replace('https://', 'http://')
    )
  })
}

/**
 * Build the Access-Control-Allow-Origin header value for a response.
 * Returns '*' if allowed_origins includes '*', otherwise returns the
 * requesting origin if it's in the list, or null if denied.
 */
export function resolveCorOrigin(
  requestOrigin: string | null,
  allowed: string[]
): string | null {
  if (allowed.includes('*')) return '*'
  if (!requestOrigin) return null
  return isOriginAllowed(requestOrigin, allowed) ? requestOrigin : null
}
