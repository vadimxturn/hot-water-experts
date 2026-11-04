import { media } from "@/config/media";

export function Logo({
  reversed = false,
  sidebar = false,
  className = "h-8 w-auto",
}: {
  reversed?: boolean;
  sidebar?: boolean;
  className?: string;
}) {
  const src = sidebar ? media.logoSidebar : reversed ? media.logoReversed : media.logo;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Hot Water Experts"
      className={className}
    />
  );
}
