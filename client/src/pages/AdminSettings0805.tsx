import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettings() {
  return (
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
  );
}
