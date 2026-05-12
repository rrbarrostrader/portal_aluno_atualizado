import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, CreditCard, AlertCircle, CheckCircle2, Clock, Calendar } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function StudentPayment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Buscar pagamentos REAIS do aluno
  const paymentsQuery = trpc.payments.getMyPayments.useQuery();

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === "paid") {
      return { bg: "bg-green-100", text: "text-green-700", label: "Liquidado", icon: CheckCircle2 };
    }

    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (due < today) {
      return { bg: "bg-red-100", text: "text-red-700", label: "Vencido", icon: AlertCircle };
    }
    
    if (due.getTime() === today.getTime()) {
      return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Vence Hoje", icon: Clock };
    }

    return { bg: "bg-blue-100", text: "text-blue-700", label: "A Vencer", icon: Clock };
  };

  const payments = paymentsQuery.data || [];

  // CORREÇÃO: Somar apenas o que já VENCEU (data menor que hoje)
  const totalOverdue = payments
    .filter(p => {
      if (p.status === "paid") return false;
      const due = new Date(p.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      return due < today; // Apenas se a data de vencimento for menor que hoje
    })
    .reduce((sum, p) => sum + parseFloat(p.totalAmount.toString()), 0);

  // Somar o que ainda vai vencer (incluindo hoje)
  const totalUpcoming = payments
    .filter(p => {
      if (p.status === "paid") return false;
      const due = new Date(p.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      return due >= today; // Hoje ou futuro
    })
    .reduce((sum, p) => sum + parseFloat(p.totalAmount.toString()), 0);

  const totalPaid = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + parseFloat(p.totalAmount.toString()), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/student")} className="rounded-full"><ArrowLeft /></Button>
            <h1 className="text-2xl font-black text-slate-900">Financeiro</h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Matrícula Ativa</p>
            <p className="font-black text-slate-900">{user?.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-green-600 text-white">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase opacity-80">Total Liquidado</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-3xl font-black">R$ {totalPaid.toFixed(2)}</p>
              <CheckCircle2 className="w-8 h-8 opacity-20" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white border-l-4 border-red-500">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-red-500">Vencido (Débito Real)</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-3xl font-black text-red-600">R$ {totalOverdue.toFixed(2)}</p>
              <AlertCircle className="w-8 h-8 text-red-100" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-slate-900 text-white">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase opacity-80">A Vencer (Futuro)</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-3xl font-black">R$ {totalUpcoming.toFixed(2)}</p>
              <Clock className="w-8 h-8 opacity-20" />
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Mensalidades */}
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black">Histórico de Mensalidades</CardTitle>
              <CardDescription>Valores atualizados com juros e multa em caso de atraso</CardDescription>
            </div>
            <Calendar className="text-slate-200 w-10 h-10" />
          </CardHeader>
          <CardContent className="p-0">
            {paymentsQuery.isLoading ? (
              <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-yellow-500" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase">Mensalidade</th>
                      <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase">Vencimento</th>
                      <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase">Situação</th>
                      <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase">Valor Original</th>
                      <th className="px-6 py-4 text-center font-bold text-red-500 uppercase">Encargos</th>
                      <th className="px-6 py-4 text-center font-bold text-slate-900 uppercase">Total a Pagar</th>
                      <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p: any) => {
                      const status = getStatusBadge(p.status, p.dueDate);
                      const StatusIcon = status.icon;
                      const charges = parseFloat(p.interestAmount || "0") + parseFloat(p.penaltyAmount || "0");
                      
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5 font-black text-slate-900">{p.title}</td>
                          <td className="px-6 py-5 text-center font-medium text-slate-600">
                            {new Date(p.dueDate).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${status.bg} ${status.text}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center text-slate-500 font-medium">R$ {parseFloat(p.amount).toFixed(2)}</td>
                          <td className="px-6 py-5 text-center text-red-500 font-bold">
                            {charges > 0 ? `+ R$ ${charges.toFixed(2)}` : "-"}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <p className="text-lg font-black text-slate-900">R$ {parseFloat(p.totalAmount).toFixed(2)}</p>
                          </td>
                          <td className="px-6 py-5 text-center">
                            {p.status === "paid" ? (
                              <Button variant="outline" size="sm" className="text-green-600 font-bold border-green-200 bg-green-50">Comprovante</Button>
                            ) : (
                              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6">Pagar</Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
