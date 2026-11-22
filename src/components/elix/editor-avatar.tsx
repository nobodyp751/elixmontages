import { cn } from "@/lib/utils";
import { initials } from "@/lib/elix";

export function EditorAvatar({
  name,
  url,
  className,
}: {
  name: string;
  url?: string | null;
  className?: string;
}) {
  if (url) {
    return <img src={url} alt={name} className={cn("h-10 w-10 rounded-full object-cover", className)} />;
  }
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary font-display text-sm font-bold text-primary ring-1 ring-primary/30",
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
