import nodemailer from "nodemailer";

/**
 * Configuração do transporte de e-mail
 * Suporta Gmail, Outlook, SMTP genérico e Mailtrap (para testes)
 */
let transporter: nodemailer.Transporter | null = null;

/**
 * Inicializa o transporte de e-mail baseado nas variáveis de ambiente
 */
async function getEmailTransporter() {
  if (transporter) {
    return transporter;
  }

  const emailProvider = process.env.EMAIL_PROVIDER || "test";

  try {
    if (emailProvider === "gmail") {
      // Configuração para Gmail
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD, // Use App Password, não a senha da conta
        },
      });
    } else if (emailProvider === "outlook") {
      // Configuração para Outlook
      transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.OUTLOOK_USER,
          pass: process.env.OUTLOOK_PASSWORD,
        },
      });
    } else if (emailProvider === "mailtrap") {
      // Configuração para Mailtrap (serviço de teste)
      transporter = nodemailer.createTransport({
        host: "live.smtp.mailtrap.io",
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAILTRAP_USER,
          pass: process.env.MAILTRAP_PASSWORD,
        },
      });
    } else if (emailProvider === "smtp") {
      // Configuração para SMTP genérico
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      // Modo teste (não envia e-mails realmente) - CORRIGIDO PARA AGUARDAR A PROMISE
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("[Email] Modo de teste ativado (Ethereal). Conta de teste criada.");
    }
  } catch (error) {
    console.error("[Email] Erro ao configurar transporte de e-mail:", error);
    return null;
  }

  return transporter;
}

/**
 * Envia um e-mail com a senha temporária para o aluno
 */
export async function sendWelcomeEmail(
  studentEmail: string,
  studentName: string,
  temporaryPassword: string
): Promise<boolean> {
  try {
    const transporterInstance = await getEmailTransporter();

    if (!transporterInstance) {
      console.warn("[Email] Transporte de e-mail não configurado. E-mail não foi enviado.");
      return false;
    }

    const emailFrom = process.env.EMAIL_FROM || "noreply@iabfapgema.com.br";
    const portalUrl = process.env.PORTAL_URL || "http://localhost:3000";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #FFC107; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #FFC107; }
          .content { margin: 20px 0; }
          .credentials { background-color: #f9f9f9; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .password { font-size: 18px; font-weight: bold; color: #d9534f; background-color: #fff3cd; padding: 10px; border-radius: 4px; display: inline-block; margin: 10px 0; }
          .button { display: inline-block; background-color: #FFC107; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; text-align: center; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">IAB FAPEGMA</div>
            <h1>Portal Acadêmico</h1>
          </div>
          <div class="content">
            <h2>Bem-vindo ao Portal Acadêmico, ${studentName}!</h2>
            <p>Sua conta foi criada com sucesso no Portal Acadêmico da IAB FAPEGMA.</p>
            <div class="credentials">
              <p><strong>E-mail de Acesso:</strong></p>
              <p>${studentEmail}</p>
              <p><strong>Senha Temporária:</strong></p>
              <p class="password">${temporaryPassword}</p>
            </div>
            <p><strong>⚠️ Importante:</strong> Esta é uma senha temporária. Ao fazer login pela primeira vez, você será obrigado a criar uma nova senha pessoal.</p>
            <center><a href="${portalUrl}" class="button">Acessar Portal</a></center>
          </div>
          <div class="footer">
            <p>&copy; 2026 IAB FAPEGMA. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: emailFrom,
      to: studentEmail,
      subject: "Bem-vindo ao Portal Acadêmico IAB FAPEGMA - Credenciais de Acesso",
      html: htmlContent,
      text: `Bem-vindo ao Portal Acadêmico, ${studentName}!\n\nE-mail: ${studentEmail}\nSenha Temporária: ${temporaryPassword}\n\nAcesse: ${portalUrl}`,
    };

    const info = await transporterInstance.sendMail(mailOptions);
    console.log("[Email] E-mail enviado com sucesso para:", studentEmail);
    
    // No modo de teste (Ethereal), loga a URL da mensagem
    if (process.env.EMAIL_PROVIDER === "test" || !process.env.EMAIL_PROVIDER) {
      console.log("[Email] URL de visualização do e-mail de teste:", nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar e-mail:", error);
    return false;
  }
}

/**
 * Envia um e-mail de confirmação de troca de senha
 */
export async function sendPasswordChangeEmail(
  studentEmail: string,
  studentName: string
): Promise<boolean> {
  try {
    const transporterInstance = await getEmailTransporter();

    if (!transporterInstance) {
      console.warn("[Email] Transporte de e-mail não configurado. E-mail não foi enviado.");
      return false;
    }

    const emailFrom = process.env.EMAIL_FROM || "noreply@iabfapgema.com.br";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 40px; border-radius: 8px; }
          .header { text-align: center; border-bottom: 3px solid #FFC107; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #FFC107; }
          .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">IAB FAPEGMA</div>
            <h1>Portal Acadêmico</h1>
          </div>
          <div class="success">
            <h2>✓ Senha Alterada com Sucesso!</h2>
            <p>Olá ${studentName},</p>
            <p>Sua senha foi alterada com sucesso. Você agora pode acessar o portal com sua nova senha.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: emailFrom,
      to: studentEmail,
      subject: "Confirmação: Sua Senha foi Alterada - Portal Acadêmico IAB FAPEGMA",
      html: htmlContent,
      text: `Olá ${studentName},\n\nSua senha foi alterada com sucesso no Portal Acadêmico.`,
    };

    const info = await transporterInstance.sendMail(mailOptions);
    
    if (process.env.EMAIL_PROVIDER === "test" || !process.env.EMAIL_PROVIDER) {
      console.log("[Email] URL de visualização da troca de senha:", nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar e-mail de confirmação:", error);
    return false;
  }
}
