import { media } from "@/config/media";

export function Logo({
  reversed = false,
  className = "h-8 w-auto",
}: {
  reversed?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={reversed ? media.logoReversed : media.logo}
      alt="Hot Water Experts"
      className={className}
    />
  );
}
