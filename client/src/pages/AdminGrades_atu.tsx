import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Save, Loader2, Search, UserCheck, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminGrades() {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("1");
  const [localGrades, setLocalGrades] = useState<Record<number, any>>({});
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [existingGrades, setExistingGrades] = useState<Record<number, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const coursesQuery = trpc.courses.list.useQuery();
  const subjectsQuery = trpc.courses.listSubjects.useQuery(
    { courseId: parseInt(selectedCourse) },
    { enabled: !!selectedCourse }
  );
  const studentsQuery = trpc.courses.listStudentsByCourse.useQuery(
    { courseId: parseInt(selectedCourse) },
    { enabled: !!selectedCourse }
  );

  // Query para buscar notas existentes - REFETCH quando disciplina ou semestre mudam
  const existingGradesQuery = trpc.grades.getGradesBySubjectAndSemester.useQuery(
    { 
      subjectId: parseInt(selectedSubject) || 0,
      semester: parseInt(selectedSemester)
    },
    { enabled: !!selectedSubject }
  );

  // Mutation para salvar notas
  const recordGradeMutation = trpc.grades.recordGrade.useMutation({
    onSuccess: () => {
      toast.success("Nota registrada com sucesso!");
      setLocalGrades({});
      setIsSaving(false);
      // Recarregar notas existentes
      existingGradesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar nota");
      setIsSaving(false);
    }
  });

  // Atualizar notas existentes quando a query retorna dados
  useEffect(() => {
    if (existingGradesQuery.data && Array.isArray(existingGradesQuery.data)) {
      const gradesMap: Record<number, any> = {};
      existingGradesQuery.data.forEach((grade: any) => {
        gradesMap[grade.enrollmentId] = {
          firstBimester: grade.firstBimester ? Number(grade.firstBimester) : null,
          secondBimester: grade.secondBimester ? Number(grade.secondBimester) : null,
          thirdBimester: grade.thirdBimester ? Number(grade.thirdBimester) : null,
          fourthBimester: grade.fourthBimester ? Number(grade.fourthBimester) : null,
          id: grade.id
        };
      });
      setExistingGrades(gradesMap);
    }
  }, [existingGradesQuery.data]);

  const handleGradeChange = (enrollmentId: number, bimester: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    if (numValue !== null && (isNaN(numValue) || numValue < 0 || numValue > 10)) {
      toast.error("Nota deve estar entre 0 e 10");
      return;
    }

    setLocalGrades(prev => ({
      ...prev,
      [enrollmentId]: {
        ...(prev[enrollmentId] || {}),
        [bimester]: numValue
      }
    }));
  };

  const handleSaveGrades = async (enrollmentId: number) => {
    if (!selectedSubject) {
      toast.error("Selecione uma disciplina primeiro");
      return;
    }

    const studentGrades = localGrades[enrollmentId];
    if (!studentGrades || Object.keys(studentGrades).length === 0) {
      toast.error("Nenhuma nota alterada para este aluno");
      return;
    }

    setIsSaving(true);
    recordGradeMutation.mutate({
      enrollmentId,
      subjectId: parseInt(selectedSubject),
      semester: parseInt(selectedSemester),
      firstBimester: studentGrades.firstBimester,
      secondBimester: studentGrades.secondBimester,
      thirdBimester: studentGrades.thirdBimester,
      fourthBimester: studentGrades.fourthBimester,
    });
  };

  const courses = coursesQuery.data || [];
  const subjects = subjectsQuery.data || [];
  const students = studentsQuery.data || [];

  // Função para verificar se o aluno já tem notas lançadas
  const hasExistingGrades = (enrollmentId: number) => {
    return !!existingGrades[enrollmentId];
  };

  // Função para obter nota a ser exibida (existente ou local)
  const getDisplayGrade = (enrollmentId: number, bimester: string) => {
    // Primeiro verifica se há uma alteração local
    const localGrade = localGrades[enrollmentId]?.[bimester];
    if (localGrade !== undefined && localGrade !== null) {
      return localGrade.toString();
    }
    
    // Se não há alteração local, retorna a nota existente
    const existingGrade = existingGrades[enrollmentId]?.[bimester];
    if (existingGrade !== undefined && existingGrade !== null) {
      return existingGrade.toString();
    }
    
    // Se não há nada, retorna string vazia
    return "";
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-yellow-500" />
            Lançamento de Notas
          </h2>
          <p className="text-slate-600 mt-1">Gerencie as notas dos alunos por curso e disciplina</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            Filtros de Seleção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Curso</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Disciplina</label>
              <Select 
                value={selectedSubject} 
                onValueChange={setSelectedSubject}
                disabled={!selectedCourse || subjectsQuery.isLoading}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={subjectsQuery.isLoading ? "Carregando..." : "Selecione uma disciplina"} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Semestre</label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione o semestre" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <SelectItem key={s} value={s.toString()}>{s}º Semestre</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Notas */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Alunos Matriculados</CardTitle>
              <CardDescription>Clique no nome do aluno para lançar notas</CardDescription>
            </div>
            {selectedCourse && (
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <UserCheck className="w-4 h-4" />
                {students.length} Alunos encontrados
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedCourse ? (
            <div className="text-center py-20 text-slate-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Selecione um curso para listar os alunos</p>
            </div>
          ) : studentsQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-2" />
              <p className="text-slate-500">Buscando alunos...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum aluno matriculado neste curso</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {students.map((student) => {
                const hasGrades = hasExistingGrades(student.enrollmentId);
                
                return (
                  <div key={student.id}>
                    <button
                      onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                      className="w-full px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-left"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-xs text-slate-500">{student.email} • RA: {student.registrationNumber || "-"}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {hasGrades && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Notas Lançadas
                          </span>
                        )}
                        {expandedStudent === student.id ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {expandedStudent === student.id && (
                      <div className="bg-slate-50/50 px-6 py-6 border-t border-slate-100">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                              Lançamento de Notas - {selectedSemester}º Semestre
                            </h4>
                            {hasGrades && (
                              <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                ✓ Notas já existem - Você está editando
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { key: "firstBimester", label: "AVALIAÇÃO" },
                              { key: "secondBimester", label: "TRABALHO" },
                              { key: "thirdBimester", label: "FREQUÊNCIA" },
                              { key: "fourthBimester", label: "SUBSTITUTIVA" }
                            ].map((field) => (
                              <div key={field.key} className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.5"
                                  placeholder="0-10"
                                  value={getDisplayGrade(student.enrollmentId, field.key)}
                                  onChange={(e) => handleGradeChange(student.enrollmentId, field.key, e.target.value)}
                                  className="bg-white border-slate-300 font-bold text-lg h-12"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setLocalGrades(prev => {
                                  const newGrades = { ...prev };
                                  delete newGrades[student.enrollmentId];
                                  return newGrades;
                                });
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleSaveGrades(student.enrollmentId)}
                              disabled={isSaving || recordGradeMutation.isPending}
                            >
                              {isSaving || recordGradeMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Salvando...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  Salvar Notas
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
