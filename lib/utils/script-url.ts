/**
 * Builds the public URL for a script or experiment injection endpoint.
 */
export function buildScriptUrl(id: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return `${base}/p/${id}.js`
}

export function buildExperimentUrl(id: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return `${base}/e/${id}.js`
}
