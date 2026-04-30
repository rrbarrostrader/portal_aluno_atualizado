import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function StudentSecretaria() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDeclaration = async () => {
    setIsGenerating(true);
    try {
      toast.info("Gerando Declaração de Matrícula...");
      // Aqui seria chamada a função de geração de PDF
      // await generateDeclarationMutation.mutateAsync({ enrollmentId: 1 });
      setTimeout(() => {
        toast.success("Declaração gerada com sucesso!");
        setIsGenerating(false);
      }, 1500);
    } catch (error) {
      toast.error("Erro ao gerar declaração");
      setIsGenerating(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      toast.info("Gerando Relatório Acadêmico...");
      // Aqui seria chamada a função de geração de PDF
      // await generateReportMutation.mutateAsync({ enrollmentId: 1 });
      setTimeout(() => {
        toast.success("Relatório gerado com sucesso!");
        setIsGenerating(false);
      }, 1500);
    } catch (error) {
      toast.error("Erro ao gerar relatório");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/student")}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Secretaria Digital</h1>
          <p className="text-slate-600 mt-2">Gere documentos acadêmicos em PDF</p>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Documentos Disponíveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Declaração de Matrícula */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                Declaração de Matrícula
              </CardTitle>
              <CardDescription>
                Documento oficial comprovando sua matrícula no curso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                A Declaração de Matrícula é um documento oficial que comprova seu vínculo acadêmico com a instituição. 
                Pode ser utilizado para fins de comprovação de matrícula em órgãos públicos e privados.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-600">
                  <strong>Informações incluídas:</strong>
                  <br />• Nome completo
                  <br />• Número de matrícula
                  <br />• Curso
                  <br />• Data de matrícula
                  <br />• Status atual
                </p>
              </div>
              <Button
                onClick={handleGenerateDeclaration}
                disabled={isGenerating}
                className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Gerar Declaração
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Relatório Acadêmico */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Relatório Acadêmico
              </CardTitle>
              <CardDescription>
                Relatório completo de seu desempenho acadêmico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                O Relatório Acadêmico apresenta um resumo detalhado de seu desempenho, incluindo notas, 
                frequência e histórico de disciplinas cursadas.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-600">
                  <strong>Informações incluídas:</strong>
                  <br />• Notas por disciplina
                  <br />• Frequência geral
                  <br />• Média de desempenho
                  <br />• Status de aprovação
                  <br />• Histórico por período
                </p>
              </div>
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Documentos */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos Gerados Recentemente</CardTitle>
            <CardDescription>Seus últimos documentos gerados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-slate-900">Declaração de Matrícula</p>
                    <p className="text-xs text-slate-500">Gerado em 17 de março de 2026</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Baixar
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-slate-900">Relatório Acadêmico</p>
                    <p className="text-xs text-slate-500">Gerado em 10 de março de 2026</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Baixar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
