import Link from "next/link";

export interface ProviderTileData {
  slug: string;
  name: string;
  brandColor: string;
}

export function ProviderTile({ provider }: { provider: ProviderTileData }) {
  return (
    <Link
      href={`/providers/${provider.slug}`}
      className="flex h-24 w-44 flex-shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white transition-transform hover:scale-105 sm:h-28 sm:w-56"
      style={{ backgroundColor: provider.brandColor }}
    >
      {provider.name}
    </Link>
  );
}
