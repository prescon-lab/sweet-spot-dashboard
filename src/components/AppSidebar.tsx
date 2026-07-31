import { Calendar, Home, Inbox, Search, Settings, Users, BarChart2, ShieldCheck } from "lucide-react"
import { Link } from "@tanstack/react-router"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "Painel Geral",
    url: "/p/dashboard",
    icon: Inbox,
  },
  {
    title: "Painel de EJs",
    url: "/p/ejs",
    icon: Search,
  },
  {
    title: "Painel de Guardiões",
    url: "/p/guardioes",
    icon: Users,
  },
  {
    title: "Squads",
    url: "/p/squads",
    icon: Users, // Can use Users or something else, like a group icon.
  },
  {
    title: "Histórico de Eventos",
    url: "/p/historico-eventos",
    icon: BarChart2,
  },
  {
    title: "Administração",
    url: "/p/admin",
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    title: "Configurações",
    url: "/p/configuracoes",
    icon: Settings,
    adminOnly: true,
  },
]

import { useEffect, useState } from "react";
import { linksStore, UsefulLink } from "@/lib/linksStore";
import { ExternalLink } from "lucide-react";
import { useAccessRole } from "@/lib/access";

export function AppSidebar() {
  const [groupedLinks, setGroupedLinks] = useState<Record<string, UsefulLink[]>>({});
  const role = useAccessRole();
  const visibleItems = items.filter((item) => !item.adminOnly || role === "admin");

  useEffect(() => {
    setGroupedLinks(linksStore.getGroupedByCategory());
    
    const handleUpdate = () => {
      setGroupedLinks(linksStore.getGroupedByCategory());
    };
    
    window.addEventListener('linksStoreUpdated', handleUpdate);
    return () => window.removeEventListener('linksStoreUpdated', handleUpdate);
  }, []);

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="mt-4">
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {Object.keys(groupedLinks).length > 0 && (
          <div className="mt-4">
            {Object.entries(groupedLinks).map(([category, links]) => (
              <SidebarGroup key={category}>
                <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{category}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {links.map((link) => (
                      <SidebarMenuItem key={link.id}>
                        <SidebarMenuButton asChild tooltip={link.title}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
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
  )
}
