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
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-fade-in space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Calendário de Reuniões</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe os próximos encontros, agende novas reuniões e mantenha tudo sincronizado.
        </p>
      </div>
      
      <DashboardCalendar />
    </div>
  );
}
