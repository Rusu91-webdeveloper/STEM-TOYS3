import Image from "next/image";

/** Editorial illustration of hands-on STEM play, not a specific product offer. */
export function BrandScene() {
  return (
    <figure className="relative m-0 overflow-hidden rounded-[1.75rem] bg-[#e7e4dc]">
      <div className="relative aspect-[3/2] lg:aspect-[6/5]">
        <Image
          src="/images/home/stem-play-hero.webp"
          alt="Doi copii construiesc împreună un castel din piese geometrice colorate"
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 720px"
          className="object-cover object-center"
        />
      </div>
      <figcaption className="flex items-center justify-between gap-4 bg-[#eae8df] px-5 py-4 text-xs text-[#30483f] sm:px-6">
        <span className="font-semibold">Construiesc. Descoperă. Reușesc.</span>
        <span className="text-right text-[10px] text-[#596960]">Imagine de inspirație</span>
      </figcaption>
    </figure>
  );
}
