import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Chamada direta à API REST
      const response = await fetch("/api/trpc/auth.loginWithEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: {
            email,
            password,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao fazer login");
      }

      const data = await response.json();
      
      // Verificar se a resposta contém o resultado esperado
      if (data.result && data.result.data) {
        const user = data.result.data;
        toast.success("Login realizado com sucesso!");
        
        // Redireciona para o dashboard apropriado
        if (user.role === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/student");
        }
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao fazer login";
      toast.error(message);
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo e Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-4">
            <span className="text-2xl font-bold text-slate-900">IAB</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Portal Acadêmico</h1>
          <p className="text-slate-300 mt-2">IAB FAPEGMA</p>
        </div>

        {/* Formulário de Login */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Faça seu Login</CardTitle>
            <CardDescription className="text-slate-400">
              Digite suas credenciais para acessar o portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">E-mail</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Senha</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400 text-center">
                Credenciais padrão para admin:
                <br />
                <span className="text-slate-300 font-mono">admin@iabfapgema.com.br</span>
                <br />
                <span className="text-slate-300 font-mono">IAB_@2026_START</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>© 2026 IAB FAPEGMA. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
