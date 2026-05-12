import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, CreditCard, Search, Filter, CheckCircle2, Clock, AlertCircle, Percent, Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminPayments() {
  const [activeView, setActiveView] = useState<"list" | "settings">("list");
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Settings State
  const [dailyInterest, setDailyInterest] = useState("0.00");
  const [fixedPenalty, setFixedPenalty] = useState("0.00");
  const [gracePeriod, setGracePeriod] = useState(0);

  // Form State
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Queries
  const paymentsQuery = trpc.payments.listAll.useQuery();
  const studentsQuery = trpc.students.list.useQuery();
  const settingsQuery = trpc.payments.getSettings.useQuery(undefined, {
    onSuccess: (data) => {
      setDailyInterest(data.dailyInterestRate);
      setFixedPenalty(data.fixedPenaltyRate);
      setGracePeriod(data.gracePeriodDays);
    }
  });

  // Mutations
  const updateSettingsMutation = trpc.payments.updateSettings.useMutation({
    onSuccess: () => toast.success("Configurações salvas!"),
    onError: (err) => toast.error("Erro: " + err.message)
  });

  const createMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      toast.success("Mensalidade lançada!");
      setIsAdding(false);
      paymentsQuery.refetch();
    }
  });

  const markAsPaidMutation = trpc.payments.markAsPaid.useMutation({
    onSuccess: () => {
      toast.success("Pagamento registrado!");
      paymentsQuery.refetch();
    }
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      dailyInterestRate: dailyInterest,
      fixedPenaltyRate: fixedPenalty,
      gracePeriodDays: gracePeriod
    });
  };

  const filteredPayments = paymentsQuery.data?.filter(p => 
    p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestão Financeira</h2>
          <p className="text-slate-500 font-medium">Controle de mensalidades e regras de juros</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={activeView === "settings" ? "default" : "outline"}
            onClick={() => setActiveView(activeView === "settings" ? "list" : "settings")}
            className="gap-2 h-12 rounded-xl"
          >
            <Settings2 className="w-5 h-5" /> Regras de Juros
          </Button>
          <Button 
            onClick={() => { setActiveView("list"); setIsAdding(!isAdding); }}
            className="bg-slate-900 hover:bg-slate-800 gap-2 h-12 px-6 rounded-xl"
          >
            {isAdding ? "Cancelar" : <><Plus className="w-5 h-5" /> Lançar Mensalidade</>}
          </Button>
        </div>
      </div>

      {activeView === "settings" ? (
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-slate-900 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2"><Percent className="w-5 h-5 text-yellow-400" /> Configuração de Encargos</CardTitle>
            <CardDescription className="text-slate-400">Defina as taxas aplicadas automaticamente após o vencimento</CardDescription>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-black uppercase text-slate-500">Juros Diários (%)</label>
              <Input 
                type="number" 
                step="0.01"
                value={dailyInterest}
                onChange={(e) => setDailyInterest(e.target.value)}
                className="h-14 text-xl font-bold border-2 focus:border-yellow-400"
              />
              <p className="text-xs text-slate-400 italic">Cobrado a cada dia de atraso sobre o valor original.</p>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-black uppercase text-slate-500">Multa Fixa (%)</label>
              <Input 
                type="number" 
                step="0.01"
                value={fixedPenalty}
                onChange={(e) => setFixedPenalty(e.target.value)}
                className="h-14 text-xl font-bold border-2 focus:border-yellow-400"
              />
              <p className="text-xs text-slate-400 italic">Cobrada uma única vez assim que a parcela vence.</p>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-black uppercase text-slate-500">Carência (Dias)</label>
              <Input 
                type="number" 
                value={gracePeriod}
                onChange={(e) => setGracePeriod(parseInt(e.target.value))}
                className="h-14 text-xl font-bold border-2 focus:border-yellow-400"
              />
              <p className="text-xs text-slate-400 italic">Dias após o vencimento antes de começar a cobrar.</p>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="bg-green-600 hover:bg-green-700 h-12 px-10 font-bold"
              >
                {updateSettingsMutation.isPending ? <Loader2 className="animate-spin" /> : "Salvar Regras Financeiras"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {isAdding && (
            <Card className="border-2 border-yellow-400 shadow-xl bg-yellow-50/30">
              <CardHeader><CardTitle>Novo Lançamento</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select onValueChange={setSelectedUser}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                  <SelectContent>
                    {studentsQuery.data?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Título (Ex: Maio/2026)" value={title} onChange={e => setTitle(e.target.value)} className="h-12" />
                <Input type="number" placeholder="Valor R$" value={amount} onChange={e => setAmount(e.target.value)} className="h-12" />
                <div className="flex gap-2">
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-12" />
                  <Button onClick={() => createMutation.mutate({ userId: parseInt(selectedUser), title, amount, dueDate })} className="bg-green-600 h-12">Salvar</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Buscar aluno ou mensalidade..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-11 border-none bg-slate-50" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider">Aluno / Vencimento</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider">Título</th>
                      <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider">Valor Original</th>
                      <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider text-red-500">Juros/Multa</th>
                      <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider">Valor Atual</th>
                      <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{p.userName}</div>
                          <div className={`text-xs font-bold ${p.isOverdue && p.status !== 'paid' ? 'text-red-500' : 'text-slate-400'}`}>
                            Vence em: {new Date(p.dueDate).toLocaleDateString("pt-BR")}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{p.title}</td>
                        <td className="px-6 py-4 text-center font-bold">R$ {parseFloat(p.amount).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center font-bold text-red-500">
                          R$ {(parseFloat(p.interestAmount || "0") + parseFloat(p.penaltyAmount || "0")).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="font-black text-slate-900 text-lg">R$ {parseFloat(p.totalAmount).toFixed(2)}</div>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {p.status === 'paid' ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {p.status !== 'paid' && (
                            <Button size="sm" onClick={() => markAsPaidMutation.mutate({ paymentId: p.id, method: 'cash', finalAmount: p.totalAmount })} className="bg-green-600 hover:bg-green-700 text-xs">Dar Baixa</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
