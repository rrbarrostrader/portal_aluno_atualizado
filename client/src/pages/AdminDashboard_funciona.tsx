import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogOut, Users, BookOpen, BarChart3, Settings } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import AdminStudents from "./AdminStudents";
import AdminGrades from "./AdminGrades";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logout realizado com sucesso");
      setLocation("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
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
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Visão Geral</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">Total de Alunos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-900">3</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">Cursos Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-900">3</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">Disciplinas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-900">18</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">Notas Lançadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-900">54</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "students" && <AdminStudents />}

          {activeTab === "grades" && <AdminGrades />}

          {activeTab === "courses" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Gerenciar Cursos</h2>
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold">
                  + Novo Curso
                </Button>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Cursos</CardTitle>
                  <CardDescription>Cursos disponíveis no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <h4 className="font-semibold text-slate-900">Administração</h4>
                      <p className="text-sm text-slate-600 mt-1">Curso de Administração - 6 semestres</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <h4 className="font-semibold text-slate-900">Gestão</h4>
                      <p className="text-sm text-slate-600 mt-1">Curso de Gestão - 4 semestres</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <h4 className="font-semibold text-slate-900">Contabilidade</h4>
                      <p className="text-sm text-slate-600 mt-1">Curso de Contabilidade - 6 semestres</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Configurações</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Sistema</CardTitle>
                  <CardDescription>Gerencie as configurações gerais do portal</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Funcionalidade em desenvolvimento...</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
