import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogOut, Users, BookOpen, BarChart3, Settings, GraduationCap, School, Loader2, Bell, DollarSign, FileText, Calculator, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import AdminStudents from "./AdminStudents";
import AdminGrades from "./AdminGrades";
import AdminCourses from "./AdminCourses";
import AdminSettings from "./AdminSettings";
import AdminAnnouncements from "./AdminAnnouncements";
import AdminPayments from "./AdminPayments";
import AdminGradesReport from "./AdminGradesReport";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Queries
  const dashboardQuery = trpc.dashboard.getStats.useQuery();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logout realizado com sucesso");
      setLocation("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const stats = dashboardQuery.data || {
    totalStudents: 0,
    totalCourses: 0,
    totalSubjects: 0,
    totalEnrollments: 0,
    studentsByCourse: [],
    courseDistribution: []
  };

  const menuItems = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "students", label: "Alunos", icon: Users },
    { id: "grades", label: "Lançar Notas", icon: Calculator },
    { id: "grades_report", label: "Relatório de Notas", icon: FileText },
    { id: "courses", label: "Cursos", icon: BookOpen },
    { id: "announcements", label: "Avisos", icon: Bell },
    { id: "finance", label: "Financeiro", icon: DollarSign },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  // Fechar sidebar ao mudar de aba no mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
              <span className="font-bold text-slate-900 text-xs md:text-base">IAB</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base md:text-xl font-bold text-slate-900 leading-tight">Painel Administrativo</h1>
              <p className="text-[10px] md:text-sm text-slate-500">IAB FAPEGMA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-right hidden xs:block">
              <p className="text-xs md:text-sm font-bold text-slate-900 truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Admin</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 h-8 md:h-10 text-xs md:text-sm border-slate-200"
            >
              <LogOut className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Overlay para mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Navegação Lateral */}
        <aside className={`
          fixed lg:sticky top-[57px] lg:top-[65px] left-0 z-25
          w-64 bg-white border-r border-slate-200 h-[calc(100vh-57px)] lg:h-[calc(100vh-65px)]
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          <nav className="p-4 space-y-1 overflow-y-auto h-full">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                  activeTab === item.id
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200 font-bold"
                    : "text-slate-600 hover:bg-slate-50 font-medium"
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? "text-yellow-400" : "text-slate-400"}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {activeTab === "overview" && (
            <div className="space-y-6 md:space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900">Visão Geral</h2>
                <p className="text-sm text-slate-500 mt-1">Resumo das atividades do portal acadêmico</p>
              </div>

              {dashboardQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mb-4" />
                  <p className="text-slate-500 font-medium">Carregando estatísticas...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <Card className="border-none shadow-sm bg-white rounded-2xl">
                      <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alunos</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 flex items-center justify-between">
                        <p className="text-2xl md:text-4xl font-black text-slate-900">{stats.totalStudents}</p>
                        <div className="p-2 md:p-3 bg-blue-50 rounded-xl text-blue-600">
                          <Users className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white rounded-2xl">
                      <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cursos</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 flex items-center justify-between">
                        <p className="text-2xl md:text-4xl font-black text-slate-900">{stats.totalCourses}</p>
                        <div className="p-2 md:p-3 bg-green-50 rounded-xl text-green-600">
                          <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white rounded-2xl">
                      <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disciplinas</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 flex items-center justify-between">
                        <p className="text-2xl md:text-4xl font-black text-slate-900">{stats.totalSubjects}</p>
                        <div className="p-2 md:p-3 bg-purple-50 rounded-xl text-purple-600">
                          <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white rounded-2xl">
                      <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrículas</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 flex items-center justify-between">
                        <p className="text-2xl md:text-4xl font-black text-slate-900">{stats.totalEnrollments}</p>
                        <div className="p-2 md:p-3 bg-yellow-50 rounded-xl text-yellow-600">
                          <School className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                      <CardHeader className="border-b border-slate-50">
                        <CardTitle className="text-lg font-bold text-slate-900">Alunos por Curso</CardTitle>
                        <CardDescription>Distribuição de matrículas ativas</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 md:p-6">
                        <div className="space-y-3">
                          {stats.studentsByCourse.length > 0 ? (
                            stats.studentsByCourse.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                                <div>
                                  <p className="font-bold text-slate-900 text-sm md:text-base">{item.courseName}</p>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{item.courseType}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg md:text-xl font-black text-slate-900">{item.studentCount}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">Alunos</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-center py-10 text-slate-400 italic">Nenhuma matrícula encontrada</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                      <CardHeader className="border-b border-slate-50">
                        <CardTitle className="text-lg font-bold text-slate-900">Distribuição de Cursos</CardTitle>
                        <CardDescription>Quantidade de cursos por modalidade</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 md:p-6">
                        <div className="space-y-3">
                          {stats.courseDistribution.length > 0 ? (
                            stats.courseDistribution.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                                <p className="font-bold text-slate-900 capitalize text-sm md:text-base">
                                  {item.type === 'graduation' ? 'Graduação' : item.type === 'postgraduate' ? 'Pós-graduação' : 'Técnico'}
                                </p>
                                <p className="text-lg md:text-xl font-black text-slate-900">{item.count}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center py-10 text-slate-400 italic">Nenhum curso cadastrado</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "students" && <AdminStudents />}
          {activeTab === "grades" && <AdminGrades />}
          {activeTab === "grades_report" && <AdminGradesReport />}
          {activeTab === "courses" && <AdminCourses />}
          {activeTab === "announcements" && <AdminAnnouncements />}
          {activeTab === "finance" && <AdminPayments />}
          {activeTab === "settings" && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}
