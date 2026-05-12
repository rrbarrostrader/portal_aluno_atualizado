import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, BookOpen, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function StudentGrades() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedEnrollment, setSelectedEnrollment] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [isEnrollmentReady, setIsEnrollmentReady] = useState(false);

  // Buscar matrículas do aluno
  const enrollmentsQuery = trpc.students.getMyEnrollments.useQuery();
  const currentEnrollment = enrollmentsQuery.data?.find(e => e.id === selectedEnrollment);

  // Buscar semestres disponíveis para o curso selecionado
  const semestersQuery = trpc.students.getCourseSemesters.useQuery(
    { courseId: currentEnrollment?.courseId || 0 },
    { enabled: !!currentEnrollment }
  );

  // Buscar notas e disciplinas do semestre selecionado
  const gradesQuery = trpc.students.getMyGrades.useQuery(
    { 
      enrollmentId: selectedEnrollment || 0, 
      semester: selectedSemester 
    },
    { 
      enabled: !!selectedEnrollment && isEnrollmentReady,
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  );

  // Selecionar a primeira matrícula e o semestre atual automaticamente
  useEffect(() => {
    if (enrollmentsQuery.data && enrollmentsQuery.data.length > 0 && !selectedEnrollment) {
      const firstEnrollment = enrollmentsQuery.data[0];
      setSelectedEnrollment(firstEnrollment.id);
      setSelectedSemester(firstEnrollment.currentSemester || 1);
      setIsEnrollmentReady(true);
    }
  }, [enrollmentsQuery.data, selectedEnrollment]);

  // Atualizar semestre quando os semestres disponíveis carregarem (se o atual não existir)
  useEffect(() => {
    if (semestersQuery.data && semestersQuery.data.length > 0) {
      if (!semestersQuery.data.includes(selectedSemester)) {
        setSelectedSemester(semestersQuery.data[0]);
      }
    }
  }, [semestersQuery.data]);

  const enrollments = enrollmentsQuery.data || [];
  const grades = gradesQuery.data || [];
  const availableSemesters = semestersQuery.data || [];

  const calculateAverage = (gradeItem: any): string => {
    try {
      if (!gradeItem) return "-";
      const bim1 = parseFloat(gradeItem.firstBimester) || 0;
      const bim2 = parseFloat(gradeItem.secondBimester) || 0;
      const bim3 = parseFloat(gradeItem.thirdBimester) || 0;
      const bim4 = parseFloat(gradeItem.fourthBimester) || 0;
      const validGrades = [bim1, bim2, bim3, bim4].filter(g => g > 0);
      if (validGrades.length === 0) return "-";
      const average = validGrades.reduce((a, b) => a + b, 0) / validGrades.length;
      return average.toFixed(1);
    } catch {
      return "-";
    }
  };

  const getAverageColor = (gradeItem: any): string => {
    const avg = parseFloat(calculateAverage(gradeItem));
    if (isNaN(avg)) return "text-slate-300";
    if (avg >= 7) return "text-green-600";
    if (avg >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setLocation("/student")} className="p-2 hover:bg-slate-100 rounded-full">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Boletim Acadêmico</h1>
                <p className="text-slate-500 font-medium">Acompanhe seu desempenho escolar</p>
              </div>
            </div>
            {currentEnrollment && (
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Curso Atual</p>
                <p className="text-lg font-black text-yellow-600">{currentEnrollment.courseName}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {enrollmentsQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
            <p className="text-slate-500 font-bold">Carregando suas informações...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <GraduationCap className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-slate-900">Nenhuma matrícula encontrada</h3>
              <p className="text-slate-500">Você ainda não possui matrículas ativas no sistema.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="border-none shadow-sm lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Suas Matrículas</CardTitle>
                  <CardDescription>Selecione o curso desejado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {enrollments.map((enrollment) => (
                    <button
                      key={enrollment.id}
                      onClick={() => {
                        setSelectedEnrollment(enrollment.id);
                        setSelectedSemester(enrollment.currentSemester || 1);
                        setIsEnrollmentReady(true);
                      }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedEnrollment === enrollment.id ? "border-yellow-400 bg-yellow-50 shadow-sm" : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <p className={`font-bold ${selectedEnrollment === enrollment.id ? "text-yellow-900" : "text-slate-700"}`}>{enrollment.courseName}</p>
                      <p className="text-xs text-slate-500 mt-1">RA: {enrollment.registrationNumber || "N/A"}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Semestre Letivo</CardTitle>
                  <CardDescription>Escolha o período para visualizar as notas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {semestersQuery.isLoading ? (
                      <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                    ) : availableSemesters.length > 0 ? (
                      availableSemesters.map((semester) => (
                        <Button
                          key={semester}
                          variant={selectedSemester === semester ? "default" : "outline"}
                          onClick={() => {
                            setSelectedSemester(semester);
                            setIsEnrollmentReady(true);
                          }}
                          className={`h-12 px-6 font-bold rounded-xl ${
                            selectedSemester === semester ? "bg-slate-900 text-white hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {semester}º Semestre
                        </Button>
                      ))
                    ) : (
                      <p className="text-slate-400 italic">Nenhum semestre com disciplinas cadastradas.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b border-slate-100 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black text-slate-900">Notas e Desempenho</CardTitle>
                    <CardDescription>Detalhamento por disciplina no {selectedSemester}º semestre</CardDescription>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-2xl text-yellow-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {gradesQuery.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-2" />
                    <p className="text-slate-500 font-medium">Buscando notas...</p>
                  </div>
                ) : grades.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-slate-400 italic">Nenhuma disciplina encontrada para o {selectedSemester}º semestre.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider">Disciplina</th>
                          <th className="px-4 py-4 text-center font-bold text-slate-500 uppercase tracking-wider">Avaliação</th>
                          <th className="px-4 py-4 text-center font-bold text-slate-500 uppercase tracking-wider">Trabalho</th>
                          <th className="px-4 py-4 text-center font-bold text-slate-500 uppercase tracking-wider">Frequência</th>
                          <th className="px-4 py-4 text-center font-bold text-slate-500 uppercase tracking-wider">Substitutiva</th>
                          <th className="px-4 py-4 text-center font-bold text-slate-500 uppercase tracking-wider">Média Final</th>
                          <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {grades.map((item: any, index: number) => {
                          const displayAvg = calculateAverage(item);
                          const avgColor = getAverageColor(item);
                          return (
                            <tr key={`grade-${index}-${item.subjectId}`} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-5">
                                <p className="font-black text-slate-900">{item.subjectName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.subjectCode}</p>
                              </td>
                              <td className="px-4 py-5 text-center font-bold text-slate-600">{item.firstBimester ?? "-"}</td>
                              <td className="px-4 py-5 text-center font-bold text-slate-600">{item.secondBimester ?? "-"}</td>
                              <td className="px-4 py-5 text-center font-bold text-slate-600">{item.thirdBimester ?? "-"}</td>
                              <td className="px-4 py-5 text-center font-bold text-slate-600">{item.fourthBimester ?? "-"}</td>
                              <td className="px-4 py-5 text-center">
                                <span className={`text-lg font-black ${avgColor}`}>{displayAvg}</span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  item.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                  item.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {item.status === 'approved' ? 'Aprovado' : item.status === 'failed' ? 'Reprovado' : 'Em Curso'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
