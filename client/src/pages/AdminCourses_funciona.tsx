import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminCourses() {
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    description: "",
    type: "graduation" as const,
    duration: 48,
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

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.code) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate(newCourse);
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
  const coursesByType = {
    graduation: courses.filter((c) => c.type === "graduation"),
    postgraduate: courses.filter((c) => c.type === "postgraduate"),
    technical: courses.filter((c) => c.type === "technical"),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Gerenciar Cursos</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleSeedCourses}
            disabled={seedMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {seedMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Carregar Cursos Padrão
          </Button>
          <Button
            onClick={() => setIsAddingCourse(!isAddingCourse)}
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Curso
          </Button>
        </div>
      </div>

      {/* Formulário de Novo Curso */}
      {isAddingCourse && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Adicionar Novo Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome do Curso *
                  </label>
                  <input
                    type="text"
                    value={newCourse.name}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Ex: Administração"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={newCourse.code}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Ex: ADM-001"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Descrição do curso"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={newCourse.type}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="graduation">Graduação</option>
                    <option value="postgraduate">Pós-graduação</option>
                    <option value="technical">Técnico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duração (horas)
                  </label>
                  <input
                    type="number"
                    value={newCourse.duration}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        duration: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {createMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Salvar
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsAddingCourse(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Cursos por Tipo */}
      {coursesQuery.isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Carregando cursos...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Graduação */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Graduação ({coursesByType.graduation.length})
            </h3>
            {coursesByType.graduation.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coursesByType.graduation.map((course) => (
                  <Card key={course.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{course.name}</CardTitle>
                      <CardDescription>{course.code}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">
                        {course.description || "Sem descrição"}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">Nenhum curso de graduação cadastrado</p>
            )}
          </div>

          {/* Pós-graduação */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Pós-graduação ({coursesByType.postgraduate.length})
            </h3>
            {coursesByType.postgraduate.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coursesByType.postgraduate.map((course) => (
                  <Card key={course.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{course.name}</CardTitle>
                      <CardDescription>{course.code}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">
                        {course.description || "Sem descrição"}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">Nenhum curso de pós-graduação cadastrado</p>
            )}
          </div>

          {/* Técnicos */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Técnicos ({coursesByType.technical.length})
            </h3>
            {coursesByType.technical.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coursesByType.technical.map((course) => (
                  <Card key={course.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{course.name}</CardTitle>
                      <CardDescription>{course.code}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">
                        {course.description || "Sem descrição"}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">Nenhum curso técnico cadastrado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
