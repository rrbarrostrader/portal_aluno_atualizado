import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, ChevronDown, ChevronUp, Calculator, CheckCircle, AlertCircle, User } from "lucide-react";
import { toast } from "sonner";

export default function AdminGrades() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [localGrades, setLocalGrades] = useState<Record<number, any>>({});

  const { data: courses } = trpc.courses.list.useQuery();
  
  // Lista disciplinas do curso selecionado
  const { data: subjects } = trpc.courses.listSubjects.useQuery(
    { courseId: Number(selectedCourse) }, 
    { enabled: !!selectedCourse }
  );

  // Busca a disciplina selecionada para pegar o semestre
  const currentSub = subjects?.find(s => s.id.toString() === selectedSubject);

  // Lista alunos APENAS quando curso E disciplina estiverem selecionados
  const { data: students } = trpc.courses.listStudentsByCourse.useQuery(
    { courseId: Number(selectedCourse) }, 
    { enabled: !!selectedCourse && !!selectedSubject }
  );

  const { data: dbGrades, refetch } = trpc.grades.getBatchGrades.useQuery(
    { subjectId: Number(selectedSubject), enrollmentIds: students?.map(s => s.enrollmentId) || [] },
    { enabled: !!selectedSubject && !!students?.length }
  );

  const saveMutation = trpc.grades.recordGrade.useMutation({
    onSuccess: () => { 
      toast.success("Dados salvos com sucesso!"); 
      refetch(); 
    },
    onError: (e) => toast.error("Erro técnico: " + e.message)
  });

  const calculateAverage = (enrollmentId: number) => {
    const g = localGrades[enrollmentId] || {};
    const db = dbGrades?.find(dg => dg.enrollmentId === enrollmentId) || {};
    
    const values = [
      g.f ?? db.firstBimester ?? 0,
      g.s ?? db.secondBimester ?? 0,
      g.t ?? db.thirdBimester ?? 0,
      g.fo ?? db.fourthBimester ?? 0
    ];
    
    const sum = values.reduce((a, b) => a + Number(b), 0);
    return parseFloat((sum / 4).toFixed(1));
  };

  const handleSave = (enrollmentId: number) => {
    if (!currentSub || currentSub.semester === undefined || currentSub.semester === null) {
      return toast.error("Erro: Selecione uma disciplina com semestre válido.");
    }

    const g = localGrades[enrollmentId] || {};
    const db = dbGrades?.find(dg => dg.enrollmentId === enrollmentId) || {};
    const avg = calculateAverage(enrollmentId);

    saveMutation.mutate({
      enrollmentId,
      subjectId: currentSub.id,
      semester: Number(currentSub.semester), 
      firstBimester: g.f !== undefined ? g.f : (db.firstBimester !== null ? Number(db.firstBimester) : null),
      secondBimester: g.s !== undefined ? g.s : (db.secondBimester !== null ? Number(db.secondBimester) : null),
      thirdBimester: g.t !== undefined ? g.t : (db.thirdBimester !== null ? Number(db.thirdBimester) : null),
      fourthBimester: g.fo !== undefined ? g.fo : (db.fourthBimester !== null ? Number(db.fourthBimester) : null),
      finalGrade: avg
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50/30">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <Calculator className="w-10 h-10 text-blue-600" />
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Notas</h1>
          <p className="text-sm text-slate-500">Gestão de desempenho e médias acadêmicas</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase ml-1">1. Selecione o Curso</label>
          <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setSelectedSubject(""); }}>
            <SelectTrigger className="bg-slate-50 h-14 border-slate-200"><SelectValue placeholder="Escolha um curso..." /></SelectTrigger>
            <SelectContent>{courses?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase ml-1">2. Selecione a Disciplina / Semestre</label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedCourse}>
            <SelectTrigger className="bg-slate-50 h-14 border-slate-200"><SelectValue placeholder="Escolha uma disciplina..." /></SelectTrigger>
            <SelectContent>{subjects?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.semester ? `${s.semester}º Semestre` : 'Sem semestre'})</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {!selectedSubject ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Selecione o curso e a disciplina para listar os alunos.</p>
          </div>
        ) : students?.length === 0 ? (
          <p className="text-center py-10 text-slate-500 font-medium">Nenhum aluno matriculado neste curso.</p>
        ) : (
          students?.map(student => {
            const avg = calculateAverage(student.enrollmentId);
            const isExpanded = expandedStudent === student.id;
            const dbData = dbGrades?.find(dg => dg.enrollmentId === student.enrollmentId);

            return (
              <Card key={student.id} className={`overflow-hidden border-none shadow-sm transition-all ${isExpanded ? 'ring-2 ring-blue-500 scale-[1.01]' : 'hover:bg-slate-50'}`}>
                <button className="w-full p-5 flex justify-between items-center bg-white" onClick={() => setExpandedStudent(isExpanded ? null : student.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-extrabold text-slate-900 text-lg">{student.name}</p>
                      <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">RA: {student.registrationNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right border-r pr-8 border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Média Final</p>
                      <p className={`text-2xl font-black ${avg >= 7 ? 'text-green-600' : 'text-red-500'}`}>{avg.toFixed(1)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="p-8 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      {[1, 2, 3, 4].map(b => (
                        <div key={b} className="space-y-2">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{b}º Bimestre</label>
                          <Input 
                            type="number" step="0.1" placeholder="0.0" className="bg-white h-12 text-center text-lg font-bold border-slate-200 focus:border-blue-400"
                            defaultValue={dbData?.[b === 1 ? 'firstBimester' : b === 2 ? 'secondBimester' : b === 3 ? 'thirdBimester' : 'fourthBimester'] ?? ""}
                            onChange={e => setLocalGrades({...localGrades, [student.enrollmentId]: {...localGrades[student.enrollmentId], [b === 1 ? 'f' : b === 2 ? 's' : b === 3 ? 't' : 'fo']: Number(e.target.value)}})}
                          />
                        </div>
                      ))}
                      <div className="flex items-end">
                        <Button className="w-full h-12 bg-blue-700 hover:bg-blue-800 font-black shadow-lg" onClick={() => handleSave(student.enrollmentId)} disabled={saveMutation.isPending}>
                          {saveMutation.isPending ? <Loader2 className="animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> SALVAR</>}
                        </Button>
                      </div>
                    </div>
                    
                    <div className={`mt-6 p-4 rounded-xl flex items-center justify-between border ${avg >= 7 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      <div className="flex items-center gap-3">
                        {avg >= 7 ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        <span className="text-sm font-bold uppercase tracking-tight">Status Atual: {avg >= 7 ? 'Aprovado' : 'Abaixo da Média'}</span>
                      </div>
                      <span className="text-xs font-medium opacity-70">Cálculo automático baseado na média aritmética dos 4 bimestres.</span>
                    </div>
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
