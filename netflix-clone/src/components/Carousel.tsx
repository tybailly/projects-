import { TitleCard, type TitleCardData } from "@/components/TitleCard";

export function Carousel({ heading, titles }: { heading: string; titles: TitleCardData[] }) {
  if (titles.length === 0) return null;

  return (
    <section className="mb-8 px-6 sm:px-12">
      <h2 className="mb-3 text-lg font-semibold text-white sm:text-xl">{heading}</h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-4">
        {titles.map((title) => (
          <TitleCard key={title.id} title={title} />
        ))}
      </div>
    </section>
  );
}
