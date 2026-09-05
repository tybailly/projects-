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

/**
 * Formats a TMDb "YYYY-MM-DD" date-only string as e.g. "December 25, 2026".
 * Parses the parts manually and builds a UTC-anchored Date rather than
 * `new Date(dateStr)` so the day never shifts based on the server's local
 * timezone (a bare calendar date has no time-of-day to convert).
 */
export function formatReleaseDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}
