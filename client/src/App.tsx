import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import StudentGrades from "./pages/StudentGrades";
import StudentSecretaria from "./pages/StudentSecretaria";
import StudentAcademic from "./pages/StudentAcademic";
import AdminDashboard from "./pages/AdminDashboard";
import { ChangePasswordRequired } from "./pages/ChangePasswordRequired";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function ProtectedRoute({
  component: Component,
  requiredRole,
}: {
  component: React.ComponentType<any>;
  requiredRole?: "admin" | "user";
}) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user && !user.firstLoginCompleted) {
      // Se o usuário não completou o primeiro acesso, redireciona para trocar senha
      setLocation("/change-password-required");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Se o usuário precisa trocar a senha, não renderiza o componente original
  if (!user.firstLoginCompleted) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/change-password-required"} component={ChangePasswordRequired} />
      
      {/* Rotas do Aluno */}
      <Route
        path={"/student"}
        component={() => <ProtectedRoute component={StudentDashboard} requiredRole="user" />}
      />
      <Route
        path={"/student/boletim"}
        component={() => <ProtectedRoute component={StudentGrades} requiredRole="user" />}
      />
      <Route
        path={"/student/secretaria"}
        component={() => <ProtectedRoute component={StudentSecretaria} requiredRole="user" />}
      />
      <Route
        path={"/student/academico"}
        component={() => <ProtectedRoute component={StudentAcademic} requiredRole="user" />}
      />
      
      {/* Rotas do Admin */}
      <Route
        path={"/admin"}
        component={() => <ProtectedRoute component={AdminDashboard} requiredRole="admin" />}
      />
      <Route
        path={"/admin/*"}
        component={() => <ProtectedRoute component={AdminDashboard} requiredRole="admin" />}
      />
      
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
