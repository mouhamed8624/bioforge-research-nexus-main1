#!/bin/bash

# Email Notification Edge Function Deployment Script
# This script deploys the Supabase Edge Function for email notifications

echo "🚀 Deploying Email Notification Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run this from your project root."
    exit 1
fi

# Deploy the edge function
echo "📦 Deploying send-todo-notification edge function..."
supabase functions deploy send-todo-notification

if [ $? -eq 0 ]; then
    echo "✅ Edge function deployed successfully!"
    
    echo ""
    echo "🔧 Next steps:"
    echo "1. Set up your email provider (Resend, SendGrid, Mailgun, or SMTP)"
    echo "2. Configure environment variables in your .env file"
    echo "3. Set edge function secrets:"
    echo "   supabase secrets set RESEND_API_KEY=your_api_key"
    echo "   supabase secrets set APP_URL=https://your-app-domain.com"
    echo ""
    echo "📖 For detailed setup instructions, see EMAIL_NOTIFICATION_SYSTEM.md"
    
else
    echo "❌ Failed to deploy edge function. Please check the error messages above."
    exit 1
fi 