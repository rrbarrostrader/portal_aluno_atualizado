import AdminStudents from "./AdminStudents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Configurações do Portal</h2>
      
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-white border p-1 h-auto">
          <TabsTrigger value="users" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 px-6 py-2">
            <Users className="w-4 h-4 mr-2" />
            Cadastro de Usuários
          </TabsTrigger>
          <TabsTrigger value="general" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 px-6 py-2">
            <Settings className="w-4 h-4 mr-2" />
            Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <AdminStudents />
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>Ajustes globais do sistema e identidade visual.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 italic">Módulo em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
