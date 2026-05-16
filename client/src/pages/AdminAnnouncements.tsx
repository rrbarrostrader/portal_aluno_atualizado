import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Bell, Plus, Edit2, Trash2, Loader2, Send, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const utils = trpc.useContext();
  const announcementsQuery = trpc.announcements.listAll.useQuery();
  
  const createMutation = trpc.announcements.create.useMutation();
  const updateMutation = trpc.announcements.update.useMutation();
  const deleteMutation = trpc.announcements.delete.useMutation();
  const togglePublishMutation = trpc.announcements.togglePublish.useMutation();

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Título e conteúdo são obrigatórios");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...formData });
        toast.success("Aviso atualizado!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Aviso criado!");
      }
      resetForm();
      utils.announcements.listAll.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    }
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", type: "general", targetRole: "all", priority: "medium", published: false });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleEdit = (ann: any) => {
    setEditingId(ann.id);
    setFormData({
      title: ann.title,
      content: ann.content,
      type: ann.type,
      targetRole: ann.targetRole,
      priority: ann.priority,
      published: ann.published,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Deseja realmente excluir este aviso?")) {
      await deleteMutation.mutateAsync({ id });
      utils.announcements.listAll.invalidate();
      toast.success("Aviso excluído");
    }
  };

  const handleTogglePublish = async (id: number, current: boolean) => {
    await togglePublishMutation.mutateAsync({ id, published: !current });
    utils.announcements.listAll.invalidate();
    toast.success(!current ? "Aviso publicado!" : "Aviso removido do portal");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-yellow-500" /> Gerenciar Avisos
          </h2>
          <p className="text-slate-500">Crie e gerencie comunicados para alunos e administradores</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold" onClick={() => resetForm()}>
              <Plus className="w-4 h-4" /> Novo Aviso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Aviso" : "Novo Comunicado"}</DialogTitle>
              <DialogDescription>Preencha os detalhes do aviso abaixo.</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Título do Aviso</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Início das Rematrículas" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="academic">Acadêmico</SelectItem>
                      <SelectItem value="financial">Financeiro</SelectItem>
                      <SelectItem value="administrative">Administrativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(v: any) => setFormData({...formData, priority: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Conteúdo do Aviso</Label>
                <Textarea rows={5} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Escreva a mensagem aqui..." />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input type="checkbox" id="pub" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})} className="w-4 h-4 accent-yellow-500" />
                <Label htmlFor="pub" className="cursor-pointer">Publicar imediatamente no portal</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-slate-900 text-white hover:bg-slate-800">
                {createMutation.isLoading || updateMutation.isLoading ? <Loader2 className="animate-spin" /> : "Salvar Aviso"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Avisos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {announcementsQuery.isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {announcementsQuery.data?.length === 0 ? (
                <div className="text-center py-20 text-slate-400 italic">Nenhum aviso cadastrado.</div>
              ) : (
                announcementsQuery.data?.map((ann: any) => (
                  <div key={ann.id} className="p-6 flex items-start justify-between hover:bg-slate-50/50 transition-colors group">
                    <div className="flex gap-4">
                      <div className={`mt-1 w-2 h-2 rounded-full ${ann.priority === 'high' ? 'bg-red-500 animate-pulse' : ann.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{ann.title}</h3>
                          {!ann.published && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">Rascunho</span>}
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">{ann.content}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium uppercase tracking-tighter">
                          <span>{ann.type}</span>
                          <span>•</span>
                          <span>{ann.publishedAt ? format(new Date(ann.publishedAt), "dd 'de' MMMM", { locale: ptBR }) : 'Não publicado'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleTogglePublish(ann.id, ann.published)}>
                        {ann.published ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-blue-500" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(ann)}>
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(ann.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
