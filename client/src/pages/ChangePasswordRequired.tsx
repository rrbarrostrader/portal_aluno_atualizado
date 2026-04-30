import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function ChangePasswordRequired() {
  const [, setLocation] = useLocation();
  const { user, logout, refresh } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const forceChangePassword = trpc.auth.forceChangePassword.useMutation();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validações
    if (!newPassword || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }

    if (newPassword.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não correspondem");
      return;
    }

    // Validar força da senha
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /[0-9]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError(
        "A senha deve conter maiúsculas, minúsculas e números"
      );
      return;
    }

    setIsLoading(true);

    try {
      await forceChangePassword.mutateAsync({
        newPassword,
        confirmPassword,
      });

      // Sucesso - atualiza o estado de autenticação para liberar o acesso
      await refresh();
      
      // Redireciona para o dashboard
      setLocation("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao alterar senha"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-4">
              <span className="text-3xl text-slate-900">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Alterar Senha
            </h1>
            <p className="text-slate-300">
              Bem-vindo, {user?.name}! Por segurança, você precisa criar uma nova senha
              antes de acessar o portal.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-200 font-medium">{error}</p>
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Mínimo 8 caracteres, com maiúsculas, minúsculas e números
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Confirmar Senha
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                disabled={isLoading}
              />
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                <p className="text-xs font-medium text-slate-300 mb-2">
                  Requisitos da senha:
                </p>
                <ul className="text-xs space-y-1">
                  <li className={newPassword.length >= 8 ? "text-green-400" : "text-slate-500"}>
                    {newPassword.length >= 8 ? "✓" : "○"} Mínimo 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(newPassword) ? "text-green-400" : "text-slate-500"}>
                    {/[A-Z]/.test(newPassword) ? "✓" : "○"} Contém maiúsculas
                  </li>
                  <li className={/[a-z]/.test(newPassword) ? "text-green-400" : "text-slate-500"}>
                    {/[a-z]/.test(newPassword) ? "✓" : "○"} Contém minúsculas
                  </li>
                  <li className={/[0-9]/.test(newPassword) ? "text-green-400" : "text-slate-500"}>
                    {/[0-9]/.test(newPassword) ? "✓" : "○"} Contém números
                  </li>
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-slate-600 text-slate-900 font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              {isLoading ? "Alterando..." : "Alterar Senha e Continuar"}
            </button>
          </form>

          {/* Logout Link */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full text-center text-sm text-slate-400 hover:text-white transition"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
