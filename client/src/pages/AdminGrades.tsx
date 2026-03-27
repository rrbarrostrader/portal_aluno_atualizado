import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Save, Loader2, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminGrades() {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("1");
  const [localGrades, setLocalGrades] = useState<Record<number, any>>({});

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

  // Mutation para salvar notas
  const recordGradeMutation = trpc.grades.recordGrade.useMutation({
    onSuccess: () => {
      toast.success("Nota registrada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar nota");
    }
  });

  const handleGradeChange = (enrollmentId: number, bimester: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 10) return;

    setLocalGrades(prev => ({
      ...prev,
      [enrollmentId]: {
        ...(prev[enrollmentId] || {}),
        [bimester]: numValue
      }
    }));
  };

  const handleSaveGrades = (enrollmentId: number) => {
    if (!selectedSubject) {
      toast.error("Selecione uma disciplina primeiro");
      return;
    }

    const studentGrades = localGrades[enrollmentId];
    if (!studentGrades) {
      toast.error("Nenhuma nota alterada para este aluno");
      return;
    }

    recordGradeMutation.mutate({
      enrollmentId,
      subjectId: parseInt(selectedSubject),
      semester: parseInt(selectedSemester),
      ...studentGrades
    });
  };

  const courses = coursesQuery.data || [];
  const subjects = subjectsQuery.data || [];
  const students = studentsQuery.data || [];

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
                      {subject.name}
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
              <CardDescription>Insira as notas bimestrais para cada aluno</CardDescription>
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-slate-700">Nome do Aluno</th>
                    <th className="px-4 py-4 text-center font-bold text-slate-700">1º Bim</th>
                    <th className="px-4 py-4 text-center font-bold text-slate-700">2º Bim</th>
                    <th className="px-4 py-4 text-center font-bold text-slate-700">3º Bim</th>
                    <th className="px-4 py-4 text-center font-bold text-slate-700">4º Bim</th>
                    <th className="px-6 py-4 text-right font-bold text-slate-700">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-xs text-slate-500">{student.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          autoComplete="off"
                          className="w-20 mx-auto text-center font-medium focus:ring-yellow-400"
                          onChange={(e) => handleGradeChange(student.enrollmentId, "firstBimester", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          autoComplete="off"
                          className="w-20 mx-auto text-center font-medium focus:ring-yellow-400"
                          onChange={(e) => handleGradeChange(student.enrollmentId, "secondBimester", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          autoComplete="off"
                          className="w-20 mx-auto text-center font-medium focus:ring-yellow-400"
                          onChange={(e) => handleGradeChange(student.enrollmentId, "thirdBimester", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          autoComplete="off"
                          className="w-20 mx-auto text-center font-medium focus:ring-yellow-400"
                          onChange={(e) => handleGradeChange(student.enrollmentId, "fourthBimester", e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSaveGrades(student.enrollmentId)}
                          disabled={recordGradeMutation.isPending || !localGrades[student.enrollmentId]}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold"
                        >
                          {recordGradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                          Salvar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
