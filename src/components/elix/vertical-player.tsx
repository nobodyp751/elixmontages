import { useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { DURATION_LABEL, STYLE_LABEL, type DurationCategory, type VideoStyle } from "@/lib/elix";

type Props = {
  src: string | null;
  poster: string | null;
  title?: string;
  duration?: DurationCategory;
  style?: VideoStyle;
  className?: string;
  compact?: boolean;
};

/** 9:16 player built for TikTok / Reels / Shorts formats. */
export function VerticalPlayer({ src, poster, title, duration, style, className, compact }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <figure
      className={cn(
        "group relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-muted shadow-card ring-1 ring-border",
        className,
      )}
    >
      {src ? (
        <video
          ref={ref}
          src={poster ? src : `${src}#t=0.1`}
          poster={poster ?? undefined}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          onClick={toggle}
          className="h-full w-full cursor-pointer object-cover"
        />
      ) : poster ? (
        <img src={poster} alt={title ?? ""} loading="lazy" className="h-full w-full animate-kenburns object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-muted-foreground">Aucune vidéo</div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-scrim" />

      <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
        {duration && (
          <span className="rounded-full bg-background/70 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
            {DURATION_LABEL[duration]}
          </span>
        )}
        {style && !compact && (
          <span className="rounded-full bg-primary/90 px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
            {STYLE_LABEL[style]}
          </span>
        )}
      </div>

      {src && (
        <>
          {!playing && (
            <button
              type="button"
              onClick={toggle}
              aria-label="Lire la vidéo"
              className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105"
            >
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Activer le son" : "Couper le son"}
            className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-background/70 backdrop-blur"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </>
      )}

      {!src && poster && (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-background/70 px-2 py-0.5 text-[11px] backdrop-blur">
          Aperçu
        </span>
      )}

      {title && (
        <figcaption
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 p-3 font-medium leading-snug",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {title}
        </figcaption>
      )}
    </figure>
  );
}
