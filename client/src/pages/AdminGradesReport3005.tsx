import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, Search, GraduationCap, User, ChevronDown, ChevronUp, Edit2, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminGradesReport() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [editingGrade, setEditingGrade] = useState<{enrollmentId: number, subjectId: number} | null>(null);
  const [tempGrades, setTempGrades] = useState<any>({});

  const { data: courses } = trpc.courses.list.useQuery();
  const { data: subjects } = trpc.courses.listSubjects.useQuery(
    { courseId: Number(selectedCourse) }, 
    { enabled: !!selectedCourse }
  );
  const { data: students } = trpc.courses.listStudentsByCourse.useQuery(
    { courseId: Number(selectedCourse) }, 
    { enabled: !!selectedCourse }
  );

  const { data: allGrades, refetch } = trpc.grades.getAllCourseGrades.useQuery(
    { enrollmentIds: students?.map(s => s.enrollmentId) || [] },
    { enabled: !!students?.length }
  );

  const saveMutation = trpc.grades.recordGrade.useMutation({
    onSuccess: () => {
      toast.success("Nota atualizada com sucesso!");
      setEditingGrade(null);
      refetch();
    },
    onError: (e) => toast.error("Erro ao salvar: " + e.message)
  });

  const handleEdit = (enrollmentId: number, subjectId: number, currentGrades: any) => {
    setEditingGrade({ enrollmentId, subjectId });
    // CORREÇÃO: Usando camelCase conforme o JSON real
    setTempGrades({
      f: currentGrades?.firstBimester ?? "",
      s: currentGrades?.secondBimester ?? "",
      t: currentGrades?.thirdBimester ?? "",
      fo: currentGrades?.fourthBimester ?? ""
    });
  };

  const handleSave = (enrollmentId: number, subject: any) => {
    saveMutation.mutate({
      enrollmentId,
      subjectId: subject.id,
      semester: Number(subject.semester || 1),
      firstBimester: tempGrades.f === "" ? null : Number(tempGrades.f),
      secondBimester: tempGrades.s === "" ? null : Number(tempGrades.s),
      thirdBimester: tempGrades.t === "" ? null : Number(tempGrades.t),
      fourthBimester: tempGrades.fo === "" ? null : Number(tempGrades.fo),
      finalGrade: null
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <BarChart3 className="w-10 h-10 text-blue-600" />
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão Acadêmica</h1>
          <p className="text-sm text-slate-500">Visão geral por aluno e controle de histórico</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-md">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
            <GraduationCap className="w-3 h-3" /> Selecione o Curso para listar os alunos
          </label>
          <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setExpandedStudent(null); }}>
            <SelectTrigger className="bg-slate-50 h-14 border-slate-200"><SelectValue placeholder="Escolha um curso..." /></SelectTrigger>
            <SelectContent>{courses?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {!selectedCourse ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Selecione um curso para gerenciar os alunos e suas notas.</p>
          </div>
        ) : students?.length === 0 ? (
          <p className="text-center py-10 text-slate-500 font-medium">Nenhum aluno matriculado neste curso.</p>
        ) : (
          students?.map(student => {
            const isExpanded = expandedStudent === student.id;
            return (
              <Card key={student.id} className={`overflow-hidden border-none shadow-sm transition-all ${isExpanded ? 'ring-2 ring-blue-500' : 'hover:bg-slate-50'}`}>
                <button className="w-full p-5 flex justify-between items-center bg-white" onClick={() => setExpandedStudent(isExpanded ? null : student.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-extrabold text-slate-900 text-lg">{student.name}</p>
                      <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">RA: {student.registrationNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">{subjects?.length || 0} Disciplinas</span>
                    {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="p-0 bg-slate-50 border-t border-slate-100">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-100/50 hover:bg-slate-100/50">
                          <TableHead className="font-bold text-slate-700">Disciplina</TableHead>
                          <TableHead className="text-center font-bold text-slate-700">1º Bim</TableHead>
                          <TableHead className="text-center font-bold text-slate-700">2º Bim</TableHead>
                          <TableHead className="text-center font-bold text-slate-700">3º Bim</TableHead>
                          <TableHead className="text-center font-bold text-slate-700">4º Bim</TableHead>
                          <TableHead className="text-center font-bold text-slate-700">Média</TableHead>
                          <TableHead className="text-right font-bold text-slate-700">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjects?.map(subject => {
                          // CORREÇÃO: Usando camelCase e convertendo para número conforme o JSON real
                          const grade = allGrades?.find(g => Number(g.enrollmentId) === Number(student.enrollmentId) && Number(g.subjectId) === Number(subject.id));
                          const isEditing = editingGrade?.enrollmentId === student.enrollmentId && editingGrade?.subjectId === subject.id;
                          
                          const b1 = grade?.firstBimester ? Number(grade.firstBimester) : 0;
                          const b2 = grade?.secondBimester ? Number(grade.secondBimester) : 0;
                          const b3 = grade?.thirdBimester ? Number(grade.thirdBimester) : 0;
                          const b4 = grade?.fourthBimester ? Number(grade.fourthBimester) : 0;
                          const avg = (b1 + b2 + b3 + b4) / 4;

                          return (
                            <TableRow key={subject.id} className="hover:bg-white transition-colors">
                              <TableCell className="font-medium text-slate-900">
                                {subject.name}
                                <p className="text-[10px] text-slate-400 uppercase font-bold">{subject.semester}º Semestre</p>
                              </TableCell>
                              {[1, 2, 3, 4].map(b => {
                                const val = grade?.[b === 1 ? 'firstBimester' : b === 2 ? 'secondBimester' : b === 3 ? 'thirdBimester' : 'fourthBimester'];
                                return (
                                  <TableCell key={b} className="text-center">
                                    {isEditing ? (
                                      <Input 
                                        type="number" className="w-16 mx-auto h-8 text-center font-bold" 
                                        value={tempGrades[b === 1 ? 'f' : b === 2 ? 's' : b === 3 ? 't' : 'fo']}
                                        onChange={e => setTempGrades({...tempGrades, [b === 1 ? 'f' : b === 2 ? 's' : b === 3 ? 't' : 'fo']: e.target.value})}
                                      />
                                    ) : (
                                      <span className="font-bold text-slate-600">{val ? Number(val) : '-'}</span>
                                    )}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center">
                                <span className={`font-black ${avg > 0 && avg >= 7 ? 'text-green-600' : avg > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                                  {avg > 0 ? avg.toFixed(1) : '-'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditing ? (
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setEditingGrade(null)}><X className="w-4 h-4" /></Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleSave(student.enrollmentId, subject)} disabled={saveMutation.isPending}>
                                      {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </Button>
                                  </div>
                                ) : (
                                  <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => handleEdit(student.enrollmentId, subject.id, grade)}>
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  );
}
