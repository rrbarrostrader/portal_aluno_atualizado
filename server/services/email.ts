import nodemailer from "nodemailer";

// Configurar transporter de e-mail
// Em produção, usar variáveis de ambiente para credenciais SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envia um e-mail
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Se não houver configuração SMTP, apenas log
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log("[Email] SMTP não configurado. E-mail não enviado:", {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@iabfapegma.com.br",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log("[Email] E-mail enviado com sucesso para:", options.to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar e-mail:", error);
    return false;
  }
}

/**
 * Envia notificação de nova nota
 */
export async function sendGradeNotification(
  studentEmail: string,
  studentName: string,
  subjectName: string,
  grade: number
): Promise<boolean> {
  const html = `
    <h2>Olá ${studentName},</h2>
    <p>Sua nota foi registrada no sistema acadêmico!</p>
    <p><strong>Disciplina:</strong> ${subjectName}</p>
    <p><strong>Nota:</strong> ${grade.toFixed(2)}</p>
    <p>Acesse o portal para visualizar mais detalhes.</p>
    <p>Atenciosamente,<br/>Portal Acadêmico IAB FAPEGMA</p>
  `;

  return sendEmail({
    to: studentEmail,
    subject: `Sua nota foi registrada - ${subjectName}`,
    html,
  });
}

/**
 * Envia notificação de declaração de matrícula gerada
 */
export async function sendDeclarationNotification(
  studentEmail: string,
  studentName: string,
  courseName: string
): Promise<boolean> {
  const html = `
    <h2>Olá ${studentName},</h2>
    <p>Sua Declaração de Matrícula foi gerada com sucesso!</p>
    <p><strong>Curso:</strong> ${courseName}</p>
    <p>Você pode fazer download do documento no portal acadêmico.</p>
    <p>Atenciosamente,<br/>Portal Acadêmico IAB FAPEGMA</p>
  `;

  return sendEmail({
    to: studentEmail,
    subject: "Declaração de Matrícula Gerada",
    html,
  });
}

/**
 * Envia aviso importante
 */
export async function sendAnnouncementNotification(
  studentEmail: string,
  studentName: string,
  announcementTitle: string,
  announcementContent: string
): Promise<boolean> {
  const html = `
    <h2>Olá ${studentName},</h2>
    <h3>${announcementTitle}</h3>
    <p>${announcementContent}</p>
    <p>Verifique o portal para mais informações.</p>
    <p>Atenciosamente,<br/>Portal Acadêmico IAB FAPEGMA</p>
  `;

  return sendEmail({
    to: studentEmail,
    subject: `Aviso Importante: ${announcementTitle}`,
    html,
  });
}

/**
 * Envia e-mail de boas-vindas para novo aluno
 */
export async function sendWelcomeEmail(
  studentEmail: string,
  studentName: string,
  courseName: string,
  temporaryPassword: string
): Promise<boolean> {
  const html = `
    <h2>Bem-vindo ao Portal Acadêmico IAB FAPEGMA!</h2>
    <p>Olá ${studentName},</p>
    <p>Sua conta foi criada com sucesso no portal acadêmico.</p>
    <p><strong>Curso:</strong> ${courseName}</p>
    <p><strong>E-mail:</strong> ${studentEmail}</p>
    <p><strong>Senha Temporária:</strong> ${temporaryPassword}</p>
    <p>Ao fazer login pela primeira vez, você será solicitado a alterar sua senha.</p>
    <p>Acesse o portal em: https://portal.iabfapegma.com.br</p>
    <p>Atenciosamente,<br/>Portal Acadêmico IAB FAPEGMA</p>
  `;

  return sendEmail({
    to: studentEmail,
    subject: "Bem-vindo ao Portal Acadêmico IAB FAPEGMA",
    html,
  });
}
