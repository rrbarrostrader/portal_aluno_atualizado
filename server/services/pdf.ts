import PDFDocument from "pdfkit";
import { Readable } from "stream";

export interface DeclarationData {
  studentName: string;
  registrationNumber: string;
  courseName: string;
  enrollmentDate: Date;
  currentSemester: number;
  status: string;
}

/**
 * Gera PDF de Declaração de Matrícula
 */
export async function generateDeclarationPDF(data: DeclarationData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Cabeçalho
    doc.fontSize(12).font("Helvetica-Bold").text("INSTITUTO DE ADMINISTRAÇÃO E NEGÓCIOS", { align: "center" });
    doc.fontSize(10).font("Helvetica").text("IAB FAPEGMA", { align: "center" });
    doc.fontSize(9).text("Imperatriz - MA", { align: "center" });
    doc.moveDown(1);

    // Título
    doc.fontSize(14).font("Helvetica-Bold").text("DECLARAÇÃO DE MATRÍCULA", { align: "center" });
    doc.moveDown(1);

    // Corpo do documento
    doc.fontSize(11).font("Helvetica");
    doc.text(
      `Declaramos, para os devidos fins, que o(a) aluno(a) ${data.studentName}, portador(a) do registro acadêmico nº ${data.registrationNumber}, encontra-se regularmente matriculado(a) no curso de ${data.courseName}, no semestre atual (${data.currentSemester}º semestre), com status de ${data.status}.`
    );

    doc.moveDown(1);
    doc.text(
      `Esta declaração é válida a partir de ${data.enrollmentDate.toLocaleDateString("pt-BR")} e é emitida para fins de comprovação de vínculo acadêmico.`
    );

    doc.moveDown(2);

    // Assinatura
    doc.text("_" + "_".repeat(50));
    doc.fontSize(10).text("Secretaria Acadêmica", { align: "center" });
    doc.fontSize(9).text("IAB FAPEGMA", { align: "center" });

    doc.moveDown(1);
    doc.fontSize(8).text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, {
      align: "center",
    });

    doc.end();
  });
}

export interface ReportData {
  studentName: string;
  courseName: string;
  period: string;
  grades: Array<{
    subjectName: string;
    grade: number;
    status: string;
  }>;
  attendance: Array<{
    subjectName: string;
    percentage: number;
    status: string;
  }>;
  averageGrade: number;
  generalAttendance: number;
}

/**
 * Gera PDF de Relatório Acadêmico
 */
export async function generateReportPDF(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Cabeçalho
    doc.fontSize(12).font("Helvetica-Bold").text("INSTITUTO DE ADMINISTRAÇÃO E NEGÓCIOS", { align: "center" });
    doc.fontSize(10).font("Helvetica").text("IAB FAPEGMA", { align: "center" });
    doc.fontSize(9).text("Imperatriz - MA", { align: "center" });
    doc.moveDown(1);

    // Título
    doc.fontSize(14).font("Helvetica-Bold").text("RELATÓRIO ACADÊMICO", { align: "center" });
    doc.moveDown(1);

    // Informações do aluno
    doc.fontSize(11).font("Helvetica-Bold").text("Informações do Aluno");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Nome: ${data.studentName}`);
    doc.text(`Curso: ${data.courseName}`);
    doc.text(`Período: ${data.period}`);
    doc.moveDown(1);

    // Resumo de desempenho
    doc.fontSize(11).font("Helvetica-Bold").text("Resumo de Desempenho");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Média Geral: ${data.averageGrade.toFixed(2)}`);
    doc.text(`Frequência Geral: ${data.generalAttendance.toFixed(2)}%`);
    doc.moveDown(1);

    // Notas por disciplina
    doc.fontSize(11).font("Helvetica-Bold").text("Notas por Disciplina");
    doc.fontSize(9).font("Helvetica");

    data.grades.forEach((grade) => {
      doc.text(`• ${grade.subjectName}: ${grade.grade.toFixed(2)} (${grade.status})`);
    });

    doc.moveDown(1);

    // Frequência por disciplina
    doc.fontSize(11).font("Helvetica-Bold").text("Frequência por Disciplina");
    doc.fontSize(9).font("Helvetica");

    data.attendance.forEach((att) => {
      doc.text(`• ${att.subjectName}: ${att.percentage.toFixed(2)}% (${att.status})`);
    });

    doc.moveDown(2);

    // Rodapé
    doc.fontSize(8).text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, {
      align: "center",
    });

    doc.end();
  });
}
