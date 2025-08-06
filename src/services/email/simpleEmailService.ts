import { supabase } from "@/integrations/supabase/client";
import { teamEmailService } from './teamEmailService';

export interface SimpleEmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  success: boolean;
  message: string;
}

class SimpleEmailService {
  private isEnabled: boolean = false;

  constructor() {
    // Check if email is enabled via environment variable
    this.isEnabled = import.meta.env.VITE_EMAIL_ENABLED === 'true';
    console.log('SimpleEmailService initialized, enabled:', this.isEnabled);
  }

  private createTodoEmailTemplate(data: {
    recipientName: string;
    taskTitle: string;
    taskDescription: string;
    projectName?: string;
    deadline?: string;
    assignedBy: string;
  }) {
    const deadlineText = data.deadline 
      ? `\nDeadline: ${new Date(data.deadline).toLocaleDateString()}`
      : '';
    
    const projectText = data.projectName 
      ? `\nProject: ${data.projectName}`
      : '';

    const subject = `Nouvelle tâche assignée: ${data.taskTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .task-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Nouvelle tâche assignée</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.recipientName}</strong>,</p>
            
            <p>Vous avez une ou des tâches à compléter, veuillez vous connecter :</p>
            
            <div class="task-box">
              <h3>${data.taskTitle}</h3>
              <p><strong>Description:</strong> ${data.taskDescription}</p>
              ${projectText ? `<p><strong>Projet:</strong> ${data.projectName}</p>` : ''}
              ${deadlineText ? `<p><strong>Date limite:</strong> ${new Date(data.deadline).toLocaleDateString()}</p>` : ''}
              <p><strong>Assigné par:</strong> ${data.assignedBy}</p>
            </div>
            
            <p>Veuillez examiner et compléter cette tâche dès que possible.</p>
            
            <a href="${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/todo-list" class="button">
              Voir les détails de la tâche
            </a>
            
                          <div class="footer">
                <p>Ceci est une notification automatique du système CIGASS</p>
                <p>Si vous avez des questions, veuillez contacter votre chef de projet.</p>
              </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Nouvelle tâche assignée

Bonjour ${data.recipientName},

Vous avez une ou des tâches à compléter, veuillez vous connecter :

Tâche: ${data.taskTitle}
Description: ${data.taskDescription}${projectText}${deadlineText}
Assigné par: ${data.assignedBy}

Veuillez examiner et compléter cette tâche dès que possible.

Voir les détails de la tâche: ${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/todo-list

---
Ceci est une notification automatique du système CIGASS
Si vous avez des questions, veuillez contacter votre chef de projet.
    `;

    return { subject, html, text };
  }

  private createAdminNotificationTemplate(data: {
    originalRecipient: string;
    originalRecipientName: string;
    taskTitle: string;
    taskDescription: string;
    projectName?: string;
    deadline?: string;
    assignedBy: string;
  }): EmailTemplate {
    const deadlineText = data.deadline 
      ? `\nDeadline: ${new Date(data.deadline).toLocaleDateString()}`
      : '';
    
    const projectText = data.projectName 
      ? `\nProject: ${data.projectName}`
      : '';

    const subject = `Notification d'assignation de tâche (Destinataire non vérifié): ${data.taskTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .task-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ff6b6b; }
          .warning-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Notification d'assignation de tâche</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>Admin</strong>,</p>
            
            <div class="warning-box">
              <p><strong>⚠️ Important:</strong> Une tâche a été assignée à une adresse email qui n'est pas membre de l'équipe. L'email n'a pas pu être livré au destinataire prévu.</p>
            </div>
            
            <p><strong>Destinataire original:</strong> ${data.originalRecipientName} (${data.originalRecipient})</p>
            
            <p>Détails de la tâche:</p>
            
            <div class="task-box">
              <h3>${data.taskTitle}</h3>
              <p><strong>Description:</strong> ${data.taskDescription}</p>
              ${projectText ? `<p><strong>Projet:</strong> ${data.projectName}</p>` : ''}
              ${deadlineText ? `<p><strong>Date limite:</strong> ${new Date(data.deadline).toLocaleDateString()}</p>` : ''}
              <p><strong>Assigné par:</strong> ${data.assignedBy}</p>
            </div>
            
            <p><strong>Action requise:</strong> Veuillez contacter le destinataire prévu directement ou l'ajouter à la liste des membres de l'équipe.</p>
            
            <a href="${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/todo-list" class="button">
              Voir les détails de la tâche
            </a>
            
                          <div class="footer">
                <p>Ceci est une notification automatique du système CIGASS</p>
                <p>Pour envoyer des emails à d'autres destinataires, ajoutez-les à la liste des membres de l'équipe</p>
              </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Notification d'assignation de tâche (Destinataire non vérifié)

Bonjour Admin,

⚠️ Important: Une tâche a été assignée à une adresse email qui n'est pas membre de l'équipe. L'email n'a pas pu être livré au destinataire prévu.

Destinataire original: ${data.originalRecipientName} (${data.originalRecipient})

Tâche: ${data.taskTitle}
Description: ${data.taskDescription}${projectText}${deadlineText}
Assigné par: ${data.assignedBy}

Action requise: Veuillez contacter le destinataire prévu directement ou l'ajouter à la liste des membres de l'équipe.

Voir les détails de la tâche: ${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/todo-list

---
Ceci est une notification automatique du système CIGASS
Pour envoyer des emails à d'autres destinataires, ajoutez-les à la liste des membres de l'équipe
    `;

    return { subject, html, text };
  }

