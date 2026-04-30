import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, CreditCard, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";

export default function StudentPayment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  // Mock data - será substituído por tRPC query
  const payments = [
    {
      id: 1,
      month: "Janeiro/2026",
      amount: 1500.00,
      dueDate: "2026-01-10",
      status: "paid",
      paymentDate: "2026-01-08",
      paymentMethod: "PIX"
    },
    {
      id: 2,
      month: "Fevereiro/2026",
      amount: 1500.00,
      dueDate: "2026-02-10",
      status: "paid",
      paymentDate: "2026-02-09",
      paymentMethod: "Cartão"
    },
    {
      id: 3,
      month: "Março/2026",
      amount: 1500.00,
      dueDate: "2026-03-10",
      status: "pending",
      paymentDate: null,
      paymentMethod: null
    },
    {
      id: 4,
      month: "Abril/2026",
      amount: 1500.00,
      dueDate: "2026-04-10",
      status: "overdue",
      paymentDate: null,
      paymentMethod: null
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return { bg: "bg-green-100", text: "text-green-700", label: "Pago", icon: CheckCircle2 };
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pendente", icon: Clock };
      case "overdue":
        return { bg: "bg-red-100", text: "text-red-700", label: "Vencido", icon: AlertCircle };
      default:
        return { bg: "bg-slate-100", text: "text-slate-700", label: "Desconhecido", icon: AlertCircle };
    }
  };

  const totalPending = payments
    .filter(p => p.status === "pending" || p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/student")}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pagamentos</h1>
                <p className="text-slate-500 font-medium">Gerencie suas mensalidades e débitos</p>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aluno</p>
              <p className="text-lg font-black text-slate-900">{user?.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Pago</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-4xl font-black text-green-600">R$ {totalPaid.toFixed(2)}</p>
              <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pendente</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-4xl font-black text-red-600">R$ {totalPending.toFixed(2)}</p>
              <div className="p-3 bg-red-50 rounded-xl text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Anual</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-4xl font-black text-slate-900">R$ {(totalPaid + totalPending).toFixed(2)}</p>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                <CreditCard className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Pagamentos */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900">Histórico de Mensalidades</CardTitle>
                <CardDescription>Acompanhe o status de cada pagamento</CardDescription>
              </div>
              <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider">Mês</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider">Vencimento</th>
                    <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => {
                    const statusInfo = getStatusBadge(payment.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900">{payment.month}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-slate-600">
                            {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                          </p>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <p className="font-bold text-slate-900">R$ {payment.amount.toFixed(2)}</p>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bg}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${statusInfo.text}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {payment.status === "paid" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="text-green-600"
                            >
                              Comprovante
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setSelectedPayment(payment.id.toString())}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              Pagar Agora
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Pagamento */}
        <Card className="border-none shadow-sm mt-8 bg-blue-50 border-l-4 border-blue-400">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-2 text-sm">
            <p>✓ Aceitamos pagamento via <strong>PIX</strong> e <strong>Cartão de Crédito</strong></p>
            <p>✓ O PIX é processado instantaneamente</p>
            <p>✓ Cartão de crédito pode levar até 2 dias úteis para confirmação</p>
            <p>✓ Comprovantes são enviados automaticamente por e-mail</p>
            <p>✓ Débitos vencidos podem resultar em bloqueio de matrícula</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
