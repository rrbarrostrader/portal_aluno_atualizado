import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Loader2, GraduationCap, Mail, Phone, CreditCard, Key, Filter, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", role: "user" as any, courseId: null as number | null,
    cpf: "", rg: "", birthDate: "", address: "", phone: "", registrationNumber: "",
  });

  const { data: users = [], isLoading, refetch } = trpc.students.list.useQuery();
  const { data: courses = [] } = trpc.courses.list.useQuery();

  const createMutation = trpc.students.create.useMutation({
    onSuccess: () => { toast.success("Usuário cadastrado!"); setIsOpen(false); refetch(); }
  });

  const deleteMutation = trpc.students.delete.useMutation({
    onSuccess: () => { toast.success("Usuário excluído!"); refetch(); }
  });

  const resetPasswordMutation = trpc.students.resetPassword.useMutation({
    onSuccess: () => { toast.success("Senha resetada para o padrão (123456)!"); }
  });

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cpf?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Gestão de Alunos e Equipe</h2>
          <p className="text-slate-500">Lista completa de usuários do sistema</p>
        </div>
        <Button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold" onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Cadastro
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Buscar por nome, e-mail ou CPF..." 
              className="pl-10 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-bold">Nome / E-mail</th>
                  <th className="px-6 py-4 font-bold">Tipo</th>
                  <th className="px-6 py-4 font-bold">CPF / Telefone</th>
                  <th className="px-6 py-4 font-bold">Curso</th>
                  <th className="px-6 py-4 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-yellow-400" /></td></tr>
                ) : filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        user.role === 'admin' ? 'bg-red-100 text-red-600' : 
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {user.role === 'user' ? 'Aluno' : user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{user.cpf || "---"}</div>
                      <div className="text-xs text-slate-500">{user.phone || "---"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        {user.role === 'user' ? (
                          <><GraduationCap className="w-3 h-3" /> {user.courseName || "Não matriculado"}</>
                        ) : "---"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => {
                        if(confirm("Resetar senha para 123456?")) resetPasswordMutation.mutate({id: user.id});
                      }}>
                        <Key className="w-3 h-3 mr-1" /> Reset
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600" onClick={() => {
                        if(confirm("Excluir usuário permanentemente?")) deleteMutation.mutate({id: user.id});
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle>Novo Cadastro</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Tipo de Usuário *</label>
              <select className="w-full p-2 border rounded-md mt-1" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                <option value="user">Aluno</option>
                <option value="teacher">Professor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <Input placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <Input placeholder="E-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <Input placeholder="CPF" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
            <Input placeholder="RG" value={formData.rg} onChange={e => setFormData({...formData, rg: e.target.value})} />
            <Input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
            <Input placeholder="Telefone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <div className="md:col-span-2">
              <Input placeholder="Endereço Completo" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            {formData.role === 'user' && (
              <div className="md:col-span-2 grid grid-cols-2 gap-4 border-t pt-4">
                <select className="w-full p-2 border rounded-md" value={formData.courseId || ""} onChange={e => setFormData({...formData, courseId: Number(e.target.value)})}>
                  <option value="">Selecione o Curso</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Input placeholder="Matrícula (Auto)" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
              </div>
            )}
          </div>
          <Button className="w-full bg-slate-900 mt-6" onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Cadastro"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
