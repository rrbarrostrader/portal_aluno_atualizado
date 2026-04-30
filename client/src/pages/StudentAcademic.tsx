import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";

export default function StudentAcademic() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedEnrollment, setSelectedEnrollment] = useState<number | null>(null);

  // Buscar matrículas do aluno
  const enrollmentsQuery = trpc.students.getMyEnrollments.useQuery();

  // Buscar disciplinas do curso
  const subjectsQuery = trpc.courses.listSubjects.useQuery(
    { courseId: selectedEnrollment ? enrollmentsQuery.data?.find(e => e.id === selectedEnrollment)?.courseId || 0 : 0 },
    { enabled: !!selectedEnrollment && !!enrollmentsQuery.data }
  );

  // Buscar notas de todos os semestres para histórico
  const gradesQuery = trpc.students.getMyGrades.useQuery(
    { enrollmentId: selectedEnrollment || 0, semester: 1 },
    { enabled: !!selectedEnrollment }
  );

  // Selecionar a primeira matrícula automaticamente
  useEffect(() => {
    if (enrollmentsQuery.data && enrollmentsQuery.data.length > 0 && !selectedEnrollment) {
      setSelectedEnrollment(enrollmentsQuery.data[0].id);
    }
  }, [enrollmentsQuery.data, selectedEnrollment]);

  const enrollments = enrollmentsQuery.data || [];
  const subjects = subjectsQuery.data || [];
  const grades = gradesQuery.data || [];
  const currentEnrollment = enrollments.find(e => e.id === selectedEnrollment);

  // Agrupar disciplinas por semestre
  const subjectsBySemester = subjects.reduce((acc, subject) => {
    const semester = subject.semester || 1;
    if (!acc[semester]) {
      acc[semester] = [];
    }
    acc[semester].push(subject);
    return acc;
  }, {} as Record<number, any[]>);

  // Calcular resumo acadêmico
  const totalSubjects = subjects.length;
  const approvedSubjects = grades.filter(g => g.status === 'approved').length;
  const averageGrade = grades.length > 0 
    ? (grades.reduce((sum, g) => sum + (g.finalGrade || 0), 0) / grades.length).toFixed(1)
    : "0.0";
  const totalHours = subjects.reduce((sum, s) => sum + (s.workload || 0), 0);

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
        {enrollmentsQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
            <p className="text-slate-500 font-bold">Carregando informações acadêmicas...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <BookOpen className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-slate-900">Nenhuma matrícula encontrada</h3>
              <p className="text-slate-500">Você ainda não possui matrículas ativas no sistema.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Seletor de Matrícula */}
            {enrollments.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selecione a Matrícula</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {enrollments.map((enrollment) => (
                      <button
                        key={enrollment.id}
                        onClick={() => setSelectedEnrollment(enrollment.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedEnrollment === enrollment.id
                            ? "bg-yellow-400 text-slate-900"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {enrollment.courseName}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="grade" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="grade">Grade Curricular</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              {/* Grade Curricular */}
              <TabsContent value="grade" className="space-y-6">
                {subjectsQuery.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-2" />
                    <p className="text-slate-500">Carregando grade curricular...</p>
                  </div>
                ) : subjects.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-20">
                      <BookOpen className="w-12 h-12 text-slate-200 mb-4" />
                      <p className="text-slate-500">Nenhuma disciplina cadastrada para este curso.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(subjectsBySemester)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([semester, semesterSubjects]) => (
                        <Card key={semester}>
                          <CardHeader>
                            <CardTitle>{parseInt(semester)}º Semestre</CardTitle>
                            <CardDescription>{semesterSubjects.length} disciplinas</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {semesterSubjects.map((subject) => (
                                <div
                                  key={subject.id}
                                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-yellow-400 transition-colors"
                                >
                                  <div className="flex items-start gap-2">
                                    <BookOpen className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="font-medium text-slate-900">
                                        {subject.name}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        Código: {subject.code} • {subject.workload || 0} horas
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>

              {/* Histórico */}
              <TabsContent value="history" className="space-y-6">
                {gradesQuery.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-2" />
                    <p className="text-slate-500">Carregando histórico...</p>
                  </div>
                ) : (
                  <>
                    {/* Resumo Acadêmico */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Resumo Acadêmico</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Disciplinas Cadastradas</p>
                            <p className="text-2xl font-bold text-slate-900">{totalSubjects}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Disciplinas Aprovadas</p>
                            <p className="text-2xl font-bold text-green-600">{approvedSubjects}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Média Geral</p>
                            <p className="text-2xl font-bold text-slate-900">{averageGrade}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Horas Cursadas</p>
                            <p className="text-2xl font-bold text-slate-900">{totalHours}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tabela de Histórico */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Histórico Acadêmico</CardTitle>
                        <CardDescription>Disciplinas cursadas e notas finais</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {grades.length === 0 ? (
                          <div className="text-center py-8 text-slate-500">
                            Nenhuma nota registrada ainda.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Disciplina</th>
                                  <th className="px-4 py-3 text-center font-semibold text-slate-900">Nota Final</th>
                                  <th className="px-4 py-3 text-center font-semibold text-slate-900">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {grades.map((grade, index) => (
                                  <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-900">
                                      <p className="font-medium">{grade.subjectName}</p>
                                      <p className="text-xs text-slate-500">{grade.subjectCode}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center font-semibold text-slate-900">
                                      {grade.finalGrade ? grade.finalGrade.toFixed(1) : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {grade.status ? (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          grade.status === 'approved' ? 'bg-green-100 text-green-800' :
                                          grade.status === 'failed' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {grade.status === 'approved' ? 'Aprovado' : grade.status === 'failed' ? 'Reprovado' : 'Em Curso'}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                          Pendente
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
