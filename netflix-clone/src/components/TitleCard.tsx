import Image from "next/image";
import Link from "next/link";

export interface TitleCardData {
  id: string;
  name: string;
  posterUrl: string | null;
  badge?: string;
}

export function TitleCard({ title }: { title: TitleCardData }) {
  return (
    <Link
      href={`/title/${title.id}`}
      className="group relative block w-40 flex-shrink-0 overflow-hidden rounded transition-transform duration-200 hover:z-10 hover:scale-110 sm:w-48"
    >
      <div className="relative aspect-[2/3] w-full bg-neutral-800">
        {title.posterUrl && (
          <Image
            src={title.posterUrl}
            alt={title.name}
            fill
            sizes="200px"
            className="object-cover"
          />
        )}
        {title.badge && (
          <span className="absolute left-1 top-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {title.badge}
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-xs font-medium text-white">{title.name}</p>
      </div>
    </Link>
  );
}
