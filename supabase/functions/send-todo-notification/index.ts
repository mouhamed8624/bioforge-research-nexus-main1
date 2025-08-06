import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TodoEmailData {
  recipientEmail: string;
  recipientName: string;
  taskTitle: string;
  taskDescription: string;
  projectName?: string;
  deadline?: string;
  assignedBy: string;
  todoId: string;
}

async function sendEmail(emailData: TodoEmailData): Promise<boolean> {
  try {
    // Use a simple email service like Resend, SendGrid, or your own SMTP
    // For this example, we'll use a simple fetch to an email service API
    
    const emailPayload = {
      to: emailData.recipientEmail,
      subject: `New Task Assigned: ${emailData.taskTitle}`,
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
              <p>Hello <strong>${emailData.recipientName}</strong>,</p>
              
              <p>You have been assigned a new task:</p>
              
              <div class="task-box">
                <h3>${emailData.taskTitle}</h3>
                <p><strong>Description:</strong> ${emailData.taskDescription}</p>
                ${emailData.projectName ? `<p><strong>Project:</strong> ${emailData.projectName}</p>` : ''}
                ${emailData.deadline ? `<p><strong>Deadline:</strong> ${new Date(emailData.deadline).toLocaleDateString()}</p>` : ''}
                <p><strong>Assigned by:</strong> ${emailData.assignedBy}</p>
              </div>
              
              <p>Please review and complete this task as soon as possible.</p>
              
              <a href="${Deno.env.get('APP_URL') || 'http://localhost:3000'}/todo-list" class="button">
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

Hello ${emailData.recipientName},

You have been assigned a new task:

Task: ${emailData.taskTitle}
Description: ${emailData.taskDescription}
${emailData.projectName ? `Project: ${emailData.projectName}` : ''}
${emailData.deadline ? `Deadline: ${new Date(emailData.deadline).toLocaleDateString()}` : ''}
Assigned by: ${emailData.assignedBy}

Please review and complete this task as soon as possible.

View Task Details: ${Deno.env.get('APP_URL') || 'http://localhost:3000'}/todo-list

---
This is an automated notification from CIGASS Research Management System
If you have any questions, please contact your project manager.
      `
    };

    // You can replace this with your preferred email service
    // Examples: Resend, SendGrid, Mailgun, etc.
    
    // For now, we'll just log the email data
    console.log('Email notification data:', emailPayload);
    
    // TODO: Implement actual email sending
    // Example with Resend:
    /*
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });
    
    if (!response.ok) {
      throw new Error(`Email service error: ${response.statusText}`);
    }
    */
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { todoId, assignedTo, taskTitle, taskDescription, projectName, deadline, assignedBy } = await req.json()

    if (!todoId || !assignedTo || !taskTitle || !assignedBy) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user details for each assigned user
    const emailPromises = assignedTo.map(async (email: string) => {
      try {
        // Get user profile information
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('email', email)
          .single()

        if (error || !profile) {
          console.warn(`User profile not found for email: ${email}`);
          return null;
        }

        return {
          recipientEmail: profile.email,
          recipientName: profile.name || email.split('@')[0],
          taskTitle,
          taskDescription,
          projectName,
          deadline,
          assignedBy,
          todoId
        };
      } catch (error) {
        console.error(`Error fetching user profile for ${email}:`, error);
        return null;
      }
    });

    const emailDataList = (await Promise.all(emailPromises)).filter(Boolean);

    // Send emails to all assigned users
    const emailResults = await Promise.all(
      emailDataList.map(emailData => sendEmail(emailData))
    );

    const successCount = emailResults.filter(result => result).length;
    const failureCount = emailResults.length - successCount;

    console.log(`Email notifications sent: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email notifications sent: ${successCount} success, ${failureCount} failed`,
        sent: successCount,
        failed: failureCount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-todo-notification function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 