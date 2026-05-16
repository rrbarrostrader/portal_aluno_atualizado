import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, FileText, Download, Loader2, Calendar, Printer } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function StudentSecretaria() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const declarationDataQuery = trpc.secretary.getDeclarationData.useQuery();
  const transcriptDataQuery = trpc.secretary.getTranscriptData.useQuery();
  const programContentQuery = trpc.secretary.getProgramContentData.useQuery();

  const generatePDF = (htmlContent: string, title: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      toast.success(`${title} gerado com sucesso!`);
    }
  };

  const calculateAverage = (g: any) => {
    const b1 = parseFloat(g.firstbimester) || 0;
    const b2 = parseFloat(g.secondbimester) || 0;
    const b3 = parseFloat(g.thirdbimester) || 0;
    const b4 = parseFloat(g.fourthbimester) || 0;
    const count = [g.firstbimester, g.secondbimester, g.thirdbimester, g.fourthbimester].filter(v => v !== null && v !== "").length;
    if (count === 0) return "-";
    return ((b1 + b2 + b3 + b4) / 4).toFixed(1);
  };

  const handlePrintDeclaration = () => {
    if (!declarationDataQuery.data) return toast.error("Dados não carregados");
    const data = declarationDataQuery.data;
    
    const html = `
      <html>
        <head>
          <title>Declaração de Matrícula</title>
          <style>
            body { font-family: Arial; padding: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #0d3b66; margin-bottom: 30px; padding-bottom: 10px; }
            .title { text-align: center; font-size: 18pt; font-weight: bold; margin: 40px 0; text-transform: uppercase; }
            .content { text-align: justify; text-indent: 50px; font-size: 12pt; }
            .footer { margin-top: 100px; text-align: center; }
            .date { text-align: right; margin-top: 50px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="color: #0d3b66; margin: 0;">FAPEGMA</h1>
            <p style="margin: 5px 0;">Faculdade de Imperatriz</p>
          </div>
          <div class="title">Declaração de Matrícula</div>
          <div class="content">
            <p>Declaramos para os devidos fins que o(a) aluno(a) <span class="bold">${data.nome_aluno}</span>, 
            portador(a) do Registro Acadêmico <span class="bold">${data.registro_academico}</span>, encontra-se 
            <span class="bold">${data.situacao_matricula}</span> no curso de <span class="bold">${data.nome_do_curso}</span>, 
            cursando o <span class="bold">${data.serie_periodo}º período</span>, no turno <span class="bold">${data.turno_aluno}</span>, 
            referente ao período letivo de <span class="bold">${data.periodo_letivo}</span>.</p>
            <p>O referido período letivo tem previsão de encerramento em ${data.data_fim_periodo}.</p>
          </div>
          <div class="date">Imperatriz - MA, ${data.data_emissao_extenso}.</div>
          <div class="footer">
            <div style="border-top: 1px solid #000; width: 300px; margin: 0 auto;"></div>
            <p>Secretaria Acadêmica</p>
          </div>
        </body>
      </html>
    `;
    generatePDF(html, "Declaração");
  };

  const handlePrintTranscript = () => {
    if (!transcriptDataQuery.data) return toast.error("Dados não carregados");
    const data = transcriptDataQuery.data;
    
    const html = `
      <html>
        <head>
          <title>Histórico Escolar</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 10pt; }
            th { background: #f4f4f4; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>HISTÓRICO ESCOLAR PARCIAL</h2>
            <p>Aluno: ${data.studentName} | RA: ${data.registrationNumber}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Disciplina</th>
                <th>Semestre</th>
                <th>1º B</th>
                <th>2º B</th>
                <th>3º B</th>
                <th>4º B</th>
                <th>Média</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.grades.map(g => `
                <tr>
                  <td>${g.subjectname}</td>
                  <td>${g.semester}º</td>
                  <td>${g.firstbimester || '-'}</td>
                  <td>${g.secondbimester || '-'}</td>
                  <td>${g.thirdbimester || '-'}</td>
                  <td>${g.fourthbimester || '-'}</td>
                  <td>${calculateAverage(g)}</td>
                  <td>${parseFloat(calculateAverage(g)) >= 7 ? 'Aprovado' : 'Em curso'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    generatePDF(html, "Histórico");
  };

  const handlePrintProgramContent = () => {
    if (!programContentQuery.data) return toast.error("Dados não carregados");
    const data = programContentQuery.data;
    
    const html = `
      <html>
        <head>
          <title>Conteúdo Programático</title>
          <style>
            body { font-family: Arial; padding: 40px; }
            .subject { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            .subject-title { font-size: 14pt; font-weight: bold; color: #0d3b66; }
            .workload { font-size: 10pt; color: #666; margin-bottom: 10px; }
            .description { text-align: justify; font-size: 11pt; }
            .header { text-align: center; margin-bottom: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>CONTEÚDO PROGRAMÁTICO</h2>
            <h3>Curso: ${data.courseName}</h3>
          </div>
          ${data.subjects.map(s => `
            <div class="subject">
              <div class="subject-title">${s.name}</div>
              <div class="workload">Carga Horária: ${s.workload}h</div>
              <div class="description">
                <strong>Ementa/Conteúdo:</strong><br>
                ${s.description || "Descrição não cadastrada."}
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    generatePDF(html, "Conteúdo Programático");
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/student")} className="rounded-full hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Secretaria Virtual</h2>
          <p className="text-slate-500">Emissão de documentos e requerimentos</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-slate-900 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Documentos Oficiais</CardTitle>
                <CardDescription className="text-slate-400">Emissão instantânea em PDF</CardDescription>
              </div>
              <FileText className="w-10 h-10 text-slate-700 opacity-50" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900">Declaração de Matrícula</h4>
                  <p className="text-sm text-slate-500">Comprovante oficial de vínculo acadêmico</p>
                </div>
                <Button onClick={handlePrintDeclaration} className="bg-slate-900 gap-2" disabled={declarationDataQuery.isLoading}>
                  {declarationDataQuery.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                  BAIXAR PDF
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900">Histórico Escolar Parcial</h4>
                  <p className="text-sm text-slate-500">Relatório de notas e disciplinas cursadas</p>
                </div>
                <Button onClick={handlePrintTranscript} className="bg-slate-900 gap-2" disabled={transcriptDataQuery.isLoading}>
                  {transcriptDataQuery.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                  BAIXAR PDF
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900">Conteúdo Programático</h4>
                  <p className="text-sm text-slate-500">Ementas e bibliografias do curso</p>
                </div>
                <Button onClick={handlePrintProgramContent} className="bg-slate-900 gap-2" disabled={programContentQuery.isLoading}>
                  {programContentQuery.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                  BAIXAR PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
