import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, BookOpen, GraduationCap, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { toast } from "sonner";

export default function TeacherGrades() {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  const { data: courses = [] } = trpc.courses.list.useQuery();
  const { data: allSubjects = [] } = trpc.courses.listAllSubjects.useQuery();
  
  const filteredSubjects = allSubjects.filter(s => 
    s.courseId === selectedCourse && s.semester === selectedSemester
  );

  const { data: studentsGrades = [], isLoading: isLoadingGrades, refetch } = trpc.grades.getBatchGrades.useQuery(
    { courseId: selectedCourse || 0, subjectId: selectedSubject || 0, semester: selectedSemester },
    { enabled: !!selectedCourse && !!selectedSubject }
  );

  const recordGradeMutation = trpc.grades.recordGrade.useMutation({
    onSuccess: () => { toast.success("Nota salva com sucesso!"); },
    onError: (err) => { toast.error("Erro ao salvar: " + err.message); }
  });

  const handleGradeChange = async (enrollmentId: number, field: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value.replace(',', '.'));
    if (numValue !== null && (numValue < 0 || numValue > 10)) return toast.error("Nota entre 0 e 10");

    recordGradeMutation.mutate({
      enrollmentId,
      subjectId: selectedSubject!,
      semester: selectedSemester,
      [field]: numValue
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Portal do Professor</h2>
        <p className="text-slate-500">Lançamento de notas e acompanhamento de turmas</p>
      </div>

      <Card className="border-none shadow-sm bg-slate-900 text-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">Curso</label>
              <select className="w-full p-2 border rounded-md bg-slate-800 border-slate-700 text-white" value={selectedCourse || ""} onChange={(e) => { setSelectedCourse(Number(e.target.value)); setSelectedSubject(null); }}>
                <option value="">Selecione o curso</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">Semestre</label>
              <select className="w-full p-2 border rounded-md bg-slate-800 border-slate-700 text-white" value={selectedSemester} onChange={(e) => { setSelectedSemester(Number(e.target.value)); setSelectedSubject(null); }}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}º Semestre</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">Disciplina</label>
              <select className="w-full p-2 border rounded-md bg-slate-800 border-slate-700 text-white" disabled={!selectedCourse} value={selectedSubject || ""} onChange={(e) => setSelectedSubject(Number(e.target.value))}>
                <option value="">Selecione a disciplina</option>
                {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCourse && selectedSubject ? (
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-white border-b flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-lg">Grade de Alunos</CardTitle>
              <CardDescription>Clique no campo para editar a nota</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}><Loader2 className={`w-4 h-4 mr-2 ${isLoadingGrades ? 'animate-spin' : ''}`} /> Atualizar</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-4">Aluno</th>
                    <th className="px-4 py-4 text-center">1º Bim</th>
                    <th className="px-4 py-4 text-center">2º Bim</th>
                    <th className="px-4 py-4 text-center">3º Bim</th>
                    <th className="px-4 py-4 text-center">4º Bim</th>
                    <th className="px-4 py-4 text-center bg-slate-100">Média</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentsGrades.map((row) => {
                    const grades = [row.firstBimester, row.secondBimester, row.thirdBimester, row.fourthBimester].filter(g => g !== null) as number[];
                    const average = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2) : "-";
                    return (
                      <tr key={row.enrollmentId} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">{row.studentName}</td>
                        {["firstBimester", "secondBimester", "thirdBimester", "fourthBimester"].map((field) => (
                          <td key={field} className="px-4 py-4">
                            <Input 
                              className="w-16 mx-auto text-center font-bold border-slate-200 focus:border-yellow-400"
                              defaultValue={row[field as keyof typeof row] ?? ""}
                              onBlur={(e) => handleGradeChange(row.enrollmentId, field, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="px-4 py-4 text-center font-black text-slate-900 bg-slate-50">{average}</td>
                        <td className="px-6 py-4 text-center">
                          {Number(average) >= 7 ? <span className="text-green-600 font-bold">Aprovado</span> : <span className="text-amber-600 font-bold">Pendente</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Selecione os filtros acima para lançar as notas.</p>
        </div>
      )}
    </div>
  );
}
