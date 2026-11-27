import { useRef, useState, type ReactNode } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

/** Drag-and-drop file area that also opens the file picker on click or keyboard. */
export function Dropzone({ accept, multiple, onFiles, disabled, label, hint, children }: {
  accept: string; multiple?: boolean; onFiles: (files: File[]) => void; disabled?: boolean; label: string; hint?: string; children?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = (list: FileList | null) => { if (list?.length && !disabled) onFiles(Array.from(list)); };
  return (
    <div
      role="button" tabIndex={0} aria-label={label} aria-disabled={disabled}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!disabled) input.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
      className={cn("flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-6 text-center transition-colors",
        over && "border-primary bg-primary/10", disabled && "cursor-not-allowed opacity-50")}
    >
      <UploadCloud className="h-8 w-8 text-primary" />
      <p className="font-semibold">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      <input ref={input} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
    </div>
  );
}
