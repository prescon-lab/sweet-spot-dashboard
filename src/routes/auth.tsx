import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2, ShieldCheck } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Painel de Acompanhamento" },
      { name: "description", content: "Acesse o painel de acompanhamento de EJs e Guardiões com sua conta Google." },
      { property: "og:title", content: "Entrar — Painel de Acompanhamento" },
      { property: "og:description", content: "Acesse o painel de acompanhamento de EJs e Guardiões com sua conta Google." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  const handleGoogle = async () => {
    setSigningIn(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      setSigningIn(false);
      return;
    }
    if (result.redirected) return;

    navigate({ to: "/", replace: true });
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-3xl p-8 sm:p-10 text-center space-y-6 animate-scale-in">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Entrar no Painel
          </h1>
          <p className="text-muted-foreground text-sm">
            Use sua conta Google para acessar o acompanhamento de EJs e Guardiões.
          </p>
        </div>
        <Button
          size="lg"
          className="w-full gap-2 font-semibold min-h-[44px]"
          onClick={handleGoogle}
          disabled={signingIn}
        >
          {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Entrar com Google
        </Button>
        <p className="text-xs text-muted-foreground">
          Novos acessos entram como Guardião. Um administrador pode promover sua conta.
        </p>
      </div>
    </div>
  );
}
