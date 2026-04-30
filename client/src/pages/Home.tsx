import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { ArrowRight, BookOpen, Users, BarChart3, Shield } from "lucide-react";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Cabeçalho */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="font-bold text-slate-900">IAB</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Portal Acadêmico</h1>
              <p className="text-xs text-slate-400">IAB FAPEGMA</p>
            </div>
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setLocation(user?.role === "admin" ? "/admin" : "/student")}
                  className="text-white border-slate-600 hover:bg-slate-800"
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/login")}
                  className="text-white border-slate-600 hover:bg-slate-800"
                >
                  Login
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Portal Acadêmico <span className="text-yellow-400">IAB FAPEGMA</span>
        </h2>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Centralize a gestão de alunos, notas, frequência e documentos acadêmicos em uma única plataforma
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => setLocation("/login")}
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold"
          >
            Acessar Portal
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h3 className="text-3xl font-bold text-white text-center mb-12">Funcionalidades Principais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-yellow-400 transition-colors">
            <BookOpen className="w-12 h-12 text-yellow-400 mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Boletim Acadêmico</h4>
            <p className="text-slate-400">Visualize notas, frequência e histórico de disciplinas</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-yellow-400 transition-colors">
            <Users className="w-12 h-12 text-yellow-400 mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Gestão de Alunos</h4>
            <p className="text-slate-400">CRUD completo para administradores gerenciarem alunos</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-yellow-400 transition-colors">
            <BarChart3 className="w-12 h-12 text-yellow-400 mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Relatórios</h4>
            <p className="text-slate-400">Gere relatórios acadêmicos e declarações em PDF</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-yellow-400 transition-colors">
            <Shield className="w-12 h-12 text-yellow-400 mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Segurança</h4>
            <p className="text-slate-400">Autenticação segura com controle de acesso por papel</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-yellow-400/10 border-t border-b border-yellow-400/20 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Pronto para começar?</h3>
          <p className="text-slate-300 mb-8">
            Acesse o portal com suas credenciais para visualizar seus dados acadêmicos
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/login")}
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold"
          >
            Fazer Login
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>© 2026 Instituto de Administração e Negócios - IAB FAPEGMA. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
