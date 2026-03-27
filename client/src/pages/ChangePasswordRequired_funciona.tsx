import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../_core/trpc";
import { useAuth } from "../_core/hooks/useAuth";

export function ChangePasswordRequired() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

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

      // Sucesso - redireciona para o dashboard
      navigate("/");
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
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Alterar Senha
            </h1>
            <p className="text-gray-600">
              Bem-vindo, {user?.name}! Por segurança, você precisa criar uma nova senha
              antes de acessar o portal.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 8 caracteres, com maiúsculas, minúsculas e números
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                disabled={isLoading}
              />
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-2">
                  Requisitos da senha:
                </p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li className={newPassword.length >= 8 ? "text-green-600" : ""}>
                    ✓ Mínimo 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                    ✓ Contém maiúsculas
                  </li>
                  <li className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>
                    ✓ Contém minúsculas
                  </li>
                  <li className={/[0-9]/.test(newPassword) ? "text-green-600" : ""}>
                    ✓ Contém números
                  </li>
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-black font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              {isLoading ? "Alterando..." : "Alterar Senha e Continuar"}
            </button>
          </form>

          {/* Logout Link */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Sair da conta
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>💡 Dica:</strong> Escolha uma senha forte e única. Você precisará
              dela para acessar o portal no futuro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
