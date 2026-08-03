import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  ScrollRestoration,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Lovable Generated Project" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Lovable Generated Project" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..900;1,200..900&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut, Bell, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initCloudSync } from "@/lib/cloudSync";
import { supabase } from "@/integrations/supabase/client";
import { mentionStore, Mention } from "@/lib/mentionStore";
import { userActivityStore } from "@/lib/userActivityStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

function UserChip() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <NotificationsDropdown />
      
      <Link to="/p/profile" className="flex items-center gap-2 min-w-0 hover:bg-accent p-1.5 rounded-md transition-colors cursor-pointer">
        <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[180px]">
          {user.email}
        </span>
        <span className="hidden md:inline rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {isAdmin ? "Administrador" : "Guardião"}
        </span>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 min-h-[44px] sm:min-h-0"
        onClick={async () => {
          await signOut();
          navigate({ to: "/auth", replace: true });
        }}
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Sair</span>
      </Button>
    </div>
  );
}

function NotificationsDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentions, setMentions] = useState<Mention[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const loadMentions = async () => {
      const { data: profile } = await supabase.from("profiles").select("guardian_name").eq("id", user.id).single();
      if (profile?.guardian_name) {
        const allMentions = mentionStore.getMentions().filter(m => !m.read && m.guardianName === profile.guardian_name);
        setMentions(allMentions);
      }
    };
    
    loadMentions();
    // Optional: add interval or listen to events
    const interval = setInterval(loadMentions, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative mr-2 h-9 w-9 rounded-full">
          <Bell className="h-5 w-5" />
          {mentions.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-none">
              {mentions.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-primary/5 p-4 border-b">
          <h3 className="font-semibold text-primary flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notificações
          </h3>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
          {mentions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 opacity-20" />
              <p className="text-sm">Nenhuma notificação pendente.</p>
            </div>
          ) : (
            mentions.map(mention => (
              <DropdownMenuItem 
                key={mention.id} 
                className="flex flex-col items-start p-3 gap-1 cursor-pointer focus:bg-accent rounded-xl"
                onClick={() => {
                  mentionStore.markAsRead(mention.id);
                  setMentions(prev => prev.filter(m => m.id !== mention.id));
                  navigate({ to: "/p/$token", params: { token: "dashboard" } });
                }}
              >
                <div className="flex items-center gap-2 w-full">
                  <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-sm font-semibold truncate flex-1">Mencionado em {mention.ejName}</p>
                </div>
                <p className="text-xs text-muted-foreground pl-6">{new Date(mention.date).toLocaleString('pt-BR')}</p>
                <p className="text-xs bg-muted/50 p-2 rounded-md mt-1 w-full italic truncate">"{mention.contextText}"</p>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const isAuthRoute = pathname === "/auth";

  useEffect(() => {
    if (!loading && !session && !isAuthRoute) {
      navigate({ to: "/auth", replace: true });
    }
  }, [loading, session, isAuthRoute, navigate]);

  useEffect(() => {
    if (session && user && !loading) {
      userActivityStore.registerLogin(user.id);
    }
  }, [session, user, loading]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session && !isAuthRoute) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}

function AppShell() {
  const { session } = useAuth();

  return (
    <SidebarProvider>
      {session ? <AppSidebar /> : null}
      <main className="flex-1 overflow-x-hidden min-w-0 relative flex flex-col">
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-3 border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl">
          {session ? <SidebarTrigger className="h-10 w-10" /> : <span />}
          <div className="flex items-center gap-2">
            <UserChip />
            <ThemeToggle />
          </div>
        </header>
        <AuthGate>
          <Outlet />
        </AuthGate>
      </main>
    </SidebarProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    initCloudSync();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vertentes-theme">
      <QueryClientProvider client={queryClient}>
        <ScrollRestoration />
        <AuthProvider>
          <AppShell />
        </AuthProvider>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

