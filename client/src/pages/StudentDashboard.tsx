import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogOut, BookOpen, FileText, BarChart3, Bell, CreditCard, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [academicStats, setAcademicStats] = useState({
    generalAverage: 0,
    activeSubjects: 0,
    totalSemesters: 0,
    approvedSubjects: 0
  });

  // Buscar matrículas do aluno
  const enrollmentsQuery = trpc.students.getMyEnrollments.useQuery();

  // Buscar avisos recentes
  const announcementsQuery = trpc.announcements.getPublished.useQuery();

  // Buscar todas as notas do aluno para calcular estatísticas
  const [selectedEnrollment, setSelectedEnrollment] = useState<number | null>(null);
  
  useEffect(() => {
    if (enrollmentsQuery.data && enrollmentsQuery.data.length > 0 && !selectedEnrollment) {
      setSelectedEnrollment(enrollmentsQuery.data[0].id);
    }
  }, [enrollmentsQuery.data, selectedEnrollment]);

  // Query para buscar todas as notas do aluno
  const allGradesQuery = trpc.students.getAllMyGrades.useQuery(
    { enrollmentId: selectedEnrollment || 0 },
    { enabled: !!selectedEnrollment }
  );

  // Calcular estatísticas acadêmicas
  useEffect(() => {
    if (allGradesQuery.data && Array.isArray(allGradesQuery.data)) {
      const grades = allGradesQuery.data;
      
      // Calcular média geral
      let totalAverage = 0;
      let validGradeCount = 0;
      const semesters = new Set<number>();
      let approvedCount = 0;

      grades.forEach((grade: any) => {
        semesters.add(grade.semester);
        
        const bimesterGrades = [
          grade.firstBimester,
          grade.secondBimester,
          grade.thirdBimester,
          grade.fourthBimester,
        ].filter((g) => g !== null && g !== undefined && Number(g) > 0);

        if (bimesterGrades.length > 0) {
          const avg = bimesterGrades.reduce((a: any, b: any) => Number(a) + Number(b), 0) / bimesterGrades.length;
          totalAverage += avg;
          validGradeCount++;

          if (avg >= 7) {
            approvedCount++;
          }
        }
      });

      setAcademicStats({
        generalAverage: validGradeCount > 0 ? totalAverage / validGradeCount : 0,
        activeSubjects: grades.length,
        totalSemesters: semesters.size,
        approvedSubjects: approvedCount
      });
    }
  }, [allGradesQuery.data]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logout realizado com sucesso");
      setLocation("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Pegar apenas os 3 avisos mais recentes
  const recentAnnouncements = (announcementsQuery.data || []).slice(0, 3);

  // Função para retornar cor baseada no tipo de aviso
  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case "academic":
        return "bg-blue-50 border-blue-200 text-blue-900 text-blue-700";
      case "financial":
        return "bg-red-50 border-red-200 text-red-900 text-red-700";
      case "administrative":
        return "bg-purple-50 border-purple-200 text-purple-900 text-purple-700";
      default:
        return "bg-green-50 border-green-200 text-green-900 text-green-700";
    }
  };

  const getAnnouncementTypeLabel = (type: string) => {
    switch (type) {
      case "academic":
        return "Acadêmico";
      case "financial":
        return "Financeiro";
      case "administrative":
        return "Administrativo";
      default:
        return "Geral";
    }
  };

  // Função para determinar cor da média
  const getAverageColor = (average: number) => {
    if (average >= 7) return "text-green-600";
    if (average >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="font-bold text-slate-900">IAB</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Portal Acadêmico</h1>
              <p className="text-sm text-slate-500">IAB FAPEGMA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Boas-vindas */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Bem-vindo, {user?.name}!</h2>
          <p className="text-slate-600 mt-2">Acesse seus dados acadêmicos abaixo</p>
        </div>

        {/* Cards de Atalhos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setLocation("/student/boletim")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-500" />
                Boletim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Visualize suas notas e frequência</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setLocation("/student/academico")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Acadêmico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Grade e histórico de disciplinas</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setLocation("/student/secretaria")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                Secretaria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Gere documentos acadêmicos</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setLocation("/student/avisos")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-500" />
                Avisos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Fique atualizado com avisos</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setLocation("/student/pagamento")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-500" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Gerencie suas mensalidades</p>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Informações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumo Acadêmico */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                Resumo Acadêmico
              </CardTitle>
              <CardDescription>Informações do seu desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              {allGradesQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                    <span className="text-slate-700 font-semibold">Média Geral</span>
                    <span className={`text-3xl font-bold ${getAverageColor(academicStats.generalAverage)}`}>
                      {academicStats.generalAverage.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-600">Disciplinas Ativas</span>
                    <span className="text-2xl font-bold text-slate-900">{academicStats.activeSubjects}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-600">Semestres Cursados</span>
                    <span className="text-2xl font-bold text-slate-900">{academicStats.totalSemesters}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-green-700 font-semibold">Disciplinas Aprovadas</span>
                    <span className="text-2xl font-bold text-green-600">{academicStats.approvedSubjects}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Avisos Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Avisos Recentes</CardTitle>
              <CardDescription>Últimas notificações</CardDescription>
            </CardHeader>
            <CardContent>
              {announcementsQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                </div>
              ) : recentAnnouncements.length > 0 ? (
                <div className="space-y-3">
                  {recentAnnouncements.map((announcement) => {
                    const colors = getAnnouncementColor(announcement.type);
                    const [bgColor, borderColor, textColor, textColorSecondary] = colors.split(" ");
                    
                    return (
                      <div key={announcement.id} className={`p-3 ${bgColor} border ${borderColor} rounded-lg`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`text-sm font-medium ${textColor}`}>{announcement.title}</p>
                            <p className={`text-xs ${textColorSecondary} mt-1 line-clamp-2`}>{announcement.content}</p>
                          </div>
                          {announcement.priority === "high" && (
                            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded">!</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm italic">Nenhum aviso no momento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
