/**
 * TMDb's "upcoming" endpoint occasionally includes older films with a new
 * theatrical re-release date (e.g. an anniversary re-release) rather than a
 * genuinely new movie. The only signal we have for this is the movie's
 * original release year predating the current year — computed against
 * today's date rather than a hardcoded year so this stays correct over time.
 */
export function isRerelease(releaseYear: number | null): boolean {
  if (releaseYear == null) return false;
  return releaseYear < new Date().getFullYear();
}
