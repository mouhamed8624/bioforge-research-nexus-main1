import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface TodoEmailData {
  recipientEmail: string;
  recipientName: string;
  taskTitle: string;
  taskDescription: string;
  projectName?: string;
  deadline?: string;
  assignedBy: string;
  todoId: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Get email configuration from environment variables
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    };

    // Only create transporter if we have valid credentials
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.config = emailConfig;
      this.transporter = nodemailer.createTransport(emailConfig);
      console.log('Email service initialized with SMTP configuration');
    } else {
      console.warn('Email service not initialized - missing SMTP credentials');
    }
  }

  private createTodoNotificationTemplate(data: TodoEmailData): EmailTemplate {
    const deadlineText = data.deadline 
      ? `\nDeadline: ${new Date(data.deadline).toLocaleDateString()}`
      : '';
    
    const projectText = data.projectName 
      ? `\nProject: ${data.projectName}`
      : '';

    const subject = `New Task Assigned: ${data.taskTitle}`;
    
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
            <h1>📋 New Task Assignment</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${data.recipientName}</strong>,</p>
            
            <p>You have been assigned a new task:</p>
            
            <div class="task-box">
              <h3>${data.taskTitle}</h3>
              <p><strong>Description:</strong> ${data.taskDescription}</p>
              ${projectText ? `<p><strong>Project:</strong> ${data.projectName}</p>` : ''}
              ${deadlineText ? `<p><strong>Deadline:</strong> ${new Date(data.deadline).toLocaleDateString()}</p>` : ''}
              <p><strong>Assigned by:</strong> ${data.assignedBy}</p>
            </div>
            
            <p>Please review and complete this task as soon as possible.</p>
            
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/todo-list" class="button">
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
    `;

    const text = `
New Task Assignment

Hello ${data.recipientName},

You have been assigned a new task:

Task: ${data.taskTitle}
Description: ${data.taskDescription}${projectText}${deadlineText}
Assigned by: ${data.assignedBy}

Please review and complete this task as soon as possible.

View Task Details: ${process.env.APP_URL || 'http://localhost:3000'}/todo-list

---
This is an automated notification from CIGASS Research Management System
If you have any questions, please contact your project manager.
    `;

    return { subject, html, text };
  }

  async sendTodoNotification(data: TodoEmailData): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not available - skipping email notification');
      return false;
    }

    try {
      const template = this.createTodoNotificationTemplate(data);
      
      const mailOptions = {
        from: `"CIGASS Research" <${this.config?.auth.user}>`,
        to: data.recipientEmail,
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Todo notification email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending todo notification email:', error);
      return false;
    }
  }

  async sendBulkTodoNotifications(emails: TodoEmailData[]): Promise<{ success: number; failed: number }> {
    if (!this.transporter) {
      console.warn('Email service not available - skipping bulk email notifications');
      return { success: 0, failed: emails.length };
    }

    let success = 0;
    let failed = 0;

    for (const emailData of emails) {
      try {
        const sent = await this.sendTodoNotification(emailData);
        if (sent) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Error sending email to', emailData.recipientEmail, error);
        failed++;
      }
    }

    console.log(`Bulk email notification completed: ${success} sent, ${failed} failed`);
    return { success, failed };
  }

  // Test email functionality
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService(); 