import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogOut, BookOpen, FileText, BarChart3, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Avisos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Fique atualizado com avisos</p>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Informações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumo Acadêmico */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumo Acadêmico</CardTitle>
              <CardDescription>Informações do seu desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Média Geral</span>
                  <span className="text-2xl font-bold text-slate-900">8.0</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Frequência</span>
                  <span className="text-2xl font-bold text-slate-900">89%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Disciplinas Ativas</span>
                  <span className="text-2xl font-bold text-slate-900">6</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avisos Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Avisos Recentes</CardTitle>
              <CardDescription>Últimas notificações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Bem-vindo!</p>
                  <p className="text-xs text-blue-700 mt-1">Acesse o portal para visualizar seus dados</p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Notas Lançadas</p>
                  <p className="text-xs text-green-700 mt-1">Suas notas do 1º bimestre foram publicadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
