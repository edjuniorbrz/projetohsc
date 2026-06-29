import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';

// Create a logger fallback for local debugging/development without SMTP
const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'email_notifications.log');

const logEmailLocal = (to: string, subject: string, html: string) => {
  const logMessage = `
========================================
[EMAIL SENT LOG] - ${new Date().toISOString()}
TO: ${to}
SUBJECT: ${subject}
BODY:
${html}
========================================
`;
  try {
    fs.appendFileSync(LOG_FILE_PATH, logMessage, 'utf8');
    console.log(`[EmailService Fallback] Email to ${to} logged successfully to logs/email_notifications.log`);
  } catch (err) {
    console.error('Failed to write email notification log:', err);
  }
};

// Create SMTP Transporter (if configured in .env)
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass
      }
    });
  }
  return null;
};

// Premium Styles
const emailHeaderStyle = `
  background-color: #0b0f19;
  border-bottom: 2px solid #0ea5e9;
  padding: 24px;
  text-align: center;
  border-radius: 8px 8px 0 0;
`;

const emailContainerStyle = `
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #f3f4f6;
  background-color: #030712;
  padding: 40px 20px;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 8px;
  border: 1px solid #1f2937;
`;

const emailFooterStyle = `
  margin-top: 32px;
  border-top: 1px solid #1f2937;
  padding-top: 20px;
  text-align: center;
  font-size: 0.75rem;
  color: #9ca3af;
`;

const fieldTableStyle = `
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  background-color: #0b0f19;
  border-radius: 6px;
  border: 1px solid #1f2937;
  overflow: hidden;
`;

const fieldLabelStyle = `
  padding: 12px 16px;
  font-weight: bold;
  color: #0ea5e9;
  border-bottom: 1px solid #1f2937;
  width: 30%;
  font-size: 0.85rem;
`;

const fieldValueStyle = `
  padding: 12px 16px;
  color: #e5e7eb;
  border-bottom: 1px solid #1f2937;
  font-size: 0.85rem;
`;

export class EmailService {
  /**
   * Helper to send an HTML email, routing through nodemailer or falling back to log file
   */
  private static async sendMail(to: string, subject: string, html: string) {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || '"DEMANDAS TI" <notificacoes@portal.com>';

    if (transporter) {
      try {
        await transporter.sendMail({
          from,
          to,
          subject,
          html
        });
        console.log(`[EmailService] Email sent successfully to ${to}`);
      } catch (err) {
        console.error(`[EmailService] Failed to send email to ${to} via SMTP. Falling back to local logging. Error:`, err);
        logEmailLocal(to, subject, html);
      }
    } else {
      logEmailLocal(to, subject, html);
    }
  }

