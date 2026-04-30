import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Plus, Edit2, Trash2, Loader2, Send, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface FormData {
  title: string;
  content: string;
  type: "general" | "academic" | "financial" | "administrative";
  targetRole: "all" | "students" | "admins";
  priority: "low" | "medium" | "high";
  published: boolean;
}

export default function AdminAnnouncements() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    type: "general",
    targetRole: "all",
    priority: "medium",
    published: false,
  });

  // Queries e Mutations
  const { data: announcements = [], isLoading, refetch } = trpc.announcements.listAll.useQuery();
  const createMutation = trpc.announcements.create.useMutation();
  const updateMutation = trpc.announcements.update.useMutation();
  const deleteMutation = trpc.announcements.delete.useMutation();
  const togglePublishMutation = trpc.announcements.togglePublish.useMutation();

  const handleAddAnnouncement = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success("Aviso atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Aviso criado com sucesso!");
      }

      setFormData({
        title: "",
        content: "",
        type: "general",
        targetRole: "all",
        priority: "medium",
        published: false,
      });
      setEditingId(null);
      setIsOpen(false);
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar aviso";
      toast.error(errorMessage);
    }
  };

  const handleEditAnnouncement = (announcement: any) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      targetRole: announcement.targetRole,
      priority: announcement.priority,
      published: announcement.published,
    });
    setIsOpen(true);
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este aviso?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Aviso deletado com sucesso!");
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao deletar aviso";
      toast.error(errorMessage);
    }
  };

  const handleTogglePublish = async (id: number, currentPublished: boolean) => {
    try {
      await togglePublishMutation.mutateAsync({
        id,
        published: !currentPublished,
      });
      toast.success(!currentPublished ? "Aviso publicado!" : "Aviso despublicado!");
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao publicar/despublicar";
      toast.error(errorMessage);
    }
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      title: "",
      content: "",
      type: "general",
      targetRole: "all",
      priority: "medium",
      published: false,
    });
  };

  const typeLabels = {
    general: "Geral",
    academic: "Acadêmico",
    financial: "Financeiro",
    administrative: "Administrativo",
  };

  const typeColors = {
    general: "bg-blue-100 text-blue-800",
    academic: "bg-purple-100 text-purple-800",
    financial: "bg-green-100 text-green-800",
    administrative: "bg-orange-100 text-orange-800",
  };

  const priorityLabels = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
  };

  const priorityColors = {
    low: "bg-slate-100 text-slate-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const targetLabels = {
    all: "Todos",
    students: "Alunos",
    admins: "Administradores",
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-8 h-8 text-yellow-500" />
            Gerenciar Avisos
          </h2>
          <p className="text-slate-500 mt-1">Crie e gerencie avisos para alunos e administradores</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Aviso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Aviso" : "Criar Novo Aviso"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Atualize as informações do aviso" : "Preencha os dados do novo aviso"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Título *</label>
                <Input
                  placeholder="Título do aviso"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Conteúdo *</label>
                <textarea
                  placeholder="Conteúdo do aviso"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none bg-white"
                  >
                    <option value="general">Geral</option>
                    <option value="academic">Acadêmico</option>
                    <option value="financial">Financeiro</option>
                    <option value="administrative">Administrativo</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none bg-white"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">Público Alvo</label>
                  <select
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none bg-white"
                  >
                    <option value="all">Todos</option>
                    <option value="students">Alunos</option>
                    <option value="admins">Administradores</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-sm font-bold text-slate-700">Publicar agora</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  onClick={handleAddAnnouncement}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {editingId ? "Atualizar Aviso" : "Criar Aviso"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de Avisos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Avisos Cadastrados ({announcements.length})
          </CardTitle>
          <CardDescription>Gerencie todos os avisos do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhum aviso cadastrado. Crie um novo aviso para começar.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement: any) => (
                <div
                  key={announcement.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-slate-900">{announcement.title}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${typeColors[announcement.type]}`}>
                          {typeLabels[announcement.type]}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${priorityColors[announcement.priority]}`}>
                          {priorityLabels[announcement.priority]}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-800">
                          {targetLabels[announcement.targetRole]}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-2">{announcement.content}</p>
                      <p className="text-xs text-slate-400">
                        Criado em: {new Date(announcement.createdAt).toLocaleDateString("pt-BR")}
                        {announcement.publishedAt && ` • Publicado em: ${new Date(announcement.publishedAt).toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={announcement.published ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}
                        onClick={() => handleTogglePublish(announcement.id, announcement.published)}
                        disabled={togglePublishMutation.isPending}
                      >
                        {announcement.published ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleEditAnnouncement(announcement)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
