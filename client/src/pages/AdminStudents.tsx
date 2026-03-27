import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit2, Trash2, Search, Loader2, Key } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// Lista de cursos organizados por tipo
const COURSES_BY_TYPE = {
  Graduação: [
    { id: 1, name: "Administração" },
    { id: 2, name: "Pedagogia" },
    { id: 3, name: "História" },
    { id: 4, name: "Matemática" },
    { id: 5, name: "Geografia" },
    { id: 6, name: "Língua Portuguesa" },
    { id: 7, name: "Inglês" },
    { id: 8, name: "Espanhol" },
  ],
  "Pós-graduação": [
    { id: 9, name: "Educação Física" },
    { id: 10, name: "Psicopedagogia" },
    { id: 11, name: "ABA" },
    { id: 12, name: "AEE" },
    { id: 13, name: "Educação Infantil" },
    { id: 14, name: "Gestão Escolar" },
    { id: 15, name: "Nutrição Esportiva" },
  ],
  "Cursos Técnicos": [
    { id: 16, name: "Enfermagem (Técnico)" },
    { id: 17, name: "Técnico em Estética" },
    { id: 18, name: "Teologia" },
  ],
};

interface Student {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive" | "suspended";
  createdAt: Date;
  registrationNumber?: string;
  courseName?: string;
  courseId?: number;
}

interface FormData {
  name: string;
  email: string;
  registrationNumber: string;
  courseId: number | null;
}

