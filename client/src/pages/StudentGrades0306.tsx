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

  const gradeLabels = [
    { label: 'Atividade' },
    { label: 'Avaliação' },
    { label: 'Frequência' },
    { label: 'Substitutiva' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setLocation("/student")} className="p-2 h-10 w-10 rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Meu Boletim</h1>
                <p className="text-xs md:text-sm text-slate-500 truncate max-w-[200px] md:max-w-none">
                  {currentEnrollment?.courseName || "Carregando..."}
                </p>
              </div>
            </div>
            <div className="bg-yellow-50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-yellow-200">
              <span className="text-[10px] md:text-xs font-bold text-yellow-600 uppercase tracking-tight">
                RA: {currentEnrollment?.registrationNumber || "---"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Seletor de Semestre */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-none shadow-sm rounded-2xl">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Selecione o Semestre</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 lg:grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <Button
                    key={s}
                    variant={selectedSemester === s ? "default" : "outline"}
                    onClick={() => setSelectedSemester(s)}
                    className={`h-10 md:h-12 font-bold text-sm md:text-base rounded-xl transition-all ${selectedSemester === s ? "bg-slate-900 shadow-lg shadow-slate-200" : "border-slate-100"}`}
                  >
                    {s}º
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Lista de Notas */}
          <div className="lg:col-span-3">
            {gradesQuery.isLoading ? (
              <div className="py-20 text-center bg-white rounded-3xl shadow-sm">
                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto" />
                <p className="mt-4 text-sm font-medium text-slate-400">Carregando seu boletim...</p>
              </div>
            ) : grades.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl shadow-sm border-2 border-dashed border-slate-100">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Nenhuma nota lançada para este semestre.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Versão Desktop: Tabela */}
                <Card className="hidden md:block border-none shadow-sm overflow-hidden rounded-3xl">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Disciplina</th>
                          {gradeLabels.map((item, idx) => (
                            <th key={idx} className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</th>
                          ))}
                          <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Média</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {grades.map((grade: any) => (
                          <tr key={grade.subjectId} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{grade.subjectName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{grade.subjectCode}</p>
                            </td>
                            <td className="px-4 py-4 text-center font-bold text-slate-600">{grade.firstBimester || "-"}</td>
                            <td className="px-4 py-4 text-center font-bold text-slate-600">{grade.secondBimester || "-"}</td>
                            <td className="px-4 py-4 text-center font-bold text-slate-600">{grade.thirdBimester || "-"}</td>
                            <td className="px-4 py-4 text-center font-bold text-slate-600">{grade.fourthBimester || "-"}</td>
                            <td className="px-4 py-4 text-center font-black text-slate-900">{calculateAverage(grade)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${getStatusColor(grade)}`}>
                                {getStatusText(grade)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Versão Mobile: Cards */}
                <div className="md:hidden space-y-4">
                  {grades.map((grade: any) => (
                    <Card key={grade.subjectId} className="border-none shadow-sm rounded-2xl overflow-hidden">
                      <div className="p-4 bg-white border-b border-slate-50 flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm leading-tight">{grade.subjectName}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{grade.subjectCode}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight ${getStatusColor(grade)}`}>
                          {getStatusText(grade)}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-50/50 grid grid-cols-4 gap-2">
                        {[
                          { label: "Ativ", val: grade.firstBimester },
                          { label: "Aval", val: grade.secondBimester },
                          { label: "Freq", val: grade.thirdBimester },
                          { label: "Subs", val: grade.fourthBimester }
                        ].map((b, i) => (
                          <div key={i} className="text-center bg-white p-2 rounded-xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{b.label}</p>
                            <p className="text-xs font-black text-slate-700">{b.val || "-"}</p>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-3 bg-white flex justify-between items-center border-t border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Média Final</span>
                        <span className="text-lg font-black text-slate-900">{calculateAverage(grade)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
