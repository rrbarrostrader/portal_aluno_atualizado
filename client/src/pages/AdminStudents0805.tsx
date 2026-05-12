import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit2, Trash2, Search, Loader2, Key } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

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
  const { data: courses = [] } = trpc.courses.list.useQuery();
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
    if (!confirm(`Deseja enviar uma nova senha para ${student.name}?`)) {
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ userId: student.id });
      toast.success("Nova senha enviada para o e-mail do aluno!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao redefinir senha";
      toast.error(errorMessage);
    }
  };

  // Filtrar alunos baseado na busca e filtro de curso
  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.registrationNumber?.includes(searchTerm) || false);
    
    const matchesCourse = !selectedCourseFilter || student.courseId === selectedCourseFilter;
    
    return matchesSearch && matchesCourse;
  });

  // Agrupar cursos por tipo
  const coursesByType = courses.reduce((acc, course) => {
    if (!acc[course.type]) {
      acc[course.type] = [];
    }
    acc[course.type].push(course);
    return acc;
  }, {} as Record<string, any[]>);

  const typeLabels: Record<string, string> = {
    graduation: "Graduação",
    postgraduate: "Pós-graduação",
    technical: "Técnico",
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Gerenciar Alunos</h2>
          <p className="text-slate-500 mt-1">Visualize e gerencie os alunos cadastrados</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Aluno</DialogTitle>
              <DialogDescription>Preencha os dados do aluno para cadastrá-lo no sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Nome *</label>
                <Input
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Email *</label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Curso *</label>
                <select
                  value={formData.courseId || ""}
                  onChange={(e) => setFormData({ ...formData, courseId: parseInt(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none bg-white"
                >
                  <option value="">Selecione um curso</option>
                  {Object.entries(coursesByType).map(([type, typeCourses]) => (
                    <optgroup key={type} label={typeLabels[type] || type}>
                      {typeCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Número de Matrícula (Opcional)</label>
                <Input
                  placeholder="Deixe em branco para gerar automaticamente"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleAddStudent}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Adicionar Aluno
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de Busca e Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, email ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCourseFilter || ""}
              onChange={(e) => setSelectedCourseFilter(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none bg-white"
            >
              <option value="">Todos os cursos</option>
              {Object.entries(coursesByType).map(([type, typeCourses]) => (
                <optgroup key={type} label={typeLabels[type] || type}>
                  {typeCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Alunos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Alunos Cadastrados ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhum aluno encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Nome</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Email</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Matrícula</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Curso</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{student.name}</td>
                      <td className="px-6 py-4 text-slate-600">{student.email}</td>
                      <td className="px-6 py-4 text-slate-600">{student.registrationNumber || "-"}</td>
                      <td className="px-6 py-4 text-slate-600">{student.courseName || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.status === "active"
                            ? "bg-green-100 text-green-800"
                            : student.status === "inactive"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {student.status === "active" ? "Ativo" : student.status === "inactive" ? "Inativo" : "Suspenso"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEditStudent(student)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => handleResetPassword(student)}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteStudent(student)}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Dialog de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
            <DialogDescription>Atualize os dados do aluno</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700">Nome *</label>
              <Input
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Email *</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleUpdateStudent}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
