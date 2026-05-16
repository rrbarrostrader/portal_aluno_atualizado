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

  // Buscar notas do aluno
  const gradesQuery = trpc.students.getMyGrades.useQuery(
    { 
      enrollmentId: selectedEnrollment || 0, 
      semester: selectedSemester 
    },
    { 
      enabled: !!selectedEnrollment && isEnrollmentReady,
      refetchOnWindowFocus: true,
    }
  );

  // Selecionar a primeira matrícula automaticamente
  useEffect(() => {
    if (enrollmentsQuery.data && enrollmentsQuery.data.length > 0 && !selectedEnrollment) {
      const firstEnrollment = enrollmentsQuery.data[0];
      setSelectedEnrollment(firstEnrollment.id);
      setSelectedSemester(firstEnrollment.currentSemester || 1);
      setIsEnrollmentReady(true);
    }
  }, [enrollmentsQuery.data, selectedEnrollment]);

  const enrollments = enrollmentsQuery.data || [];
  const grades = gradesQuery.data || [];
  const currentEnrollment = enrollments.find(e => e.id === selectedEnrollment);

  // Função para calcular média tratando strings numéricas do Postgres
  const calculateAverage = (gradeItem: any): string => {
    if (!gradeItem) return "-";

    const bim1 = gradeItem.firstBimester ? parseFloat(gradeItem.firstBimester) : null;
    const bim2 = gradeItem.secondBimester ? parseFloat(gradeItem.secondBimester) : null;
    const bim3 = gradeItem.thirdBimester ? parseFloat(gradeItem.thirdBimester) : null;
    const bim4 = gradeItem.fourthBimester ? parseFloat(gradeItem.fourthBimester) : null;

    const validGrades = [bim1, bim2, bim3, bim4].filter((g): g is number => g !== null && !isNaN(g));

    if (validGrades.length === 0) return "-";

    const average = validGrades.reduce((a, b) => a + b, 0) / validGrades.length;
    return average.toFixed(1);
  };

  const getStatusColor = (gradeItem: any) => {
    const avgStr = calculateAverage(gradeItem);
    if (avgStr === "-") return "bg-slate-100 text-slate-600";
    const avg = parseFloat(avgStr);
    if (avg >= 7) return "bg-green-100 text-green-700";
    if (avg >= 5) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getStatusText = (gradeItem: any) => {
    const avgStr = calculateAverage(gradeItem);
    if (avgStr === "-") return "Pendente";
    const avg = parseFloat(avgStr);
    if (avg >= 7) return "Aprovado";
    if (avg >= 5) return "Recuperação";
    return "Reprovado";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setLocation("/student")} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Meu Boletim</h1>
                <p className="text-sm text-slate-500">{currentEnrollment?.courseName || "Carregando..."}</p>
              </div>
            </div>
            <div className="bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200 hidden md:block">
              <span className="text-xs font-bold text-yellow-600 uppercase">RA: {currentEnrollment?.registrationNumber || "---"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Seletor de Semestre */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase text-slate-400">Semestres</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <Button
                    key={s}
                    variant={selectedSemester === s ? "default" : "outline"}
                    onClick={() => setSelectedSemester(s)}
                    className={`h-12 font-bold ${selectedSemester === s ? "bg-slate-900" : ""}`}
                  >
                    {s}º
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Notas */}
          <div className="lg:col-span-3">
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Disciplina</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-slate-400 uppercase">1º Bim</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-slate-400 uppercase">2º Bim</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-slate-400 uppercase">3º Bim</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-slate-400 uppercase">4º Bim</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-slate-400 uppercase">Média</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {gradesQuery.isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : grades.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center text-slate-400 italic">
                          Nenhuma nota lançada para este semestre.
                        </td>
                      </tr>
                    ) : (
                      grades.map((grade: any) => (
                        <tr key={grade.subjectId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{grade.subjectName}</p>
                            <p className="text-xs text-slate-400">{grade.subjectCode}</p>
                          </td>
                          <td className="px-4 py-4 text-center font-medium text-slate-600">{grade.firstBimester || "-"}</td>
                          <td className="px-4 py-4 text-center font-medium text-slate-600">{grade.secondBimester || "-"}</td>
                          <td className="px-4 py-4 text-center font-medium text-slate-600">{grade.thirdBimester || "-"}</td>
                          <td className="px-4 py-4 text-center font-medium text-slate-600">{grade.fourthBimester || "-"}</td>
                          <td className="px-4 py-4 text-center font-bold text-slate-900">{calculateAverage(grade)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(grade)}`}>
                              {getStatusText(grade)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
