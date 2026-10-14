import Link from "next/link";

export default function Logo({ size = "text-[28px]" }: { size?: string }) {
  return (
    <Link href="/" className={`font-display ${size} font-semibold tracking-tight text-ink no-underline`}>
      aloa<span className="text-laterite">·</span>mada
    </Link>
  );
}
