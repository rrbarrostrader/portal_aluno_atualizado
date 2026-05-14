import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Trash2, Layers, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminCourses() {
  const [activeTab, setActiveTab] = useState<"courses" | "subjects">("courses");
  
  // States Curso
  const [courseName, setCourseName] = useState("");
  const [courseHours, setCourseHours] = useState("");

  // States Disciplina
  const [selectedCourse, setSelectedCourse] = useState("");
  const [subName, setSubName] = useState("");
  const [subSemester, setSubSemester] = useState("");
  const [subHours, setSubHours] = useState("");

  const utils = trpc.useUtils();
  const { data: courses, isLoading: loadingCourses } = trpc.courses.list.useQuery();
  
  const { data: subjects } = trpc.courses.listSubjects.useQuery(
    { courseId: Number(selectedCourse) },
    { enabled: !!selectedCourse }
  );

  const createCourse = trpc.courses.create.useMutation({
    onSuccess: () => {
      toast.success("Curso criado com sucesso!");
      setCourseName(""); setCourseHours("");
      utils.courses.list.invalidate();
    }
  });

  const createSubject = trpc.courses.createSubject.useMutation({
    onSuccess: () => {
      toast.success("Disciplina vinculada!");
      setSubName(""); setSubHours(""); setSubSemester("");
      utils.courses.listSubjects.invalidate();
    }
  });

  const deleteCourse = trpc.courses.delete.useMutation({
    onSuccess: () => {
      toast.success("Curso e dependências removidos!");
      utils.courses.list.invalidate();
    }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">Gestão Acadêmica</h1>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <Button 
            variant={activeTab === "courses" ? "default" : "ghost"} 
            onClick={() => setActiveTab("courses")}
            className="rounded-md"
          >
            Cursos
          </Button>
          <Button 
            variant={activeTab === "subjects" ? "default" : "ghost"} 
            onClick={() => setActiveTab("subjects")}
            className="rounded-md"
          >
            Disciplinas
          </Button>
        </div>
      </div>

      {activeTab === "courses" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <Card className="lg:col-span-1 shadow-md h-fit">
            <CardHeader><CardTitle className="text-lg">Novo Curso</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Nome do Curso" value={courseName} onChange={e => setCourseName(e.target.value)} />
              <Input type="number" placeholder="Carga Horária Total" value={courseHours} onChange={e => setCourseHours(e.target.value)} />
              <Button className="w-full" onClick={() => createCourse.mutate({ name: courseName, totalHours: Number(courseHours) })}>
                {createCourse.isLoading ? <Loader2 className="animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Criar Curso</>}
              </Button>
            </CardContent>
          </Card>

          {/* Listagem em tempo real */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><BookOpen className="text-blue-600" /> Cursos Ativos</h2>
            {loadingCourses ? <Loader2 className="animate-spin mx-auto" /> : courses?.map(c => (
              <Card key={c.id} className="hover:border-blue-300 transition-colors">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.totalHours}h • Código: {c.code}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteCourse.mutate({ id: c.id })}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 shadow-md h-fit">
            <CardHeader><CardTitle className="text-lg">Vincular Disciplina</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger><SelectValue placeholder="Selecione o Curso" /></SelectTrigger>
                <SelectContent>{courses?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Nome da Disciplina" value={subName} onChange={e => setSubName(e.target.value)} />
              <Input type="number" placeholder="Semestre (Ex: 1)" value={subSemester} onChange={e => setSubSemester(e.target.value)} />
              <Input type="number" placeholder="Carga Horária" value={subHours} onChange={e => setSubHours(e.target.value)} />
              <Button className="w-full bg-indigo-600" onClick={() => createSubject.mutate({
                name: subName, courseId: Number(selectedCourse), semester: Number(subSemester), hours: Number(subHours)
              })}>
                {createSubject.isLoading ? <Loader2 className="animate-spin" /> : "Adicionar à Grade"}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Layers className="text-indigo-600" /> Grade Curricular</h2>
            {!selectedCourse ? <p className="text-slate-400 italic">Selecione um curso para ver as disciplinas...</p> : subjects?.map(s => (
              <div key={s.id} className="p-4 bg-white border rounded-xl flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <div className="flex gap-3 text-xs text-slate-500 mt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">{s.semester}º Semestre</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.hours}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}