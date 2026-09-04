interface DeepLinkable {
  searchUrlTemplate: string;
}

/**
 * Builds a deep link out to a streaming service's own search results for a
 * title. There is no public API that returns a direct per-title watch URL
 * for these services, so linking to their search page is the most reliable
 * way to get the user to the right place without embedding their content.
 */
export function buildProviderDeepLink(provider: DeepLinkable, titleName: string): string {
  return provider.searchUrlTemplate.replace("{query}", encodeURIComponent(titleName));
}

interface PlayableTitle {
  id: string;
  name: string;
  source: "UPLOAD" | "PROVIDER";
  provider: { name: string; searchUrlTemplate: string } | null;
}

/**
 * Where the "Play" action for a title should go: an UPLOAD title plays in
 * this app's own hls.js player; a PROVIDER title deep-links out to that
 * service, since its video is never hosted here.
 */
export function getPlayAction(title: PlayableTitle): { href: string; label: string; external: boolean } {
  if (title.source === "PROVIDER" && title.provider) {
    return {
      href: buildProviderDeepLink(title.provider, title.name),
      label: `Open in ${title.provider.name}`,
      external: true
    };
  }
  return { href: `/watch/${title.id}`, label: "▶ Play", external: false };
}
