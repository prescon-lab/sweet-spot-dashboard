import { createFileRoute } from "@tanstack/react-router";
import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar";

export const Route = createFileRoute("/p/calendario")({
  head: () => ({
    meta: [
      { title: "Painel de Calendário" },
      { name: "description", content: "Gerencie suas reuniões e agendamentos com as EJs." },
    ],
  }),
  component: CalendarioPanel,
});

function CalendarioPanel() {
  return (
    <div className="page-shell animate-fade-in space-y-2 lg:space-y-4">
      <div className="mb-2 lg:mb-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Calendário de Reuniões</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe os próximos encontros, agende novas reuniões e mantenha tudo sincronizado.
        </p>
      </div>
      
      <DashboardCalendar />
    </div>
  );
}
