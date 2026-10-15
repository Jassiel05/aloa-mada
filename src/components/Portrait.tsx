import Image from "next/image";

const TONES = ["#DFE2EC", "#D7DBE8", "#E4E6EE", "#D3D7E5", "#DCDFEA", "#D9DCE8"];

function toneFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

/** Reflet neutre quand il n'y a pas de photo (ou qu'elle est masquée) : silhouette d'homme ou de femme. */
function Silhouette({ gender }: { gender: "homme" | "femme" | null }) {
  const fill = { fill: "#fff", fillOpacity: 0.9 };
  if (gender === "femme") {
    return (
      <svg aria-hidden="true" viewBox="0 0 200 250" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 size-full">
        <path d="M100 52c-27 0-44 20-44 48 0 22-6 40-14 52 14 8 34 10 58 10s44-2 58-10c-8-12-14-30-14-52 0-28-17-48-44-48z" {...fill} fillOpacity={0.6} />
        <ellipse cx="100" cy="100" rx="31" ry="36" {...fill} />
        <path d="M24 250c6-52 36-86 76-86s70 34 76 86z" {...fill} />
      </svg>
    );
  }
  if (gender === "homme") {
    return (
      <svg aria-hidden="true" viewBox="0 0 200 250" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 size-full">
        <path d="M64 92c0-26 16-42 36-42s36 16 36 42c0 6-1 10-2 14H66c-1-4-2-8-2-14z" {...fill} fillOpacity={0.6} />
        <ellipse cx="100" cy="102" rx="33" ry="38" {...fill} />
        <path d="M18 250c4-60 38-94 82-94s78 34 82 94z" {...fill} />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 200 250" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 size-full">
      <circle cx="100" cy="98" r="38" {...fill} fillOpacity={0.7} />
      <path d="M28 250c4-58 34-92 72-92s68 34 72 92z" {...fill} fillOpacity={0.7} />
    </svg>
  );
}

export default function Portrait({
  id,
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px",
  priority = false,
  grayscale = false,
  gender = null,
}: {
  id: string;
  src: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  grayscale?: boolean;
  gender?: "homme" | "femme" | null;
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
        <Silhouette gender={gender} />
      )}
    </span>
  );
}
