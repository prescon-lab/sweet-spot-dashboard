import {
  Home,
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Users2,
  History,
  CalendarDays,
  UserCog,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { linksStore, UsefulLink } from "@/lib/linksStore";
import { useAccessRole } from "@/lib/access";
import { cn } from "@/lib/utils";

// Menu items with contextual icons
const items = [
  {
    title: "Início",
    url: "/",
    icon: Home,
    exact: true,
  },
  {
    title: "Painel Geral",
    url: "/p/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Painel de EJs",
    url: "/p/ejs",
    icon: Building2,
  },
  {
    title: "Painel de Guardiões",
    url: "/p/guardioes",
    icon: ShieldCheck,
  },
  {
    title: "Squads",
    url: "/p/squads",
    icon: Users2,
    adminOnly: true,
  },
  {
    title: "Histórico de Eventos",
    url: "/p/historico-eventos",
    icon: History,
    adminOnly: true,
  },
  {
    title: "Calendário",
    url: "/p/calendario",
    icon: CalendarDays,
  },
  {
    title: "Gestão de Gente",
    url: "/p/gestao-gente",
    icon: UserCog,
    adminOnly: true,
  },
  {
    title: "Configurações",
    url: "/p/configuracoes",
    icon: SlidersHorizontal,
    adminOnly: true,
  },
];

export function AppSidebar() {
  const [groupedLinks, setGroupedLinks] = useState<Record<string, UsefulLink[]>>({});
  const role = useAccessRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visibleItems = items.filter((item) => !item.adminOnly || role === "admin");

  useEffect(() => {
    setGroupedLinks(linksStore.getGroupedByCategory());

    const handleUpdate = () => {
      setGroupedLinks(linksStore.getGroupedByCategory());
    };

    window.addEventListener("linksStoreUpdated", handleUpdate);
    return () => window.removeEventListener("linksStoreUpdated", handleUpdate);
  }, []);

  const isActive = (item: typeof items[0]) => {
    if (item.exact) return pathname === item.url;
    return pathname.startsWith(item.url);
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="mt-4 gap-0.5">
              {visibleItems.map((item) => {
                const active = isActive(item);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={active}>
                      <Link
                        to={item.url}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 transition-all",
                          active
                            ? "font-bold text-primary bg-primary/10 border-l-2 border-primary"
                            : "font-medium text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            active ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {Object.keys(groupedLinks).length > 0 && (
          <div className="mt-4">
            {Object.entries(groupedLinks).map(([category, links]) => (
              <SidebarGroup key={category}>
                <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  {category}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {links.map((link) => (
                      <SidebarMenuItem key={link.id}>
                        <SidebarMenuButton asChild tooltip={link.title}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-muted-foreground hover:text-foreground transition-all"
                          >
                            <ExternalLink className="w-4 h-4 shrink-0" />
                            <span>{link.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
