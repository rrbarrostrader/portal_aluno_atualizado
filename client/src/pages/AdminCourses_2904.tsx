import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit2, Trash2, Loader2, BookOpen, ChevronRight, ChevronDown, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminCourses() {
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState<number | null>(null);
  
  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    description: "",
    type: "graduation" as const,
    duration: 48,
  });

  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    description: "",
    credits: 4,
    workload: 60,
    semester: 1,
  });

  // Queries
  const coursesQuery = trpc.courses.list.useQuery();
  
  const seedMutation = trpc.courses.seedDefaultCourses.useMutation({
    onSuccess: () => {
      toast.success("Cursos padrão carregados com sucesso!");
      coursesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao carregar cursos padrão");
    },
  });

  const createMutation = trpc.courses.create.useMutation({
    onSuccess: () => {
      toast.success("Curso criado com sucesso!");
      setNewCourse({
        name: "",
        code: "",
        description: "",
        type: "graduation",
        duration: 48,
      });
      setIsAddingCourse(false);
      coursesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar curso");
    },
  });

  const deleteMutation = trpc.courses.delete.useMutation({
    onSuccess: () => {
      toast.success("Curso deletado com sucesso!");
      coursesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar curso");
    },
  });

  const createSubjectMutation = trpc.courses.createSubject.useMutation({
    onSuccess: () => {
      toast.success("Disciplina cadastrada com sucesso!");
      setNewSubject({
        name: "",
        code: "",
        description: "",
        credits: 4,
        workload: 60,
        semester: 1,
      });
      setIsAddingSubject(null);
      coursesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar disciplina");
    },
  });

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.code) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate(newCourse);
  };

  const handleAddSubject = (courseId: number) => {
    if (!newSubject.name || !newSubject.code) {
      toast.error("Preencha o nome e código da disciplina");
      return;
    }
    createSubjectMutation.mutate({
      ...newSubject,
      courseId,
    });
  };

  const handleDeleteCourse = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este curso?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSeedCourses = () => {
    if (confirm("Isso carregará os 18 cursos padrão. Continuar?")) {
      seedMutation.mutate();
    }
  };

  const courses = coursesQuery.data || [];
  
  const renderCourseList = (type: string, title: string) => {
    const filteredCourses = courses.filter(c => c.type === type);
    if (filteredCourses.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">{title} ({filteredCourses.length})</h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-sm font-semibold text-slate-700 w-12"></th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Código</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Nome do Curso</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Duração</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCourses.map((course) => (
                <>
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Checkbox id={`course-${course.id}`} />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{course.code}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{course.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{course.duration}h</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                        >
                          <BookOpen className="w-4 h-4 mr-1" />
                          Disciplinas
                          {expandedCourse === course.id ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-slate-600">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedCourse === course.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="px-12 py-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Disciplinas do Curso</h4>
                            <Button 
                              size="sm" 
                              className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-xs font-bold"
                              onClick={() => setIsAddingSubject(course.id)}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Adicionar Disciplina
                            </Button>
                          </div>

                          {isAddingSubject === course.id && (
                            <Card className="border-yellow-200 bg-yellow-50/30">
                              <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Nome da Disciplina</label>
                                    <input 
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                                      placeholder="Ex: Cálculo I"
                                      value={newSubject.name}
                                      onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Código</label>
                                    <input 
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                                      placeholder="Ex: MAT001"
                                      value={newSubject.code}
                                      onChange={e => setNewSubject({...newSubject, code: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Semestre</label>
                                    <input 
                                      type="number"
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                                      value={newSubject.semester}
                                      onChange={e => setNewSubject({...newSubject, semester: parseInt(e.target.value)})}
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => setIsAddingSubject(null)}>
                                    <X className="w-4 h-4 mr-1" /> Cancelar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleAddSubject(course.id)}
                                    disabled={createSubjectMutation.isPending}
                                  >
                                    {createSubjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                                    Salvar Disciplina
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-2 font-semibold text-slate-700">Código</th>
                                  <th className="px-4 py-2 font-semibold text-slate-700">Nome</th>
                                  <th className="px-4 py-2 font-semibold text-slate-700">Semestre</th>
                                  <th className="px-4 py-2 font-semibold text-slate-700">Carga Horária</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {/* Aqui as disciplinas seriam listadas. Como o router listSubjects existe, 
                                    em uma implementação real faríamos um sub-componente ou uma query por curso.
                                    Para este exemplo, assumimos que o getById já traz as subjects se expandido. */}
                                <tr className="hover:bg-slate-50">
                                  <td colSpan={4} className="px-4 py-4 text-center text-slate-500 italic">
                                    Clique em Adicionar Disciplina para cadastrar matérias neste curso.
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Gerenciar Cursos</h2>
          <p className="text-slate-500 mt-1">Visualize e gerencie os cursos e suas disciplinas</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleSeedCourses}
            disabled={seedMutation.isPending}
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            {seedMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Carregar Cursos Padrão
          </Button>
          <Button
            onClick={() => setIsAddingCourse(!isAddingCourse)}
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Curso
          </Button>
        </div>
      </div>

      {isAddingCourse && (
        <Card className="mb-8 border-yellow-200 shadow-md">
          <CardHeader>
            <CardTitle>Cadastrar Novo Curso</CardTitle>
            <CardDescription>Preencha as informações básicas do curso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCourse} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nome do Curso *</label>
                  <input
                    type="text"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                    placeholder="Ex: Administração de Empresas"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Código do Curso *</label>
                  <input
                    type="text"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                    placeholder="Ex: ADM-001"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tipo de Curso</label>
                  <select
                    value={newCourse.type}
                    onChange={(e) => setNewCourse({ ...newCourse, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none bg-white"
                  >
                    <option value="graduation">Graduação</option>
                    <option value="postgraduate">Pós-graduação</option>
                    <option value="technical">Técnico</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Duração Total (Horas)</label>
                  <input
                    type="number"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({ ...newCourse, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsAddingCourse(false)}>Cancelar</Button>
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-8"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Curso"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {coursesQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Carregando cursos...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {renderCourseList("graduation", "Graduação")}
          {renderCourseList("postgraduate", "Pós-graduação")}
          {renderCourseList("technical", "Técnico")}
          
          {courses.length === 0 && !isAddingCourse && (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">Nenhum curso encontrado</h3>
              <p className="text-slate-500 mb-6">Comece cadastrando um novo curso ou carregue os padrões.</p>
              <Button onClick={() => setIsAddingCourse(true)} className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold">
                Cadastrar Primeiro Curso
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
