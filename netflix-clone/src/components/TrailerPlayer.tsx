import Link from "next/link";

export function TrailerPlayer({ titleId, trailerKey, title }: { titleId: string; trailerKey: string; title: string }) {
  return (
    <div className="relative h-full w-full">
      <Link href={`/title/${titleId}`} className="absolute left-6 top-6 z-10 text-2xl text-white hover:text-neutral-300">
        ← {title}
      </Link>
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
        title={`${title} — Trailer`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
