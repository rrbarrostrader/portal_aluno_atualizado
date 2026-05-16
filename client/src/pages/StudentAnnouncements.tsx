import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Bell, AlertCircle, BookOpen, DollarSign, Settings } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentAnnouncements() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Buscar avisos publicados
  const announcementsQuery = trpc.announcements.list.useQuery();

  // Normalização para garantir que os dados do Postgres (totalmente minúsculos) funcionem
  const announcements = (announcementsQuery.data || []).map((ann: any) => ({
    id: ann.id,
    title: ann.title,
    content: ann.content,
    type: ann.type || "general",
    priority: ann.priority || "medium",
    publishedAt: ann.publishedat || ann.createdat || new Date(),
  }));

  // Agrupar avisos por tipo
  const announcementsByType = {
    general: announcements.filter(a => a.type === "general"),
    academic: announcements.filter(a => a.type === "academic"),
    financial: announcements.filter(a => a.type === "financial"),
    administrative: announcements.filter(a => a.type === "administrative"),
  };

  // Avisos de alta prioridade
  const highPriorityAnnouncements = announcements.filter(a => a.priority === "high");

  const typeLabels = {
    general: "Geral",
    academic: "Acadêmico",
    financial: "Financeiro",
    administrative: "Administrativo",
  };

  const typeIcons = {
    general: Bell,
    academic: BookOpen,
    financial: DollarSign,
    administrative: Settings,
  };

  const typeColors = {
    general: "bg-blue-50 border-blue-200 text-blue-900",
    academic: "bg-purple-50 border-purple-200 text-purple-900",
    financial: "bg-green-50 border-green-200 text-green-900",
    administrative: "bg-orange-50 border-orange-200 text-orange-900",
  };

  const priorityColors = {
    low: "bg-slate-100 text-slate-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const priorityLabels = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
  };

  const renderAnnouncementCard = (announcement: any) => {
    const TypeIcon = typeIcons[announcement.type as keyof typeof typeIcons] || Bell;
    return (
      <Card key={announcement.id} className={`border-2 ${typeColors[announcement.type as keyof typeof typeColors] || typeColors.general} shadow-sm`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <TypeIcon className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-bold">{announcement.title}</CardTitle>
                <CardDescription className="mt-1 font-medium text-xs uppercase">
                  {new Date(announcement.publishedAt).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </div>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${priorityColors[announcement.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
              {priorityLabels[announcement.priority as keyof typeof priorityLabels] || "Média"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">{announcement.content}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/student")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Bell className="w-6 h-6 text-orange-500" />
                Avisos e Comunicados
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">IAB FAPEGMA</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {announcementsQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Buscando avisos...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {highPriorityAnnouncements.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Urgente</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {highPriorityAnnouncements.map(renderAnnouncementCard)}
                </div>
              </div>
            )}

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl mb-8 flex overflow-x-auto">
                <TabsTrigger value="all" className="rounded-xl font-bold px-6">Todos</TabsTrigger>
                <TabsTrigger value="general" className="rounded-xl font-bold px-6">Geral</TabsTrigger>
                <TabsTrigger value="academic" className="rounded-xl font-bold px-6">Acadêmico</TabsTrigger>
                <TabsTrigger value="financial" className="rounded-xl font-bold px-6">Financeiro</TabsTrigger>
                <TabsTrigger value="administrative" className="rounded-xl font-bold px-6">Administrativo</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {announcements.length === 0 ? (
                  <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
                    <Bell className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-900">Nenhum aviso</h3>
                    <p className="text-slate-400 font-medium text-sm">Você está atualizado com todos os comunicados.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {announcements.map(renderAnnouncementCard)}
                  </div>
                )}
              </TabsContent>

              {Object.entries(announcementsByType).map(([type, items]) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  {items.length === 0 ? (
                    <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
                      <Bell className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                      <h3 className="text-xl font-black text-slate-900">Sem avisos nesta categoria</h3>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {items.map(renderAnnouncementCard)}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
