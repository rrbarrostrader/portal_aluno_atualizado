import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import StudentGrades from "./pages/StudentGrades";
import StudentSecretaria from "./pages/StudentSecretaria";
import StudentAcademic from "./pages/StudentAcademic";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({
  component: Component,
  requiredRole,
}: {
  component: React.ComponentType<any>;
  requiredRole?: "admin" | "user";
}) {
  const { user, loading } = useAuth();

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
      
      {/* Rotas do Admin - CORRIGIDAS: ambas as versões */}
      <Route
        path={"/admin"}
        component={() => <ProtectedRoute component={AdminDashboard} requiredRole="admin" />}
      />
      <Route
        path={"/admin/*"}
        component={() => <ProtectedRoute component={AdminDashboard} requiredRole="admin" />}
      />
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
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