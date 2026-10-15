import Image from "next/image";

const TONES = ["#DFE2EC", "#D7DBE8", "#E4E6EE", "#D3D7E5", "#DCDFEA", "#D9DCE8"];

function toneFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export default function Portrait({
  id,
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px",
  priority = false,
  grayscale = false,
}: {
  id: string;
  src: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  grayscale?: boolean;
}) {
  return (
    <span className="absolute inset-0 block" style={{ background: toneFor(id) }}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={70}
          className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${grayscale ? "grayscale" : ""}`}
        />
      ) : (
        <svg aria-hidden="true" viewBox="0 0 200 250" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 size-full">
          <circle cx="100" cy="98" r="38" fill="#fff" fillOpacity="0.45" />
          <path d="M28 250c4-58 34-92 72-92s68 34 72 92z" fill="#fff" fillOpacity="0.45" />
        </svg>
      )}
    </span>
  );
}
