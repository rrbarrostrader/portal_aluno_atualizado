import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogOut, Users, BookOpen, BarChart3, Settings, GraduationCap, School, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import AdminStudents from "./AdminStudents";
import AdminGrades from "./AdminGrades";
import AdminCourses from "./AdminCourses";
import AdminSettings from "./AdminSettings";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

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
              <h1 className="text-xl font-bold text-slate-900">Painel Administrativo</h1>
              <p className="text-sm text-slate-500">IAB FAPEGMA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">Administrador</p>
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

      {/* Navegação Lateral */}
      <div className="flex">
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-80px)]">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === "overview"
                  ? "bg-yellow-100 text-yellow-900 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === "students"
                  ? "bg-yellow-100 text-yellow-900 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4" />
              Alunos
            </button>
            <button
              onClick={() => setActiveTab("grades")}
              className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === "grades"
                  ? "bg-yellow-100 text-yellow-900 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Notas
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === "courses"
                  ? "bg-yellow-100 text-yellow-900 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Cursos
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === "settings"
                  ? "bg-yellow-100 text-yellow-900 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Settings className="w-4 h-4" />
              Configurações
            </button>
          </nav>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 p-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Visão Geral</h2>
                <p className="text-slate-500 mt-1">Resumo das atividades do portal acadêmico</p>
              </div>

              {dashboardQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mb-4" />
                  <p className="text-slate-500 font-medium">Carregando estatísticas...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-none shadow-sm bg-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total de Alunos</CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <p className="text-4xl font-black text-slate-900">{stats.totalStudents}</p>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                          <Users className="w-6 h-6" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Cursos Ativos</CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <p className="text-4xl font-black text-slate-900">{stats.totalCourses}</p>
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Disciplinas</CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <p className="text-4xl font-black text-slate-900">{stats.totalSubjects}</p>
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Matrículas</CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <p className="text-4xl font-black text-slate-900">{stats.totalEnrollments}</p>
                        <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                          <School className="w-6 h-6" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-none shadow-sm bg-white">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-900">Alunos por Curso</CardTitle>
                        <CardDescription>Distribuição de matrículas ativas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {stats.studentsByCourse.length > 0 ? (
                            stats.studentsByCourse.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                  <p className="font-bold text-slate-900">{item.courseName}</p>
                                  <p className="text-xs text-slate-500 uppercase">{item.courseType}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-black text-slate-900">{item.studentCount}</p>
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

                    <Card className="border-none shadow-sm bg-white">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-900">Distribuição de Cursos</CardTitle>
                        <CardDescription>Quantidade de cursos por modalidade</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {stats.courseDistribution.length > 0 ? (
                            stats.courseDistribution.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <p className="font-bold text-slate-900 capitalize">{item.type === 'graduation' ? 'Graduação' : item.type === 'postgraduate' ? 'Pós-graduação' : 'Técnico'}</p>
                                <p className="text-lg font-black text-slate-900">{item.count}</p>
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

          {activeTab === "courses" && <AdminCourses />}

          {activeTab === "settings" && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}
