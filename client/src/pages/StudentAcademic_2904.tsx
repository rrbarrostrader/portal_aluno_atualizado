import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentAcademic() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/student")}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Informações Acadêmicas</h1>
          <p className="text-slate-600 mt-2">Grade curricular e histórico de disciplinas</p>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="grade" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="grade">Grade Curricular</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          {/* Grade Curricular */}
          <TabsContent value="grade" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Grade Curricular - Administração</CardTitle>
                <CardDescription>Disciplinas obrigatórias do curso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((semester) => (
                    <div key={semester}>
                      <h4 className="font-semibold text-slate-900 mb-3">{semester}º Semestre</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {[1, 2, 3, 4].map((subject) => (
                          <div
                            key={subject}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-yellow-400 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <BookOpen className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">
                                  Disciplina {semester}.{subject}
                                </p>
                                <p className="text-xs text-slate-500">60 horas</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico Acadêmico</CardTitle>
                <CardDescription>Disciplinas cursadas e aprovadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Disciplina</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-900">Semestre</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-900">Nota Final</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-900">Frequência</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-900">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900">Introdução à Administração</td>
                        <td className="px-4 py-3 text-center text-slate-600">1º</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-900">8.5</td>
                        <td className="px-4 py-3 text-center text-slate-600">92%</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Aprovado
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900">Contabilidade Geral</td>
                        <td className="px-4 py-3 text-center text-slate-600">1º</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-900">7.8</td>
                        <td className="px-4 py-3 text-center text-slate-600">88%</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Aprovado
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900">Matemática Financeira</td>
                        <td className="px-4 py-3 text-center text-slate-600">2º</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-900">8.2</td>
                        <td className="px-4 py-3 text-center text-slate-600">90%</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Aprovado
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900">Gestão de Pessoas</td>
                        <td className="px-4 py-3 text-center text-slate-600">2º</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-900">7.5</td>
                        <td className="px-4 py-3 text-center text-slate-600">85%</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Aprovado
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Resumo Acadêmico */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Acadêmico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600 mb-1">Disciplinas Cursadas</p>
                    <p className="text-2xl font-bold text-slate-900">8</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600 mb-1">Disciplinas Aprovadas</p>
                    <p className="text-2xl font-bold text-green-600">8</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600 mb-1">Média Geral</p>
                    <p className="text-2xl font-bold text-slate-900">8.0</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600 mb-1">Horas Cursadas</p>
                    <p className="text-2xl font-bold text-slate-900">480</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
