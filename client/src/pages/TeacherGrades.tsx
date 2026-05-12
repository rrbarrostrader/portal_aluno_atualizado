import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, GraduationCap, BookOpen, Save, UserCheck, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function TeacherGrades() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("1");
  const [editingStudent, setEditingStudent] = useState<number | null>(null);

  // Form State
  const [gradesData, setGradesData] = useState({
    firstBimester: "",
    secondBimester: "",
    thirdBimester: "",
    fourthBimester: "",
  });

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

  const mutation = trpc.grades.recordGrade.useMutation({
    onSuccess: () => {
      toast.success("Notas salvas com sucesso!");
      setEditingStudent(null);
      studentsQuery.refetch();
    },
    onError: (err) => toast.error("Erro: " + err.message)
  });

  const handleEdit = (student: any) => {
    setEditingStudent(student.enrollmentId);
    // Tenta encontrar nota já lançada para este aluno/disciplina/semestre
    // No mundo real, faríamos um fetch das notas atuais aqui.
    setGradesData({
      firstBimester: "",
      secondBimester: "",
      thirdBimester: "",
      fourthBimester: "",
    });
  };

  const handleSave = () => {
    if (!editingStudent || !selectedSubject) return;
    
    mutation.mutate({
      enrollmentId: editingStudent,
      subjectId: parseInt(selectedSubject),
      semester: parseInt(selectedSemester),
      firstBimester: gradesData.firstBimester ? parseFloat(gradesData.firstBimester) : null,
      secondBimester: gradesData.secondBimester ? parseFloat(gradesData.secondBimester) : null,
      thirdBimester: gradesData.thirdBimester ? parseFloat(gradesData.thirdBimester) : null,
      fourthBimester: gradesData.fourthBimester ? parseFloat(gradesData.fourthBimester) : null,
    });
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <GraduationCap className="w-10 h-10 text-blue-600" /> Portal do Professor
        </h2>
        <p className="text-slate-500 font-medium">Bem-vindo, Prof. {user?.name}. Lance as notas de suas turmas abaixo.</p>
      </div>

      {/* Filtros */}
      <Card className="border-none shadow-xl bg-white">
        <CardHeader className="bg-slate-900 text-white rounded-t-xl">
          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" /> Seleção de Turma e Disciplina
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-500">Curso</label>
            <Select onValueChange={setSelectedCourse}>
              <SelectTrigger className="h-12 border-2 focus:ring-blue-500">
                <SelectValue placeholder="Selecione o curso" />
              </SelectTrigger>
              <SelectContent>
                {coursesQuery.data?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-500">Disciplina</label>
            <Select onValueChange={setSelectedSubject} disabled={!selectedCourse}>
              <SelectTrigger className="h-12 border-2">
                <SelectValue placeholder="Selecione a disciplina" />
              </SelectTrigger>
              <SelectContent>
                {subjectsQuery.data?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-500">Semestre</label>
            <Select onValueChange={setSelectedSemester} defaultValue="1">
              <SelectTrigger className="h-12 border-2">
                <SelectValue placeholder="Semestre" />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={s.toString()}>{s}º Semestre</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listagem de Alunos */}
      {selectedSubject && (
        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
            <div>
              <CardTitle className="text-lg font-black text-slate-900">Alunos Matriculados</CardTitle>
              <CardDescription>Clique no aluno para abrir o painel de lançamento</CardDescription>
            </div>
            <div className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-xs font-black uppercase">
              {studentsQuery.data?.length || 0} Alunos
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {studentsQuery.data?.map((student: any) => (
                <div key={student.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div onClick={() => handleEdit(student)} className="cursor-pointer group">
                      <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{student.name}</p>
                      <p className="text-xs font-bold text-slate-400">RA: {student.registrationNumber}</p>
                    </div>
                    
                    {editingStudent === student.enrollmentId ? (
                      <div className="flex flex-wrap gap-4 items-end bg-blue-50 p-6 rounded-2xl border-2 border-blue-100 animate-in fade-in zoom-in duration-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-blue-600">Avaliação</label>
                            <Input type="number" className="h-10 w-24 font-bold" value={gradesData.firstBimester} onChange={e => setGradesData({...gradesData, firstBimester: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-blue-600">Trabalho</label>
                            <Input type="number" className="h-10 w-24 font-bold" value={gradesData.secondBimester} onChange={e => setGradesData({...gradesData, secondBimester: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-blue-600">Frequência</label>
                            <Input type="number" className="h-10 w-24 font-bold" value={gradesData.thirdBimester} onChange={e => setGradesData({...gradesData, thirdBimester: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-blue-600">Substitutiva</label>
                            <Input type="number" className="h-10 w-24 font-bold" value={gradesData.fourthBimester} onChange={e => setGradesData({...gradesData, fourthBimester: e.target.value})} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" onClick={() => setEditingStudent(null)} className="h-10 font-bold">Cancelar</Button>
                          <Button onClick={handleSave} disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 h-10 gap-2 font-bold px-6">
                            {mutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4" /> Salvar Notas</>}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={() => handleEdit(student)} className="rounded-xl border-2 hover:bg-blue-50 hover:border-blue-200 font-bold gap-2">
                        <UserCheck className="w-4 h-4" /> Lançar Notas
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {(!studentsQuery.data || studentsQuery.data.length === 0) && (
                <div className="p-20 text-center text-slate-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">Selecione um curso e disciplina para listar os alunos.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
