import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, FileText, Download, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function StudentSecretaria() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<number | null>(null);

  // Buscar matrículas do aluno
  const enrollmentsQuery = trpc.students.getMyEnrollments.useQuery();

  // Buscar notas para gerar relatório
  const gradesQuery = trpc.students.getMyGrades.useQuery(
    { enrollmentId: selectedEnrollment || 0, semester: 1 },
    { enabled: !!selectedEnrollment }
  );

  // Selecionar a primeira matrícula automaticamente
  useEffect(() => {
    if (enrollmentsQuery.data && enrollmentsQuery.data.length > 0 && !selectedEnrollment) {
      setSelectedEnrollment(enrollmentsQuery.data[0].id);
    }
  }, [enrollmentsQuery.data, selectedEnrollment]);

  const enrollments = enrollmentsQuery.data || [];
  const currentEnrollment = enrollments.find(e => e.id === selectedEnrollment);

  const generateDeclarationPDF = () => {
    if (!currentEnrollment) {
      toast.error("Selecione uma matrícula primeiro");
      return;
    }

    setIsGenerating(true);
    try {
      // Criar conteúdo HTML para o PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
            }
            .content {
              line-height: 1.8;
              margin-bottom: 30px;
            }
            .field {
              margin-bottom: 15px;
            }
            .label {
              font-weight: bold;
              color: #333;
            }
            .value {
              margin-left: 10px;
              color: #666;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
            .signature-line {
              margin-top: 50px;
              border-top: 1px solid #333;
              width: 200px;
              margin-left: auto;
              margin-right: auto;
              padding-top: 10px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">DECLARAÇÃO DE MATRÍCULA</div>
            <div class="subtitle">Documento Oficial</div>
          </div>
          
          <div class="content">
            <p>Declaramos, para os devidos fins, que o(a) aluno(a) abaixo identificado(a) encontra-se regularmente matriculado(a) nesta instituição:</p>
            
            <div class="field">
              <span class="label">Nome do Aluno(a):</span>
              <span class="value">${user?.name || "N/A"}</span>
            </div>
            
            <div class="field">
              <span class="label">Número de Matrícula:</span>
              <span class="value">${currentEnrollment.registrationNumber || "N/A"}</span>
            </div>
            
            <div class="field">
              <span class="label">Curso:</span>
              <span class="value">${currentEnrollment.courseName || "N/A"}</span>
            </div>
            
            <div class="field">
              <span class="label">Data de Matrícula:</span>
              <span class="value">${new Date(currentEnrollment.enrollmentDate).toLocaleDateString("pt-BR")}</span>
            </div>
            
            <div class="field">
              <span class="label">Semestre Atual:</span>
              <span class="value">${currentEnrollment.currentSemester}º Semestre</span>
            </div>
            
            <div class="field">
              <span class="label">Status:</span>
              <span class="value">${currentEnrollment.status === "active" ? "Ativo" : "Inativo"}</span>
            </div>
            
            <p style="margin-top: 30px;">Esta declaração é válida para fins de comprovação de matrícula junto a órgãos públicos e privados.</p>
          </div>
          
          <div class="signature-line">
            Secretaria Acadêmica
          </div>
          
          <div class="footer">
            <p>Documento gerado automaticamente em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
          </div>
        </body>
        </html>
      `;

      // Criar blob e fazer download
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `declaracao-matricula-${currentEnrollment.registrationNumber}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Declaração de Matrícula gerada com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar declaração");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportPDF = () => {
    if (!currentEnrollment) {
      toast.error("Selecione uma matrícula primeiro");
      return;
    }

    setIsGenerating(true);
    try {
      // Calcular estatísticas
      const totalGrades = gradesQuery.data || [];
      const averageGrade = totalGrades.length > 0
        ? (totalGrades.reduce((sum, g) => sum + (g.finalGrade || 0), 0) / totalGrades.length).toFixed(2)
        : "0.00";
      const approvedCount = totalGrades.filter(g => g.status === "approved").length;

      // Criar conteúdo HTML para o PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 15px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .field {
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
            }
            .label {
              font-weight: bold;
              color: #333;
            }
            .value {
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">RELATÓRIO ACADÊMICO</div>
            <div class="subtitle">Histórico de Desempenho</div>
          </div>
          
          <div class="section">
            <div class="section-title">Informações do Aluno</div>
            <div class="field">
              <span class="label">Nome:</span>
              <span class="value">${user?.name || "N/A"}</span>
            </div>
            <div class="field">
              <span class="label">Matrícula:</span>
              <span class="value">${currentEnrollment.registrationNumber || "N/A"}</span>
            </div>
            <div class="field">
              <span class="label">Curso:</span>
              <span class="value">${currentEnrollment.courseName || "N/A"}</span>
            </div>
            <div class="field">
              <span class="label">Semestre Atual:</span>
              <span class="value">${currentEnrollment.currentSemester}º</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Resumo Acadêmico</div>
            <div class="field">
              <span class="label">Total de Disciplinas:</span>
              <span class="value">${totalGrades.length}</span>
            </div>
            <div class="field">
              <span class="label">Disciplinas Aprovadas:</span>
              <span class="value">${approvedCount}</span>
            </div>
            <div class="field">
              <span class="label">Média Geral:</span>
              <span class="value">${averageGrade}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Histórico de Disciplinas</div>
            <table>
              <thead>
                <tr>
                  <th>Disciplina</th>
                  <th>Código</th>
                  <th>Nota Final</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${totalGrades.map(g => `
                  <tr>
                    <td>${g.subjectName}</td>
                    <td>${g.subjectCode}</td>
                    <td>${g.finalGrade ? g.finalGrade.toFixed(1) : "-"}</td>
                    <td>${g.status === "approved" ? "Aprovado" : g.status === "failed" ? "Reprovado" : "Pendente"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>Documento gerado automaticamente em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
          </div>
        </body>
        </html>
      `;

      // Criar blob e fazer download
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-academico-${currentEnrollment.registrationNumber}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Relatório Acadêmico gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    } finally {
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
          <p className="text-slate-600 mt-2">Gere documentos acadêmicos</p>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {enrollmentsQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
            <p className="text-slate-500 font-bold">Carregando informações...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <FileText className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-slate-900">Nenhuma matrícula encontrada</h3>
              <p className="text-slate-500">Você precisa estar matriculado em um curso para gerar documentos.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Seletor de Matrícula */}
            {enrollments.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Selecione a Matrícula</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {enrollments.map((enrollment) => (
                      <button
                        key={enrollment.id}
                        onClick={() => setSelectedEnrollment(enrollment.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedEnrollment === enrollment.id
                            ? "bg-yellow-400 text-slate-900"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {enrollment.courseName}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documentos Disponíveis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    onClick={generateDeclarationPDF}
                    disabled={isGenerating || !currentEnrollment}
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
                      <br />• Média de desempenho
                      <br />• Status de aprovação
                      <br />• Histórico por período
                    </p>
                  </div>
                  <Button
                    onClick={generateReportPDF}
                    disabled={isGenerating || !currentEnrollment}
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

            {/* Informações da Matrícula Selecionada */}
            {currentEnrollment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Informações da Matrícula
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Curso</p>
                      <p className="font-bold text-slate-900">{currentEnrollment.courseName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Número de Matrícula</p>
                      <p className="font-bold text-slate-900">{currentEnrollment.registrationNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Data de Matrícula</p>
                      <p className="font-bold text-slate-900">{new Date(currentEnrollment.enrollmentDate).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Semestre Atual</p>
                      <p className="font-bold text-slate-900">{currentEnrollment.currentSemester}º Semestre</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
