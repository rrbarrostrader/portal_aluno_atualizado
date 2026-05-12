import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit2, Trash2, Search, Loader2, Key, UserCheck, UserCog, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin" | "teacher";
  status: "active" | "inactive" | "suspended";
  cpf?: string;
  rg?: string;
  birthDate?: string;
  address?: string;
  phone?: string;
  createdAt: Date;
  registrationNumber?: string;
  courseName?: string;
  courseId?: number;
}

interface FormData {
  name: string;
  email: string;
  role: "user" | "admin" | "teacher";
  registrationNumber: string;
  courseId: number | null;
  cpf: string;
  rg: string;
  birthDate: string;
  address: string;
  phone: string;
}

export default function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    role: "user",
    registrationNumber: "",
    courseId: null,
    cpf: "",
    rg: "",
    birthDate: "",
    address: "",
    phone: "",
  });

  // Queries e Mutations do tRPC
  const { data: users = [], isLoading, refetch } = trpc.students.list.useQuery();
  const { data: courses = [] } = trpc.courses.list.useQuery();
  const createMutation = trpc.students.create.useMutation();
  const updateMutation = trpc.students.update.useMutation();
  const deleteMutation = trpc.students.delete.useMutation();
  const resetPasswordMutation = trpc.students.resetPassword.useMutation();

  const generateRegistrationNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `${year}${random}`;
  };

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      toast.error("Preencha nome, email e tipo de usuário");
      return;
    }

    if (formData.role === "user" && !formData.courseId) {
      toast.error("Alunos precisam estar vinculados a um curso");
      return;
    }

    try {
      const registrationNumber = formData.role === "user" 
        ? (formData.registrationNumber || generateRegistrationNumber())
        : undefined;
      
      await createMutation.mutateAsync({
        ...formData,
        courseId: formData.courseId || undefined,
        registrationNumber,
      });

      toast.success("Usuário cadastrado com sucesso!");
      setFormData({
        name: "", email: "", role: "user", registrationNumber: "", 
        courseId: null, cpf: "", rg: "", birthDate: "", address: "", phone: ""
      });
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar");
    }
  };

  const handleEditUser = (user: UserRecord) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role,
      registrationNumber: user.registrationNumber || "",
      courseId: user.courseId || null,
      cpf: user.cpf || "",
      rg: user.rg || "",
      birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
      address: user.address || "",
      phone: user.phone || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !formData.name || !formData.email) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingUser.id,
        ...formData,
      });

      toast.success("Usuário atualizado com sucesso!");
      setIsEditOpen(false);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.cpf?.includes(searchTerm) || false);
    
    const matchesRole = !selectedRoleFilter || user.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const roleLabels: Record<string, string> = {
    user: "Aluno",
    teacher: "Professor",
    admin: "Administrador",
  };

  const roleIcons: Record<string, any> = {
    user: GraduationCap,
    teacher: UserCheck,
    admin: UserCog,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Central de Cadastro</h2>
          <p className="text-slate-500 mt-1">Gerencie Alunos, Professores e Administradores</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cadastro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Novo Cadastro de Usuário</DialogTitle>
              <DialogDescription>Preencha as informações básicas e documentos</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Tipo de Usuário *</label>
                <div className="flex gap-4 mt-2">
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="role" 
                        value={role} 
                        checked={formData.role === role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Nome Completo *</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">E-mail *</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">CPF</label>
                <Input value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">RG</label>
                <Input value={formData.rg} onChange={(e) => setFormData({...formData, rg: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Data de Nascimento</label>
                <Input type="date" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Telefone</label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Endereço Completo</label>
                <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
              
              {formData.role === "user" && (
                <>
                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h4 className="font-bold text-slate-900 mb-2">Dados Acadêmicos</h4>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700">Curso *</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={formData.courseId || ""}
                      onChange={(e) => setFormData({...formData, courseId: Number(e.target.value)})}
                    >
                      <option value="">Selecione um curso</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700">Matrícula</label>
                    <Input value={formData.registrationNumber} onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})} placeholder="Gerado automaticamente se vazio" />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddUser} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Cadastro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input placeholder="Buscar por nome, email ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <select 
              className="p-2 border rounded-md min-w-[200px]"
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
            >
              <option value="">Todos os Tipos</option>
              <option value="user">Alunos</option>
              <option value="teacher">Professores</option>
              <option value="admin">Administradores</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
        ) : filteredUsers.length === 0 ? (
          <Card className="py-12 text-center text-slate-500">Nenhum usuário encontrado.</Card>
        ) : (
          filteredUsers.map((user) => {
            const Icon = roleIcons[user.role] || Users;
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{user.name}</h3>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {roleLabels[user.role]}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      <div className="flex gap-3 mt-1 text-xs text-slate-400">
                        {user.cpf && <span>CPF: {user.cpf}</span>}
                        {user.registrationNumber && <span>Matrícula: {user.registrationNumber}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate({id: user.id})}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog de Edição similar ao de Cadastro */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle>Editar Cadastro</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campos de formulário idênticos ao cadastro */}
            <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Tipo de Usuário *</label>
                <div className="flex gap-4 mt-2">
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="edit-role" 
                        value={role} 
                        checked={formData.role === role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Nome Completo *</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">E-mail *</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">CPF</label>
                <Input value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">RG</label>
                <Input value={formData.rg} onChange={(e) => setFormData({...formData, rg: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Telefone</label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Endereço Completo</label>
                <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUpdateUser} disabled={updateMutation.isPending}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
