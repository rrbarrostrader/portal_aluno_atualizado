import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Save, Loader2, Search, UserCheck, ChevronDown, ChevronUp, AlertCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function AdminGrades() {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
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

  // Encontrar a disciplina selecionada para saber o semestre dela
  const currentSubject = subjectsQuery.data?.find(s => s.id.toString() === selectedSubject);
  const selectedSemester = currentSubject?.semester || 1;

  // Query para buscar notas existentes
  const existingGradesQuery = trpc.grades.getGradesBySubjectAndSemester.useQuery(
    { 
      subjectId: parseInt(selectedSubject) || 0,
      semester: selectedSemester
    },
    { enabled: !!selectedSubject }
  );

  // Mutation para salvar notas
  const recordGradeMutation = trpc.grades.recordGrade.useMutation({
    onSuccess: () => {
      toast.success("Nota registrada com sucesso!");
      setLocalGrades({});
      setIsSaving(false);
      existingGradesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar nota");
      setIsSaving(false);
    }
  });

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
      semester: selectedSemester,
      firstBimester: studentGrades.firstBimester,
      secondBimester: studentGrades.secondBimester,
      thirdBimester: studentGrades.thirdBimester,
      fourthBimester: studentGrades.fourthBimester,
    });
  };

  const courses = coursesQuery.data || [];
  const subjects = subjectsQuery.data || [];
  const students = studentsQuery.data || [];

  // Organizar disciplinas por semestre para o seletor
  const subjectsBySemester: Record<number, any[]> = {};
  subjects.forEach(s => {
    const sem = s.semester || 1;
    if (!subjectsBySemester[sem]) subjectsBySemester[sem] = [];
    subjectsBySemester[sem].push(s);
  });

  const getDisplayGrade = (enrollmentId: number, bimester: string) => {
    const localGrade = localGrades[enrollmentId]?.[bimester];
    if (localGrade !== undefined && localGrade !== null) return localGrade.toString();
    
    const existingGrade = existingGrades[enrollmentId]?.[bimester];
    if (existingGrade !== undefined && existingGrade !== null) return existingGrade.toString();
    
    return "";
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-yellow-500" />
            Lançamento de Notas
          </h2>
          <p className="text-slate-600 mt-1">As disciplinas são organizadas automaticamente pelo semestre cadastrado</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            Seleção de Curso e Disciplina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">1. Selecione o Curso</label>
              <Select value={selectedCourse} onValueChange={(val) => { setSelectedCourse(val); setSelectedSubject(""); }}>
                <SelectTrigger className="bg-white h-11">
                  <SelectValue placeholder="Escolha um curso..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">2. Selecione a Disciplina (Organizada por Semestre)</label>
              <Select 
                value={selectedSubject} 
                onValueChange={setSelectedSubject}
                disabled={!selectedCourse || subjectsQuery.isLoading}
              >
                <SelectTrigger className="bg-white h-11">
                  <SelectValue placeholder={subjectsQuery.isLoading ? "Carregando..." : "Escolha a disciplina..."} />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(subjectsBySemester).sort((a, b) => Number(a) - Number(b)).map(sem => (
                    <div key={sem}>
                      <div className="px-2 py-1.5 text-[10px] font-black text-slate-400 uppercase bg-slate-50 tracking-widest">
                        {sem}º Semestre
                      </div>
                      {subjectsBySemester[Number(sem)].map(subject => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </div>
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
              <CardTitle className="text-lg">Alunos do Curso</CardTitle>
              <CardDescription>
                {selectedSubject ? (
                  <span className="text-blue-600 font-medium">
                    Lançando notas para: {currentSubject?.name} ({selectedSemester}º Semestre)
                  </span>
                ) : (
                  "Selecione uma disciplina para começar o lançamento"
                )}
              </CardDescription>
            </div>
            {selectedCourse && (
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <UserCheck className="w-4 h-4" />
                {students.length} Alunos
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedSubject ? (
            <div className="text-center py-20 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Selecione uma disciplina acima para listar os alunos e lançar as notas</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum aluno matriculado neste curso</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {students.map((student) => (
                <div key={student.id} className="bg-white">
                  <button
                    onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                    className="w-full px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-left"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-500">RA: {student.registrationNumber || student.id}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {existingGrades[student.enrollmentId] && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Notas Lançadas
                        </span>
                      )}
                      {expandedStudent === student.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </button>

                  {expandedStudent === student.id && (
                    <div className="px-6 py-6 bg-slate-50 border-t border-slate-100">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase">Avaliação</label>
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={getDisplayGrade(student.enrollmentId, "firstBimester")}
                            onChange={(e) => handleGradeChange(student.enrollmentId, "firstBimester", e.target.value)}
                            className="bg-white border-slate-300 h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase">Trabalho</label>
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={getDisplayGrade(student.enrollmentId, "secondBimester")}
                            onChange={(e) => handleGradeChange(student.enrollmentId, "secondBimester", e.target.value)}
                            className="bg-white border-slate-300 h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase">Frequência</label>
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={getDisplayGrade(student.enrollmentId, "thirdBimester")}
                            onChange={(e) => handleGradeChange(student.enrollmentId, "thirdBimester", e.target.value)}
                            className="bg-white border-slate-300 h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase">Substitutiva</label>
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={getDisplayGrade(student.enrollmentId, "fourthBimester")}
                            onChange={(e) => handleGradeChange(student.enrollmentId, "fourthBimester", e.target.value)}
                            className="bg-white border-slate-300 h-10"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-10 font-bold"
                            onClick={() => handleSaveGrades(student.enrollmentId)}
                            disabled={isSaving}
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
