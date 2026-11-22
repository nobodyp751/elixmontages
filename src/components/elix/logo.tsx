import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2" aria-label="Elix — accueil">
      <span className="relative grid h-8 w-6 place-items-center rounded-md bg-primary text-primary-foreground transition-transform group-hover:-rotate-6">
        <span className="font-display text-sm font-extrabold leading-none">e</span>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-accent" />
      </span>
      <span className="font-display text-2xl font-extrabold tracking-tight">elix</span>
    </Link>
  );
}
