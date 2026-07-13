import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Loader2, GraduationCap, Mail, Phone, CreditCard, Key, Filter, MoreVertical, User } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">Gestão de Usuários</h2>
          <p className="text-sm text-slate-500">Alunos, professores e administradores</p>
        </div>
        <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-12" onClick={() => setIsOpen(true)}>
          <Plus className="w-5 h-5 mr-2" /> Novo Cadastro
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 md:p-6 bg-white">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              placeholder="Buscar por nome, e-mail ou CPF..." 
              className="pl-12 h-12 md:h-14 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center bg-white rounded-3xl shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-yellow-400" />
            <p className="mt-4 text-slate-400 font-medium">Carregando usuários...</p>
          </div>
        ) : (
          <>
            {/* Versão Desktop: Tabela */}
            <Card className="hidden lg:block border-none shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome / E-mail</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento / Fone</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Curso</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                            user.role === 'admin' ? 'bg-red-100 text-red-600' : 
                            user.role === 'teacher' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {user.role === 'user' ? 'Aluno' : user.role === 'teacher' ? 'Professor' : 'Admin'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-medium text-slate-700">{user.cpf || "---"}</div>
                          <div className="text-[10px] font-bold text-slate-400">{user.phone || "---"}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-slate-600">
                            {user.role === 'user' ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700">{user.courseName || "Sem Curso"}</span>
                                <span className="text-[10px] font-black text-yellow-600 uppercase">RA: {user.registrationNumber || "---"}</span>
                              </div>
                            ) : "---"}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right space-x-2">
                          <Button variant="outline" size="sm" className="h-9 rounded-lg text-blue-600 border-blue-100 hover:bg-blue-50" onClick={() => {
                            if(confirm("Resetar senha para o padrão?")) resetPasswordMutation.mutate({userId: user.id});
                          }}>
                            <Key className="w-3.5 h-3.5 mr-1.5" /> Senha
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => {
                            if(confirm("Excluir usuário permanentemente?")) deleteMutation.mutate({id: user.id});
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Versão Mobile: Cards */}
            <div className="lg:hidden space-y-4">
              {filteredUsers.map(user => (
                <Card key={user.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                  <div className="p-4 flex items-center justify-between border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-red-50 text-red-500' : 
                        user.role === 'teacher' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'
                      }`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{user.name}</h4>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                          user.role === 'admin' ? 'text-red-500' : 
                          user.role === 'teacher' ? 'text-blue-500' : 'text-green-500'
                        }`}>
                          {user.role === 'user' ? 'Aluno' : user.role === 'teacher' ? 'Professor' : 'Admin'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500" onClick={() => resetPasswordMutation.mutate({userId: user.id})}>
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400" onClick={() => deleteMutation.mutate({id: user.id})}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4 bg-slate-50/30">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail</p>
                      <p className="text-xs font-medium text-slate-700 truncate">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CPF</p>
                      <p className="text-xs font-medium text-slate-700">{user.cpf || "---"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Curso / RA</p>
                      <p className="text-xs font-bold text-slate-800">
                        {user.role === 'user' ? `${user.courseName || "Sem Curso"} • ${user.registrationNumber || "---"}` : "N/A"}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh] rounded-3xl p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">Novo Cadastro</DialogTitle>
            <DialogDescription>Preencha os dados do novo usuário do sistema.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Usuário *</label>
              <select className="w-full h-12 px-4 border-slate-100 bg-slate-50 rounded-xl mt-1 font-bold text-slate-700 focus:bg-white transition-all outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                <option value="user">Aluno</option>
                <option value="teacher">Professor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <Input className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="Ex: João Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <Input className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="exemplo@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <Input className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="CPF" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
            <Input className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="RG" value={formData.rg} onChange={e => setFormData({...formData, rg: e.target.value})} />
            <Input className="h-12 rounded-xl bg-slate-50 border-slate-100" type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
            <Input className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="Telefone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <div className="md:col-span-2">
              <Input className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="Endereço Completo" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            {formData.role === 'user' && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6 mt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Curso</label>
                  <select className="w-full h-12 px-4 border-slate-100 bg-slate-50 rounded-xl font-bold text-slate-700 focus:bg-white transition-all outline-none" value={formData.courseId || ""} onChange={e => setFormData({...formData, courseId: Number(e.target.value)})}>
                    <option value="">Selecione o Curso</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula (Opcional)</label>
                  <Input className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="Deixe vazio para auto-gerar" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
                </div>
              </div>
            )}
          </div>
          <Button className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl mt-8 shadow-xl shadow-slate-200" onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "FINALIZAR CADASTRO"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
