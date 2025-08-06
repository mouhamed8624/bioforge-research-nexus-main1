export interface EmailSettings {
  enabled: boolean;
  provider: 'resend' | 'sendgrid' | 'mailgun' | 'smtp' | 'custom';
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailProviderConfig {
  smtp?: SMTPConfig;
  resendApiKey?: string;
  sendgridApiKey?: string;
  mailgunApiKey?: string;
  mailgunDomain?: string;
}

// Default email configuration
export const defaultEmailSettings: EmailSettings = {
  enabled: true,
  provider: 'resend',
  fromEmail: 'noreply@cigass.com',
  fromName: 'CIGASS Research Management',
  replyTo: 'support@cigass.com',
};

// Email templates
export const emailTemplates = {
  todoNotification: {
    subject: 'New Task Assigned: {{taskTitle}}',
    html: `
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
            <h1>📋 New Task Assignment</h1>
          </div>
          <div class="content">
            <p>Hello <strong>{{recipientName}}</strong>,</p>
            
            <p>You have been assigned a new task:</p>
            
            <div class="task-box">
              <h3>{{taskTitle}}</h3>
              <p><strong>Description:</strong> {{taskDescription}}</p>
              {{#if projectName}}<p><strong>Project:</strong> {{projectName}}</p>{{/if}}
              {{#if deadline}}<p><strong>Deadline:</strong> {{deadline}}</p>{{/if}}
              <p><strong>Assigned by:</strong> {{assignedBy}}</p>
            </div>
            
            <p>Please review and complete this task as soon as possible.</p>
            
            <a href="{{appUrl}}/todo-list" class="button">
              View Task Details
            </a>
            
            <div class="footer">
              <p>This is an automated notification from CIGASS Research Management System</p>
              <p>If you have any questions, please contact your project manager.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
New Task Assignment

Hello {{recipientName}},

You have been assigned a new task:

Task: {{taskTitle}}
Description: {{taskDescription}}
{{#if projectName}}Project: {{projectName}}{{/if}}
{{#if deadline}}Deadline: {{deadline}}{{/if}}
Assigned by: {{assignedBy}}

Please review and complete this task as soon as possible.

View Task Details: {{appUrl}}/todo-list

---
This is an automated notification from CIGASS Research Management System
If you have any questions, please contact your project manager.
    `,
  },
};

// Helper function to get email configuration from environment
export function getEmailConfig(): EmailSettings & EmailProviderConfig {
  return {
    ...defaultEmailSettings,
    enabled: import.meta.env.VITE_EMAIL_ENABLED === 'true',
    provider: (import.meta.env.VITE_EMAIL_PROVIDER as any) || 'resend',
    fromEmail: import.meta.env.VITE_EMAIL_FROM || defaultEmailSettings.fromEmail,
    fromName: import.meta.env.VITE_EMAIL_FROM_NAME || defaultEmailSettings.fromName,
    replyTo: import.meta.env.VITE_EMAIL_REPLY_TO || defaultEmailSettings.replyTo,
    
    // SMTP Configuration
    smtp: import.meta.env.VITE_SMTP_HOST ? {
      host: import.meta.env.VITE_SMTP_HOST,
      port: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
      secure: import.meta.env.VITE_SMTP_SECURE === 'true',
      auth: {
        user: import.meta.env.VITE_SMTP_USER || '',
        pass: import.meta.env.VITE_SMTP_PASS || '',
      },
    } : undefined,
    
    // API Keys
    resendApiKey: import.meta.env.VITE_RESEND_API_KEY,
    sendgridApiKey: import.meta.env.VITE_SENDGRID_API_KEY,
    mailgunApiKey: import.meta.env.VITE_MAILGUN_API_KEY,
    mailgunDomain: import.meta.env.VITE_MAILGUN_DOMAIN,
  };
} 