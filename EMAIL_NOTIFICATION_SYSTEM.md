# Email Notification System for Todo Management

## Overview

The email notification system automatically sends emails to users when they are assigned new tasks in the CIGASS Research Management System. This system integrates with the existing todo management functionality and provides real-time email notifications.

## Features

- **Automatic Email Notifications**: Sends emails when todos are created and assigned to users
- **Multiple Email Providers**: Support for Resend, SendGrid, Mailgun, and custom SMTP
- **Professional Email Templates**: Beautiful HTML and plain text email templates
- **Edge Function Integration**: Uses Supabase Edge Functions for reliable email delivery
- **Test System**: Built-in testing tools to verify email functionality
- **Error Handling**: Graceful handling of email failures without affecting todo creation

## Architecture

### Components

1. **Email Service** (`src/services/email/emailService.ts`)
   - Handles SMTP email sending using nodemailer
   - Creates professional email templates
   - Manages email configuration

2. **Todo Notification Service** (`src/services/email/todoNotificationService.ts`)
   - Client-side service for calling edge functions
   - Handles communication with Supabase Edge Functions
   - Provides test functionality

3. **Supabase Edge Function** (`supabase/functions/send-todo-notification/index.ts`)
   - Serverless function for sending emails
   - Fetches user profile information
   - Handles email delivery logic

4. **Email Configuration** (`src/config/emailConfig.ts`)
   - Centralized email settings management
   - Environment variable configuration
   - Email template definitions

### Flow

1. **Todo Creation**: When a todo is created via `createTodo()`
2. **Notification Trigger**: The system automatically prepares email notification data
3. **Edge Function Call**: Client calls the Supabase Edge Function
4. **User Lookup**: Edge function fetches user profile information
5. **Email Sending**: Emails are sent to all assigned users
6. **Result Tracking**: Success/failure results are logged

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Email Configuration
VITE_EMAIL_ENABLED=true
VITE_EMAIL_PROVIDER=resend
VITE_EMAIL_FROM=noreply@yourdomain.com
VITE_EMAIL_FROM_NAME=CIGASS Research Management
VITE_EMAIL_REPLY_TO=support@yourdomain.com

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App URL
VITE_APP_URL=https://your-app-domain.com

# Email Provider API Keys (choose one)
VITE_RESEND_API_KEY=your_resend_api_key
VITE_SENDGRID_API_KEY=your_sendgrid_api_key
VITE_MAILGUN_API_KEY=your_mailgun_api_key
VITE_MAILGUN_DOMAIN=your_mailgun_domain

# SMTP Configuration (alternative to API providers)
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=your_email@gmail.com
VITE_SMTP_PASS=your_app_password
```

### 2. Deploy Supabase Edge Function

```bash
# Navigate to your project directory
cd /path/to/your/project

# Deploy the edge function
supabase functions deploy send-todo-notification

# Set environment variables for the edge function
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set APP_URL=https://your-app-domain.com
```

### 3. Email Provider Setup

#### Option A: Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Set `VITE_EMAIL_PROVIDER=resend` and `VITE_RESEND_API_KEY=your_key`

#### Option B: SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Set `VITE_EMAIL_PROVIDER=sendgrid` and `VITE_SENDGRID_API_KEY=your_key`

#### Option C: Mailgun
1. Sign up at [mailgun.com](https://mailgun.com)
2. Get your API key and domain
3. Set `VITE_EMAIL_PROVIDER=mailgun`, `VITE_MAILGUN_API_KEY=your_key`, and `VITE_MAILGUN_DOMAIN=your_domain`

#### Option D: Custom SMTP
1. Configure your SMTP server settings
2. Set `VITE_EMAIL_PROVIDER=smtp` and configure SMTP environment variables

## Usage

### Automatic Notifications

Email notifications are sent automatically when:
- A new todo is created and assigned to users
- The todo creation process completes successfully
- User email addresses are valid and found in the profiles table

### Testing the System

1. **Dashboard Test**: Use the "Test Email Notifications" component on the Dashboard
2. **Todo Creation Test**: Create a new todo and assign it to yourself
3. **Edge Function Test**: Test the edge function directly via API

### Manual Testing

```typescript
import { todoNotificationService } from '@/services/email/todoNotificationService';

// Test email notification
const result = await todoNotificationService.sendTestNotification('user@example.com');
console.log('Test result:', result);
```

## Email Templates

### Todo Notification Template

The system uses a professional HTML email template with:
- **Header**: CIGASS branding with gradient background
- **Content**: Task details including title, description, project, deadline
- **Action Button**: Direct link to view the task in the application
- **Footer**: System information and contact details

### Template Variables

- `{{recipientName}}`: User's display name
- `{{taskTitle}}`: Task title
- `{{taskDescription}}`: Task description
- `{{projectName}}`: Associated project name (if any)
- `{{deadline}}`: Task deadline (if any)
- `{{assignedBy}}`: Name of person who assigned the task
- `{{appUrl}}`: Application URL

## Error Handling

### Graceful Degradation

- Email failures don't prevent todo creation
- Failed email attempts are logged for debugging
- System continues to function even if email service is unavailable

### Common Issues

1. **Edge Function Not Deployed**
   - Error: "Edge function failed: 404"
   - Solution: Deploy the edge function using `supabase functions deploy`

2. **Invalid API Key**
   - Error: "Email service error: 401"
   - Solution: Check and update your email provider API key

3. **User Not Found**
   - Warning: "User profile not found for email"
   - Solution: Ensure user exists in the profiles table

4. **CORS Issues**
   - Error: "CORS preflight failed"
   - Solution: Check edge function CORS configuration

## Monitoring and Logging

### Console Logs

The system provides detailed logging:
- Email service initialization
- Todo creation and notification triggers
- Email sending attempts and results
- Error details for debugging

### Edge Function Logs

View edge function logs:
```bash
supabase functions logs send-todo-notification
```

## Security Considerations

1. **API Key Protection**: Store API keys in environment variables
2. **Email Validation**: Validate email addresses before sending
3. **Rate Limiting**: Implement rate limiting for email sending
4. **Authentication**: Edge function requires valid Supabase authentication

## Performance Optimization

1. **Asynchronous Processing**: Email sending doesn't block todo creation
2. **Batch Processing**: Multiple emails are sent efficiently
3. **Caching**: User profile information is cached where possible
4. **Error Recovery**: Failed emails are logged but don't affect system performance

## Future Enhancements

1. **Email Preferences**: Allow users to configure notification preferences
2. **Email Templates**: Customizable email templates per organization
3. **Scheduled Emails**: Support for scheduled task reminders
4. **Email Analytics**: Track email open rates and engagement
5. **Multi-language Support**: Internationalized email templates
6. **Rich Notifications**: Include task attachments and rich content

## Troubleshooting

### Email Not Sending

1. Check environment variables are set correctly
2. Verify email provider API key is valid
3. Ensure edge function is deployed and accessible
4. Check browser console for error messages
5. Verify user email exists in profiles table

### Test Email Fails

1. Use the test component on the Dashboard
2. Check edge function logs for detailed error information
3. Verify email provider configuration
4. Test with a simple email address

### Edge Function Issues

1. Deploy the function: `supabase functions deploy send-todo-notification`
2. Check function status: `supabase functions list`
3. View logs: `supabase functions logs send-todo-notification`
4. Test function directly via API

## Support

For issues with the email notification system:
1. Check the troubleshooting section above
2. Review console logs and edge function logs
3. Verify email provider configuration
4. Test with the built-in test components 