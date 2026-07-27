import { Calendar, Home, Inbox, Search, Settings, Users, BarChart2 } from "lucide-react"
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
    title: "Histórico de Eventos",
    url: "/p/historico-eventos",
    icon: BarChart2,
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

export function AppSidebar() {
  const [groupedLinks, setGroupedLinks] = useState<Record<string, UsefulLink[]>>({});

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
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
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