  /**
   * 1. Send Task Assignment Email (designation of executor)
   */
  public static async sendTaskAssignmentEmail(userIds: string[], taskId: string) {
    if (!userIds || userIds.length === 0) return;

    try {
      // Fetch task details including project
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: true,
          subChapter: true
        }
      });

      if (!task) {
        console.error(`[EmailService] Task ${taskId} not found for assignment email.`);
        return;
      }

      // Fetch users
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } }
      });

      for (const user of users) {
        if (!user.isActive || !user.email) continue;

        const dateRange = `${task.dataInicioProgramada ? new Date(task.dataInicioProgramada).toLocaleDateString('pt-BR') : '-'} a ${task.dataPrevistaFinalizar ? new Date(task.dataPrevistaFinalizar).toLocaleDateString('pt-BR') : '-'}`;

        const html = `
          <div style="${emailContainerStyle}">
            <div style="${emailHeaderStyle}">
              <h2 style="margin: 0; color: #fff; font-size: 1.5rem; letter-spacing: 0.5px;">NOVA TAREFA DESIGNADA</h2>
            </div>
            
            <div style="padding: 24px 12px; line-height: 1.6;">
              <p style="font-size: 1.05rem; margin-top: 0;">Olá, <strong>${user.name}</strong>!</p>
              <p>Você foi designado como executor da seguinte ação estruturada 5W2H no portal:</p>
              
              <table style="${fieldTableStyle}">
                <tr>
                  <td style="${fieldLabelStyle}">O QUÊ (What)</td>
                  <td style="${fieldValueStyle}; font-weight: 700; color: #0ea5e9;">${task.title}</td>
                </tr>
                <tr>
                  <td style="${fieldLabelStyle}">PROJETO / ETAPA</td>
                  <td style="${fieldValueStyle};">${task.project ? task.project.title : 'SEM PROJETO'}${task.subChapter ? ` &gt; ${task.subChapter.title}` : ''}</td>
                </tr>
                <tr>
                  <td style="${fieldLabelStyle}">POR QUÊ (Why)</td>
                  <td style="${fieldValueStyle};">${task.why || '-'}</td>
                </tr>
                <tr>
                  <td style="${fieldLabelStyle}">ONDE (Where)</td>
                  <td style="${fieldValueStyle};">${task.where || '-'}</td>
                </tr>
                <tr>
                  <td style="${fieldLabelStyle}">COMO (How)</td>
                  <td style="${fieldValueStyle};">${task.how || '-'}</td>
                </tr>
                <tr>
                  <td style="${fieldLabelStyle}">CUSTO (How Much)</td>
                  <td style="${fieldValueStyle}; font-weight: 600; color: #ef4444;">${task.howMuch ? `R$ ${task.howMuch.toFixed(2)}` : 'R$ 0,00'}</td>
                </tr>
                <tr>
                  <td style="${fieldLabelStyle}">CRONOGRAMA</td>
                  <td style="${fieldValueStyle};">${dateRange}</td>
                </tr>
              </table>
              
              <p style="margin-bottom: 0;">Acesse o Quadro Kanban do sistema para reportar seu andamento físico e interagir com a equipe por meio de observações ou anexos.</p>
            </div>
            
            <div style="${emailFooterStyle}">
              <p style="margin: 0 0 8px 0;">Este é um e-mail automático enviado pelo Portal DEMANDAS TI.</p>
              <p style="margin: 0; font-weight: bold; color: #0ea5e9;">Não responda a esta mensagem.</p>
            </div>
          </div>
        `;

        // Disparar de forma assíncrona
        this.sendMail(user.email, `[DEMANDAS TI] Você foi designado para uma nova tarefa: ${task.title}`, html)
          .catch(err => console.error('[EmailService] Async send failed:', err));
      }
    } catch (error) {
      console.error('[EmailService] Error preparing task assignment emails:', error);
    }
  }

  /**
   * 2. Send Task Completion Email (whenever task changes status to DONE)
   */
  public static async sendTaskCompletionEmail(taskId: string, completedByUserId: string) {
    try {
      // Fetch task including project, responsibles, assignees and owner
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: {
            include: {
              owner: true,
              gestor: true,
              responsibles: true
            }
          },
          subChapter: true,
          assignees: true
        }
      });

      if (!task) {
        console.error(`[EmailService] Task ${taskId} not found for completion email.`);
        return;
      }

      // User who completed it
      const completedByUser = await prisma.user.findUnique({
        where: { id: completedByUserId },
        include: {
          gestor: true
        }
      });

      if (!completedByUser) {
        console.error(`[EmailService] User ${completedByUserId} not found for completion email.`);
        return;
      }

      // Collect target email addresses to avoid duplicates
      const targetEmails = new Set<string>();
      const recipientsInfo: Array<{ name: string; role: string; email: string }> = [];

      const addRecipient = (name: string, role: string, email: string) => {
        if (email && !targetEmails.has(email.toLowerCase())) {
          targetEmails.add(email.toLowerCase());
          recipientsInfo.push({ name, role, email });
        }
      };

      // A. Gestor direto do usuário que concluiu
      if (completedByUser.gestor && completedByUser.gestor.email) {
        addRecipient(completedByUser.gestor.name, 'Gestor Direto do Executor', completedByUser.gestor.email);
      }

      // B. Gestores responsáveis pelo projeto (many-to-many)
      if (task.project && task.project.responsibles) {
        task.project.responsibles.forEach(r => {
          if (r.email) {
            addRecipient(r.name, 'Responsável pelo Projeto', r.email);
          }
        });
      }

      // C. Gestor do projeto (antigo gestorId de retrocompatibilidade)
      if (task.project && task.project.gestor && task.project.gestor.email) {
        addRecipient(task.project.gestor.name, 'Gestor do Projeto (Legacy)', task.project.gestor.email);
      }

      // D. Criador do projeto (Project Owner)
      if (task.project && task.project.owner && task.project.owner.email) {
        addRecipient(task.project.owner.name, 'Proprietário do Projeto', task.project.owner.email);
      }

      if (recipientsInfo.length === 0) {
        console.log(`[EmailService] No recipients found to notify about task ${task.title} completion.`);
        return;
      }

      const completedDate = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Prepare HTML for notifications
      for (const recip of recipientsInfo) {
        const html = `
          <div style="${emailContainerStyle}">
            <div style="${emailHeaderStyle}; border-bottom-color: #10b981;">
              <h2 style="margin: 0; color: #fff; font-size: 1.5rem; letter-spacing: 0.5px;">✓ DEMANDA CONCLUÍDA</h2>
            </div>
            
            <div style="padding: 24px 12px; line-height: 1.6;">
              <p style="font-size: 1.05rem; margin-top: 0;">Olá, <strong>${recip.name}</strong> (${recip.role})!</p>
              <p>Uma demanda sob sua coordenação ou vinculada à sua equipe foi <strong>finalizada</strong> no portal:</p>
              
              <table style="${fieldTableStyle}">
                <tr>
                  <td style="${fieldLabelStyle}">DEMANDA (What)</td>
                  <td style="${fieldValueStyle}; font-weight: 700; color: #10b981;">${task.title}</td>
                </tr>
                <tr>
                  <td style="${fieldLabelStyle}">PROJETO / ETAPA</td>
                  <td style="${fieldValueStyle};">${task.project ? task.project.title : 'SEM PROJETO'}${task.subChapter ? ` &gt; ${task.subChapter.title}` : ''}</td>
                </tr>
                <tr>
                  <td style="${fieldLabelStyle}">CONCLUÍDA POR</td>
                  <td style="${fieldValueStyle}; font-weight: 600;">${completedByUser.name} ${completedByUser.cargo ? `(${completedByUser.cargo})` : ''}</td>
                </tr>
                <tr>
                  <td style="${fieldLabelStyle}">DATA E HORA</td>
                  <td style="${fieldValueStyle};">${completedDate}</td>
                </tr>
                <tr>
                  <td style="${fieldLabelStyle}">POR QUÊ (Why)</td>
                  <td style="${fieldValueStyle};">${task.why || '-'}</td>
                </tr>
                <tr>
                  <td style="${fieldLabelStyle}">ONDE (Where)</td>
                  <td style="${fieldValueStyle};">${task.where || '-'}</td>
                </tr>
                <tr>
                  <td style="${fieldLabelStyle}">CUSTO FINAL</td>
                  <td style="${fieldValueStyle}; font-weight: 600; color: #10b981;">${task.howMuch ? `R$ ${task.howMuch.toFixed(2)}` : 'R$ 0,00'}</td>
                </tr>
              </table>
              
              <p style="margin-bottom: 0;">Os dados consolidados físicos e o progresso da ação foram arquivados e constam na listagem histórica de demandas concluídas no portal.</p>
            </div>
            
            <div style="${emailFooterStyle}">
              <p style="margin: 0 0 8px 0;">Este é um e-mail automático enviado pelo Portal DEMANDAS TI.</p>
              <p style="margin: 0; font-weight: bold; color: #10b981;">Não responda a esta mensagem.</p>
            </div>
          </div>
        `;

        this.sendMail(recip.email, `[DEMANDAS TI] Demanda Concluída: ${task.title}`, html)
          .catch(err => console.error('[EmailService] Async send failed:', err));
      }
    } catch (error) {
      console.error('[EmailService] Error preparing task completion emails:', error);
    }
  }

  /**
   * 3. Send User Welcome Email (on creation)
   */
  public static async sendUserWelcomeEmail(userId: string, plainTextPassword?: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          gestor: true
        }
      });

      if (!user || !user.email) {
        console.error(`[EmailService] User ${userId} not found or missing email for welcome email.`);
        return;
      }

      const roleDisplay = user.role === 'SUPER_ADMIN' ? 'Administrador do Sistema' : (user.role === 'MANAGER' ? 'Gestor de Projetos' : 'Analista Operacional');

      const html = `
        <div style="${emailContainerStyle}">
          <div style="${emailHeaderStyle}">
            <h2 style="margin: 0; color: #fff; font-size: 1.5rem; letter-spacing: 0.5px;">BEM-VINDO AO PORTAL</h2>
          </div>
          
          <div style="padding: 24px 12px; line-height: 1.6;">
            <p style="font-size: 1.05rem; margin-top: 0;">Olá, <strong>${user.name}</strong>!</p>
            <p>Seu perfil de acesso foi criado com sucesso no **Portal DEMANDAS TI**. Abaixo estão as suas credenciais operacionais de acesso:</p>
            
            <table style="${fieldTableStyle}">
              <tr>
                <td style="${fieldLabelStyle}">E-MAIL DE ACESSO</td>
                <td style="${fieldValueStyle}; font-weight: 700; color: #0ea5e9;">${user.email}</td>
              </tr>
              <tr>
                <td style="${fieldLabelStyle}">CARGO / FUNÇÃO</td>
                <td style="${fieldValueStyle};">${user.cargo || 'Não especificado'}</td>
              </tr>
              <tr>
                <td style="${fieldLabelStyle}">PERFIL DE ACESSO</td>
                <td style="${fieldValueStyle}; font-weight: 600;">${roleDisplay} (${user.role})</td>
              </tr>
              ${user.gestor ? `
              <tr>
                <td style="${fieldLabelStyle}">GESTOR OPERACIONAL</td>
                <td style="${fieldValueStyle};">${user.gestor.name} (${user.gestor.email})</td>
              </tr>
              ` : ''}
              ${plainTextPassword ? `
              <tr>
                <td style="${fieldLabelStyle}; background-color: rgba(239, 68, 68, 0.05);">SENHA INICIAL</td>
                <td style="${fieldValueStyle}; background-color: rgba(239, 68, 68, 0.05); font-weight: bold; color: #ef4444; font-family: monospace; letter-spacing: 1px;">${plainTextPassword}</td>
              </tr>
              ` : ''}
            </table>
            
            <div style="background-color: #0b0f19; border: 1px dashed #1f2937; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <strong style="color: #ef4444; display: block; margin-bottom: 6px;">Recomendação de Segurança:</strong>
              <span style="font-size: 0.8rem; color: #9ca3af;">Por motivos de segurança, altere sua senha inicial logo no primeiro acesso efetuando a redefinição em seu painel de perfil de usuário.</span>
            </div>
            
            <p style="margin-bottom: 0;">Você já pode acessar a plataforma utilizando os computadores conectados à rede operacional e coordenar os cronogramas de atividades.</p>
          </div>
          
          <div style="${emailFooterStyle}">
            <p style="margin: 0 0 8px 0;">Este é um e-mail automático enviado pelo Portal DEMANDAS TI.</p>
            <p style="margin: 0; font-weight: bold; color: #0ea5e9;">Não responda a esta mensagem.</p>
          </div>
        </div>
      `;

      this.sendMail(user.email, `[DEMANDAS TI] Bem-vindo! Seus dados de acesso ao portal`, html)
        .catch(err => console.error('[EmailService] Async welcome send failed:', err));
    } catch (error) {
      console.error('[EmailService] Error preparing user welcome email:', error);
    }
  }
}
