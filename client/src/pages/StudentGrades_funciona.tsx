import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

export default function StudentGrades() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedEnrollment, setSelectedEnrollment] = useState<number | null>(null);

  // Buscar matrículas do aluno
  const enrollmentsQuery = trpc.students.list.useQuery(undefined, {
    enabled: false, // Desabilitar por enquanto
  });

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
          <h1 className="text-3xl font-bold text-slate-900">Boletim Acadêmico</h1>
          <p className="text-slate-600 mt-2">Visualize suas notas e frequência por disciplina</p>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seletor de Semestre */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Selecione o Semestre</CardTitle>
            <CardDescription>Escolha o semestre para visualizar suas notas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((semester) => (
                <Button
                  key={semester}
                  variant={selectedEnrollment === semester ? "default" : "outline"}
                  onClick={() => setSelectedEnrollment(semester)}
                  className="w-full"
                >
                  {semester}º Semestre
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Notas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Notas por Disciplina</CardTitle>
            <CardDescription>Suas notas bimestrais e finais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Disciplina</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">1º Bim</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">2º Bim</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">3º Bim</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">4º Bim</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Média</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Prova Final</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Nota Final</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">Programação I</td>
                    <td className="px-4 py-3 text-center text-slate-600">8.5</td>
                    <td className="px-4 py-3 text-center text-slate-600">8.0</td>
                    <td className="px-4 py-3 text-center text-slate-600">8.7</td>
                    <td className="px-4 py-3 text-center text-slate-600">9.0</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">8.55</td>
                    <td className="px-4 py-3 text-center text-slate-600">--</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">8.55</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aprovado
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">Matemática</td>
                    <td className="px-4 py-3 text-center text-slate-600">7.5</td>
                    <td className="px-4 py-3 text-center text-slate-600">7.8</td>
                    <td className="px-4 py-3 text-center text-slate-600">7.2</td>
                    <td className="px-4 py-3 text-center text-slate-600">7.9</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">7.6</td>
                    <td className="px-4 py-3 text-center text-slate-600">--</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">7.6</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aprovado
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">Português</td>
                    <td className="px-4 py-3 text-center text-slate-600">6.5</td>
                    <td className="px-4 py-3 text-center text-slate-600">6.8</td>
                    <td className="px-4 py-3 text-center text-slate-600">6.2</td>
                    <td className="px-4 py-3 text-center text-slate-600">6.9</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">6.6</td>
                    <td className="px-4 py-3 text-center text-slate-600">--</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">6.6</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Atenção
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Frequência */}
        <Card>
          <CardHeader>
            <CardTitle>Frequência por Disciplina</CardTitle>
            <CardDescription>Sua presença nas aulas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Disciplina</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Total de Aulas</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Aulas Presentes</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Percentual</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">Programação I</td>
                    <td className="px-4 py-3 text-center text-slate-600">40</td>
                    <td className="px-4 py-3 text-center text-slate-600">38</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">95%</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Bom
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">Matemática</td>
                    <td className="px-4 py-3 text-center text-slate-600">40</td>
                    <td className="px-4 py-3 text-center text-slate-600">35</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">87.5%</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Bom
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">Português</td>
                    <td className="px-4 py-3 text-center text-slate-600">40</td>
                    <td className="px-4 py-3 text-center text-slate-600">30</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">75%</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Atenção
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
