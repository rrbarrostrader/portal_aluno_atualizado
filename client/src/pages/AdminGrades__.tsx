import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function AdminGrades() {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [localGrades, setLocalGrades] = useState<Record<number, any>>({});

  const { data: courses = [] } = trpc.courses.list.useQuery();
  const { data: allSubjects = [] } = trpc.courses.listAllSubjects.useQuery();
  
  const filteredSubjects = allSubjects.filter(s => 
    s.courseId === selectedCourse && s.semester === selectedSemester
  );

  const { data: studentsGrades = [], isLoading: isLoadingGrades, refetch } = trpc.grades.getBatchGrades.useQuery(
    { courseId: selectedCourse || 0, subjectId: selectedSubject || 0, semester: selectedSemester },
    { 
      enabled: !!selectedCourse && !!selectedSubject,
      onSuccess: (data) => {
        const initial: Record<number, any> = {};
        data.forEach(row => {
          initial[row.enrollmentId] = {
            firstBimester: row.firstBimester,
            secondBimester: row.secondBimester,
            thirdBimester: row.thirdBimester,
            fourthBimester: row.fourthBimester,
          };
        });
        setLocalGrades(initial);
      }
    }
  );

  const recordGradeMutation = trpc.grades.recordGrade.useMutation();

  const handleLocalChange = (enrollmentId: number, field: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value.replace(',', '.'));
    setLocalGrades(prev => ({
      ...prev,
      [enrollmentId]: { ...prev[enrollmentId], [field]: numValue }
    }));
  };

  const handleSaveAll = async () => {
    if (!selectedSubject) return;
    try {
      toast.info("Salvando notas...");
      for (const [enrollmentId, grades] of Object.entries(localGrades)) {
        await recordGradeMutation.mutateAsync({
          enrollmentId: Number(enrollmentId),
          subjectId: selectedSubject,
          semester: selectedSemester,
          firstBimester: grades.firstBimester,
          secondBimester: grades.secondBimester,
          thirdBimester: grades.thirdBimester,
          fourthBimester: grades.fourthBimester,
        });
      }
      toast.success("Notas salvas com sucesso!");
      refetch();
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    }
  };

  const calculateAverage = (grades: any) => {
    if (!grades) return 0;
    const values = [grades.firstBimester, grades.secondBimester, grades.thirdBimester, grades.fourthBimester]
      .filter(v => v !== null && v !== undefined);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / 4;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900">Lançamento de Notas</h2>
        {selectedSubject && (
          <Button className="bg-green-600 hover:bg-green-700 text-white font-bold" onClick={handleSaveAll} disabled={recordGradeMutation.isPending}>
            {recordGradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Notas
          </Button>
        )}
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <select className="p-2 border rounded-md" value={selectedCourse || ""} onChange={(e) => { setSelectedCourse(Number(e.target.value)); setSelectedSubject(null); }}>
            <option value="">Selecione o curso</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="p-2 border rounded-md" value={selectedSemester} onChange={(e) => { setSelectedSemester(Number(e.target.value)); setSelectedSubject(null); }}>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}º Semestre</option>)}
          </select>
          <select className="p-2 border rounded-md" disabled={!selectedCourse} value={selectedSubject || ""} onChange={(e) => setSelectedSubject(Number(e.target.value))}>
            <option value="">Selecione a disciplina</option>
            {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </CardContent>
      </Card>

      {selectedCourse && selectedSubject ? (
        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-0">
            {isLoadingGrades ? (
              <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" /></div>
            ) : studentsGrades.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Aluno</th>
                    <th className="px-4 py-4 text-center">1º Bim</th>
                    <th className="px-4 py-4 text-center">2º Bim</th>
                    <th className="px-4 py-4 text-center">3º Bim</th>
                    <th className="px-4 py-4 text-center">4º Bim</th>
                    <th className="px-4 py-4 text-center bg-slate-200">Média</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentsGrades.map((student) => {
                    const grades = localGrades[student.enrollmentId] || {};
                    const average = calculateAverage(grades);
                    return (
                      <tr key={student.enrollmentId} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold">{student.studentName}</td>
                        {["firstBimester", "secondBimester", "thirdBimester", "fourthBimester"].map(f => (
                          <td key={f} className="px-4 py-4">
                            <Input 
                              className="w-16 mx-auto text-center font-bold"
                              value={grades[f] ?? ""}
                              onChange={(e) => handleLocalChange(student.enrollmentId, f, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="px-4 py-4 text-center font-black bg-slate-50">{average.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          {average >= 7 ? <span className="text-green-600 font-bold">Aprovado</span> : <span className="text-amber-600 font-bold">Recuperação</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center text-slate-500">Nenhum aluno matriculado neste curso.</div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Selecione os filtros para carregar a grade de alunos.</p>
        </div>
      )}
    </div>
  );
}
