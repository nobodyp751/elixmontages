import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Shield, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useSignOut } from "@/hooks/use-auth";
import { Logo } from "./logo";
import { EditorAvatar } from "./editor-avatar";

export function SiteHeader() {
  const { user, profile, editor, isAdmin, ready } = useAuth();
  const signOut = useSignOut();
  const name = profile?.display_name || user?.email || "";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link to="/monteurs" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Trouver un monteur
            </Link>
            <Link to="/comment-ca-marche" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Comment ça marche
            </Link>
            <Link to="/devenir-monteur" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Devenir monteur
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!ready ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-3 ring-1 ring-border transition-colors hover:bg-secondary">
                <EditorAvatar name={name} url={profile?.avatar_url} className="h-8 w-8 text-xs" />
                <span className="hidden max-w-[10rem] truncate text-sm sm:block">{name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Tableau de bord
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/studio">
                    <Clapperboard className="mr-2 h-4 w-4" /> {editor ? "Mon studio monteur" : "Devenir monteur"}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" /> Espace fondateur
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth" search={{ mode: "signin" }}>Se connecter</Link>
              </Button>
              <Button asChild variant="hero" size="sm" className="px-4">
                <Link to="/auth" search={{ mode: "signup" }}>Commencer</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
