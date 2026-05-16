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
  const [selectedType, setSelectedType] = useState<string>("all");

  // Buscar avisos publicados
  const announcementsQuery = trpc.announcements.list.useQuery();

  const announcements = announcementsQuery.data || [];

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
      <Card key={announcement.id} className={`border-2 ${typeColors[announcement.type]}`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <TypeIcon className="w-5 h-5 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <CardTitle className="text-lg">{announcement.title}</CardTitle>
                <CardDescription className="mt-1">
                  {new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </div>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${priorityColors[announcement.priority]}`}>
              {priorityLabels[announcement.priority]}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 whitespace-pre-wrap">{announcement.content}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/student")}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-8 h-8 text-yellow-500" />
            Avisos e Comunicados
          </h1>
          <p className="text-slate-600 mt-2">Fique atualizado com os últimos avisos da instituição</p>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {announcementsQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
            <p className="text-slate-500 font-bold">Carregando avisos...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Avisos de Alta Prioridade */}
            {highPriorityAnnouncements.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Avisos Importantes</h2>
                </div>
                <div className="space-y-4">
                  {highPriorityAnnouncements.map(renderAnnouncementCard)}
                </div>
              </div>
            )}

            {/* Abas por Tipo */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="academic">Acadêmico</TabsTrigger>
                <TabsTrigger value="financial">Financeiro</TabsTrigger>
                <TabsTrigger value="administrative">Administrativo</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {announcements.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-20">
                      <Bell className="w-16 h-16 text-slate-200 mb-4" />
                      <h3 className="text-xl font-bold text-slate-900">Nenhum aviso no momento</h3>
                      <p className="text-slate-500">Volte mais tarde para verificar novos avisos.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {announcements.map(renderAnnouncementCard)}
                  </div>
                )}
              </TabsContent>

              {Object.entries(announcementsByType).map(([type, items]) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  {items.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-20">
                        <Bell className="w-16 h-16 text-slate-200 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">Nenhum aviso {typeLabels[type as keyof typeof typeLabels].toLowerCase()}</h3>
                        <p className="text-slate-500">Não há avisos deste tipo no momento.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
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
