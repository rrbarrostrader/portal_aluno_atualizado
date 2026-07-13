import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogOut, BookOpen, FileText, BarChart3, Bell, CreditCard, Loader2, TrendingUp, Contact2, Calendar, User } from "lucide-react";
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

  // Buscar avisos recentes (Públicos)
  const announcementsQuery = trpc.announcements.list.useQuery();

  const [selectedEnrollment, setSelectedEnrollment] = useState<number | null>(null);
  
  useEffect(() => {
    if (enrollmentsQuery.data && enrollmentsQuery.data.length > 0 && !selectedEnrollment) {
      setSelectedEnrollment(enrollmentsQuery.data[0].id);
    }
  }, [enrollmentsQuery.data, selectedEnrollment]);

  const allGradesQuery = trpc.students.getAllMyGrades.useQuery(
    { enrollmentId: selectedEnrollment || 0 },
    { enabled: !!selectedEnrollment }
  );

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logout realizado com sucesso");
      setLocation("/");
    },
  });

  useEffect(() => {
    if (allGradesQuery.data && Array.isArray(allGradesQuery.data)) {
      const grades = allGradesQuery.data;
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
        ].filter((g) => g !== null && g !== undefined && !isNaN(parseFloat(g)));

        if (bimesterGrades.length > 0) {
          const avg = bimesterGrades.reduce((a: any, b: any) => parseFloat(a) + parseFloat(b), 0) / bimesterGrades.length;
          totalAverage += avg;
          validGradeCount++;
          if (avg >= 7) approvedCount++;
        }
      });

      setAcademicStats({
        generalAverage: validGradeCount > 0 ? totalAverage / validGradeCount : 0,
        activeSubjects: grades.length,
        totalSemesters: semesters.size || 1,
        approvedSubjects: approvedCount
      });
    }
  }, [allGradesQuery.data]);

  const recentAnnouncements = (announcementsQuery.data || []).slice(0, 3);

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case "academic": return "bg-blue-50 border-blue-200 text-blue-700";
      case "financial": return "bg-red-50 border-red-200 text-red-700";
      case "administrative": return "bg-purple-50 border-purple-200 text-purple-700";
      default: return "bg-green-50 border-green-200 text-green-700";
    }
  };

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000' 
      : `${window.location.protocol}//${window.location.host}`;
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${backendUrl}${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
              <span className="font-black text-yellow-400 text-lg md:text-xl">IAB</span>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-none">Portal do Aluno</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">IAB FAPEGMA</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:block text-right mr-2">
              <p className="text-sm font-bold text-slate-900">{user?.name}</p>
              <p className="text-[10px] font-medium text-slate-400">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img src={getImageUrl(user.profileImageUrl)!} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => logoutMutation.mutate()} 
              className="h-10 w-10 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="bg-slate-900 rounded-[2rem] p-6 md:p-10 mb-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-black mb-2">Olá, {user?.name?.split(' ')[0]}! 👋</h2>
            <p className="text-slate-400 text-sm md:text-lg font-medium max-w-md">Seu progresso acadêmico está excelente. Continue assim!</p>
          </div>
          <div className="absolute right-0 top-0 w-48 h-48 md:w-64 md:h-64 bg-yellow-400/10 rounded-full -mr-10 -mt-10 md:-mr-20 md:-mt-20 blur-3xl"></div>
        </div>

        {/* Menu de Ações - Grid Responsivo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
          {[
            { icon: BarChart3, label: "NOTAS", color: "text-yellow-500", path: "/student/Notas" },
            { icon: BookOpen, label: "Acadêmico", color: "text-blue-500", path: "/student/academico" },
            { icon: FileText, label: "Secretaria", color: "text-green-500", path: "/student/secretaria" },
            { icon: Bell, label: "Avisos", color: "text-orange-500", path: "/student/avisos" },
            { icon: CreditCard, label: "Financeiro", color: "text-purple-500", path: "/student/pagamento" },
            { icon: Contact2, label: "ID Digital", color: "text-indigo-500", path: "/student/carteirinha" },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setLocation(item.path)}
              className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center gap-3 group"
            >
              <div className={`p-3 rounded-2xl bg-slate-50 group-hover:bg-white transition-colors`}>
                <item.icon className={`w-5 h-5 md:w-6 md:h-6 ${item.color}`} />
              </div>
              <span className="font-black text-slate-700 text-xs md:text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Stats em Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm bg-white rounded-[1.5rem] md:rounded-[2rem]">
                <CardContent className="pt-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Média Geral</p>
                  <h3 className="text-3xl md:text-4xl font-black text-slate-900">{academicStats.generalAverage.toFixed(1)}</h3>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white rounded-[1.5rem] md:rounded-[2rem]">
                <CardContent className="pt-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Disciplinas</p>
                  <h3 className="text-3xl md:text-4xl font-black text-slate-900">{academicStats.activeSubjects}</h3>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white rounded-[1.5rem] md:rounded-[2rem]">
                <CardContent className="pt-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aprovadas</p>
                  <h3 className="text-3xl md:text-4xl font-black text-green-600">{academicStats.approvedSubjects}</h3>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-white border-b border-slate-50 py-4 px-6">
                <CardTitle className="text-base md:text-lg font-black flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Próximas Atividades
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 text-center text-slate-400 italic text-sm">
                Nenhuma atividade agendada para esta semana.
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-white border-b border-slate-50 py-4 px-6">
                <CardTitle className="text-base md:text-lg font-black flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  Últimos Avisos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                {announcementsQuery.isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-200" /></div>
                ) : recentAnnouncements.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-8 italic">Nenhum aviso no momento.</p>
                ) : (
                  recentAnnouncements.map((ann) => (
                    <div key={ann.id} className={`p-4 rounded-2xl border ${getAnnouncementColor(ann.type)} transition-all hover:shadow-md cursor-pointer`}>
                      <h4 className="font-black text-sm mb-1">{ann.title}</h4>
                      <p className="text-xs line-clamp-2 opacity-80 leading-relaxed">{ann.content}</p>
                    </div>
                  ))
                )}
                <Button 
                  variant="ghost" 
                  className="w-full text-slate-500 font-black text-[10px] uppercase tracking-widest mt-2" 
                  onClick={() => setLocation("/student/avisos")}
                >
                  Ver todos os avisos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