  async sendTodoNotification(emailData: {
    recipientEmail: string;
    recipientName: string;
    taskTitle: string;
    taskDescription: string;
    projectName?: string;
    deadline?: string;
    assignedBy: string;
  }): Promise<EmailResult> {
    if (!this.isEnabled) {
      console.log('Service email désactivé. Pour activer, définissez VITE_EMAIL_ENABLED=true');
      return {
        success: false,
        message: 'Service email désactivé. Définissez VITE_EMAIL_ENABLED=true pour activer.'
      };
    }

    try {
      const template = this.createTodoEmailTemplate(emailData);
      
      // Get email provider configuration
      const provider = import.meta.env.VITE_EMAIL_PROVIDER || 'resend';
      const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
      
      if (provider === 'resend' && resendApiKey) {
        // Check if recipient is a team member (verified email)
        const isVerifiedRecipient = await teamEmailService.isEmailVerified(emailData.recipientEmail);
        
        if (!isVerifiedRecipient) {
                  console.log('⚠️ Impossible d\'envoyer un email à un non-membre de l\'équipe:', emailData.recipientEmail);
        console.log('📧 Envoi de notification à l\'admin à la place');
          
          // Send notification to admin about the assignment
          const adminTemplate = this.createAdminNotificationTemplate({
            originalRecipient: emailData.recipientEmail,
            originalRecipientName: emailData.recipientName,
            taskTitle: emailData.taskTitle,
            taskDescription: emailData.taskDescription,
            projectName: emailData.projectName,
            deadline: emailData.deadline,
            assignedBy: emailData.assignedBy,
          });
          
          emailData.recipientEmail = 'mohamed8624.dev@gmail.com';
          emailData.recipientName = 'Admin';
          template.subject = adminTemplate.subject;
          template.html = adminTemplate.html;
          template.text = adminTemplate.text;
        }
        
        // Send real email using local server (avoids CORS issues)
        console.log('📧 ENVOI D\'EMAIL RÉEL VIA SERVEUR LOCAL:');
        console.log('À:', emailData.recipientEmail);
        console.log('Sujet:', template.subject);
        
        try {
          const response = await fetch('http://localhost:3001/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: emailData.recipientEmail,
              subject: template.subject,
              html: template.html,
              text: template.text,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Server error: ${response.status} - ${errorData.error || response.statusText}`);
          }

          const result = await response.json();
          console.log('✅ Email réel envoyé avec succès via serveur local:', result.id);
          
          const message = isVerifiedRecipient 
            ? `Email réel envoyé avec succès à ${emailData.recipientEmail}`
            : `Email envoyé à l'admin (mohamed8624.dev@gmail.com) - destinataire original (${emailData.recipientEmail}) n'est pas membre de l'équipe`;
          
          return {
            success: true,
            message
          };
        } catch (error) {
          console.error('Local server error:', error);
          throw new Error(`Local server error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // Fallback to simulation mode
        console.log('📧 SIMULATION DE NOTIFICATION EMAIL (aucune clé API configurée):');
        console.log('À:', emailData.recipientEmail);
        console.log('Sujet:', template.subject);
        console.log('Longueur du contenu HTML:', template.html.length);
        console.log('Longueur du contenu texte:', template.text.length);
        
        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Notification email simulée avec succès');
        
        return {
          success: true,
          message: `Notification email simulée pour ${emailData.recipientEmail} (aucune clé API configurée)`
        };
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendTestEmail(userEmail: string): Promise<EmailResult> {
    const testData = {
      recipientEmail: userEmail,
      recipientName: userEmail.split('@')[0],
      taskTitle: 'Test Task',
      taskDescription: 'This is a test task to verify email notifications are working.',
      projectName: 'Test Project',
      assignedBy: 'System Test',
    };

    return this.sendTodoNotification(testData);
  }

  // Method to check if email service is properly configured
  getStatus(): { enabled: boolean; message: string } {
    if (!this.isEnabled) {
      return {
        enabled: false,
        message: 'Email service is disabled. Set VITE_EMAIL_ENABLED=true to enable.'
      };
    }

    const provider = import.meta.env.VITE_EMAIL_PROVIDER || 'resend';
    const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

    if (provider === 'resend' && resendApiKey) {
      return {
        enabled: true,
        message: 'Email service is enabled with local server. Real emails will be sent.'
      };
    } else {
      return {
        enabled: true,
        message: 'Email service is enabled but no API key configured. Running in simulation mode.'
      };
    }
  }
}

// Export singleton instance
export const simpleEmailService = new SimpleEmailService(); 