export default function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    registrationNumber: "",
    courseId: null,
  });

  // Queries e Mutations do tRPC
  const { data: students = [], isLoading, refetch } = trpc.students.list.useQuery();
  const createMutation = trpc.students.create.useMutation();
  const updateMutation = trpc.students.update.useMutation();
  const deleteMutation = trpc.students.delete.useMutation();
  const resetPasswordMutation = trpc.students.resetPassword.useMutation();

  // Gerar número de matrícula automático
  const generateRegistrationNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `${year}${random}`;
  };

  const handleAddStudent = async () => {
    if (!formData.name || !formData.email || !formData.courseId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const registrationNumber = formData.registrationNumber || generateRegistrationNumber();
      
      await createMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        courseId: formData.courseId,
        registrationNumber,
      });

      toast.success("Aluno adicionado com sucesso!");
      toast.info("Uma senha temporária foi enviada para o e-mail do aluno");
      setFormData({ name: "", email: "", registrationNumber: "", courseId: null });
      setIsOpen(false);
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao adicionar aluno";
      toast.error(errorMessage);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      registrationNumber: student.registrationNumber || "",
      courseId: student.courseId || null,
    });
    setIsEditOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent || !formData.name || !formData.email) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingStudent.id,
        name: formData.name,
        email: formData.email,
      });

      toast.success("Aluno atualizado com sucesso!");
      setFormData({ name: "", email: "", registrationNumber: "", courseId: null });
      setEditingStudent(null);
      setIsEditOpen(false);
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar aluno";
      toast.error(errorMessage);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Tem certeza que deseja deletar o aluno ${student.name}?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id: student.id });
      toast.success("Aluno deletado com sucesso!");
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao deletar aluno";
      toast.error(errorMessage);
    }
  };

  const handleResetPassword = async (student: Student) => {
    if (!confirm(`Tem certeza que deseja resetar a senha de ${student.name}? Uma nova senha temporária será enviada para ${student.email}`)) {
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ userId: student.id });
      toast.success("Senha resetada com sucesso!");
      toast.info(`Uma nova senha temporária foi enviada para ${student.email}`);
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao resetar senha";
      toast.error(errorMessage);
    }
  };

  // Filtrar alunos por busca e curso
  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.registrationNumber && student.registrationNumber.includes(searchTerm));
    
    const matchesCourse = selectedCourseFilter === null || student.courseId === selectedCourseFilter;
    
    return matchesSearch && matchesCourse;
  });

  // Contar alunos por curso
  const countByCourse = (courseId: number) => {
    return students.filter((s: Student) => s.courseId === courseId).length;
  };

  // Obter nome do curso
  const getCourseName = (courseId: number | undefined) => {
    if (!courseId) return "—";
    return Object.values(COURSES_BY_TYPE)
      .flat()
      .find((c) => c.id === courseId)?.name || "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-yellow-500" />
            Gerenciar Alunos
          </h2>
          <p className="text-slate-600 mt-1">CRUD completo de alunos do sistema</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold gap-2">
              <Plus className="w-4 h-4" />
              Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Aluno</DialogTitle>
              <DialogDescription>Preencha os dados do aluno para adicioná-lo ao sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Nome Completo *</label>
                <Input
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">E-mail *</label>
                <Input
                  type="email"
                  placeholder="joao@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Matrícula (Opcional)</label>
                <Input
                  placeholder="Deixe em branco para gerar automaticamente"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Curso *</label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-md p-3">
                  {Object.entries(COURSES_BY_TYPE).map(([type, courses]) => (
                    <div key={type}>
                      <p className="font-semibold text-sm text-slate-700 mb-2">{type}</p>
                      <div className="space-y-1 ml-2">
                        {courses.map((course) => (
                          <label key={course.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                            <input
                              type="radio"
                              name="course"
                              checked={formData.courseId === course.id}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  courseId: e.target.checked ? course.id : null,
                                })
                              }
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-slate-700">{course.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {formData.courseId && (
                  <p className="text-xs text-slate-500 mt-2">
                    Curso selecionado: {getCourseName(formData.courseId)}
                  </p>
                )}
              </div>
              <Button
                onClick={handleAddStudent}
                disabled={createMutation.isPending}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  "Adicionar Aluno"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
            <DialogDescription>Atualize os dados do aluno</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Nome Completo</label>
              <Input
                placeholder="João Silva"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">E-mail</label>
              <Input
                type="email"
                placeholder="joao@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <Button
              onClick={handleUpdateStudent}
              disabled={updateMutation.isPending}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar Aluno"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barra de Busca e Filtro */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar e Filtrar Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, e-mail ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Filtrar por Curso:</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCourseFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCourseFilter(null)}
                  className={selectedCourseFilter === null ? "bg-yellow-400 text-slate-900" : ""}
                >
                  Todos ({students.length})
                </Button>
                {Object.entries(COURSES_BY_TYPE).map(([type, courses]) => (
                  <div key={type} className="flex gap-2">
                    {courses.map((course) => {
                      const count = countByCourse(course.id);
                      return (
                        <Button
                          key={course.id}
                          variant={selectedCourseFilter === course.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCourseFilter(course.id)}
                          className={selectedCourseFilter === course.id ? "bg-yellow-400 text-slate-900" : ""}
                        >
                          {course.name} ({count})
                        </Button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Alunos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
          <CardDescription>Total de {filteredStudents.length} alunos</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Nenhum aluno encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Nome</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">E-mail</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Matrícula</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Curso</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.map((student: Student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{student.name}</td>
                      <td className="px-4 py-3 text-slate-600">{student.email}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{student.registrationNumber || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{getCourseName(student.courseId)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {student.status === "active" ? "Ativo" : student.status === "inactive" ? "Inativo" : "Suspenso"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            className="gap-1"
                            title="Editar aluno"
                          >
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(student)}
                            disabled={resetPasswordMutation.isPending}
                            className="gap-1 text-blue-600 hover:text-blue-700"
                            title="Resetar senha"
                          >
                            {resetPasswordMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Key className="w-4 h-4" />
                            )}
                            Resetar Senha
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            disabled={deleteMutation.isPending}
                            className="gap-1 text-red-600 hover:text-red-700"
                            title="Deletar aluno"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Deletar
                          </Button>
                        </div>
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
