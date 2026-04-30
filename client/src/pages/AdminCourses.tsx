import { useState, useEffect } from "react";
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
  const [editingCourse, setEditingCourse] = useState<number | null>(null);
  const [courseSubjects, setCourseSubjects] = useState<Record<number, any[]>>({});
  
  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    description: "",
    type: "graduation" as const,
    duration: 48,
    semesters: 4,
  });

  const [editCourse, setEditCourse] = useState({
    id: 0,
    name: "",
    description: "",
    status: "active" as const,
    semesters: 4,
  });

  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    description: "",
    credits: 4,
    workload: 60,
    courseHours: 60,
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
        semesters: 4,
      });
      setIsAddingCourse(false);
      coursesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar curso");
    },
  });

  const updateMutation = trpc.courses.update.useMutation({
    onSuccess: () => {
      toast.success("Curso atualizado com sucesso!");
      setEditingCourse(null);
      coursesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar curso");
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
        courseHours: 60,
        semester: 1,
      });
      setIsAddingSubject(null);
      // Atualizar a lista de disciplinas do curso
      if (expandedCourse) {
        fetchSubjects(expandedCourse);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar disciplina");
    },
  });

  const subjectsQuery = trpc.courses.listSubjects.useQuery(
    { courseId: expandedCourse || 0 },
    { enabled: !!expandedCourse }
  );

  const fetchSubjects = async (courseId: number) => {
    try {
      const subjects = await trpc.courses.listSubjects.query({ courseId });
      setCourseSubjects(prev => ({
        ...prev,
        [courseId]: subjects
      }));
    } catch (error) {
      console.error("Erro ao buscar disciplinas:", error);
    }
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.code) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate(newCourse);
  };

  const handleEditCourse = (course: any) => {
    setEditingCourse(course.id);
    setEditCourse({
      id: course.id,
      name: course.name,
      description: course.description || "",
      status: course.status || "active",
      semesters: course.semesters || 4,
    });
  };

  const handleSaveCourse = () => {
    if (!editCourse.name) {
      toast.error("Preencha o nome do curso");
      return;
    }
    updateMutation.mutate({
      id: editCourse.id,
      name: editCourse.name,
      description: editCourse.description,
      status: editCourse.status,
      semesters: editCourse.semesters,
    });
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

  const handleExpandCourse = (courseId: number) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(courseId);
      fetchSubjects(courseId);
    }
  };

  const courses = coursesQuery.data || [];
  const subjects = courseSubjects[expandedCourse || 0] || subjectsQuery.data || [];
  
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
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Semestres</th>
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
                    <td className="px-6 py-4 text-sm text-slate-600">{course.semesters || 4}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleExpandCourse(course.id)}
                        >
                          <BookOpen className="w-4 h-4 mr-1" />
                          Disciplinas
                          {expandedCourse === course.id ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEditCourse(course)}
                        >
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
                      <td colSpan={6} className="px-12 py-6">
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
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Nome da Disciplina</label>
                                    <input 
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                                      placeholder="Ex: Português"
                                      value={newSubject.name}
                                      onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Código</label>
                                    <input 
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                                      placeholder="Ex: PORT-001"
                                      value={newSubject.code}
                                      onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Semestre</label>
                                    <select 
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                                      value={newSubject.semester}
                                      onChange={(e) => setNewSubject({...newSubject, semester: parseInt(e.target.value)})}
                                    >
                                      {Array.from({length: course.semesters || 4}, (_, i) => i + 1).map(sem => (
                                        <option key={sem} value={sem}>{sem}º Semestre</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Carga Horária</label>
                                    <input 
                                      type="number"
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                                      placeholder="Ex: 60"
                                      value={newSubject.courseHours}
                                      onChange={(e) => setNewSubject({...newSubject, courseHours: parseInt(e.target.value)})}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setIsAddingSubject(null)}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleAddSubject(course.id)}
                                  >
                                    <Save className="w-3 h-3 mr-1" /> Salvar Disciplina
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {subjects && subjects.length > 0 ? (
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                              <table className="w-full text-left text-sm">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-2 font-semibold text-slate-700">Código</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Nome</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Semestre</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700">C.H</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {subjects.map((subject) => (
                                    <tr key={subject.id} className="hover:bg-slate-50">
                                      <td className="px-4 py-2 text-slate-900 font-medium">{subject.code}</td>
                                      <td className="px-4 py-2 text-slate-600">{subject.name}</td>
                                      <td className="px-4 py-2 text-slate-600">{subject.semester}º</td>
                                      <td className="px-4 py-2 text-slate-600">{subject.courseHours || subject.workload}h</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-slate-500">
                              <p>Nenhuma disciplina cadastrada. Clique em "Adicionar Disciplina" para começar.</p>
                            </div>
                          )}
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

  if (coursesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gerenciar Cursos</h1>
          <p className="text-slate-600 mt-1">Visualize e gerencie os cursos e suas disciplinas</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSeedCourses}
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            Carregar Cursos Padrão
          </Button>
          <Button 
            onClick={() => setIsAddingCourse(!isAddingCourse)}
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Curso
          </Button>
        </div>
      </div>

      {isAddingCourse && (
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader>
            <CardTitle>Criar Novo Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nome do Curso</label>
                  <input 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    placeholder="Ex: Administração"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Código</label>
                  <input 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    placeholder="Ex: ADM-001"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Duração (horas)</label>
                  <input 
                    type="number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({...newCourse, duration: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Quantidade de Semestres</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    value={newCourse.semesters}
                    onChange={(e) => setNewCourse({...newCourse, semesters: parseInt(e.target.value)})}
                  >
                    {[2, 3, 4, 5, 6, 8].map(num => (
                      <option key={num} value={num}>{num} Semestres</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tipo</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    value={newCourse.type}
                    onChange={(e) => setNewCourse({...newCourse, type: e.target.value as any})}
                  >
                    <option value="graduation">Graduação</option>
                    <option value="postgraduate">Pós-Graduação</option>
                    <option value="extension">Extensão</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Descrição</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="Descrição do curso"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingCourse(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" /> Criar Curso
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editingCourse && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle>Editar Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nome</label>
                  <input 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    value={editCourse.name}
                    onChange={(e) => setEditCourse({...editCourse, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Quantidade de Semestres</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    value={editCourse.semesters}
                    onChange={(e) => setEditCourse({...editCourse, semesters: parseInt(e.target.value)})}
                  >
                    {[2, 3, 4, 5, 6, 8].map(num => (
                      <option key={num} value={num}>{num} Semestres</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Descrição</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  value={editCourse.description}
                  onChange={(e) => setEditCourse({...editCourse, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setEditingCourse(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveCourse}
                >
                  <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {renderCourseList("graduation", "Graduação")}
      {renderCourseList("postgraduate", "Pós-Graduação")}
      {renderCourseList("extension", "Extensão")}
    </div>
  );
}
