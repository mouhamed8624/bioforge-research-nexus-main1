#!/bin/bash

# Setup script for email notification system environment variables

echo "Setting up email notification system environment variables..."

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOF
# Email Notification System Configuration
VITE_EMAIL_ENABLED=true
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_i3NbcnUz_CodFbefc8zW24aoZJYiebvav
VITE_APP_URL=http://localhost:8084

# Supabase Configuration (already configured in client.ts)
# VITE_SUPABASE_URL=https://esrlselsbcpavfsmmida.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcmxzZWxzYmNwYXZmc21taWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODk5NjEsImV4cCI6MjA2NTk2NTk2MX0.mHIh4fmsFuAPVa_NetjOfzTL4FuStxzgOAabiQrvjYk
EOF
    echo "✅ .env.local file created successfully!"
else
    echo "⚠️  .env.local file already exists. Please check if it contains the required variables."
fi

echo ""
echo "📧 Email System Environment Variables:"
echo "VITE_EMAIL_ENABLED=true"
echo "VITE_EMAIL_PROVIDER=resend"
echo "VITE_RESEND_API_KEY=re_i3NbcnUz_CodFbefc8zW24aoZJYiebvav"
echo "VITE_APP_URL=http://localhost:8084"
echo ""
echo "🚀 To start the system:"
echo "1. Run: ./start-email-system.sh"
echo "2. Or manually:"
echo "   - Terminal 1: node server/emailServer.js"
echo "   - Terminal 2: npm run dev"
echo ""
echo "🧪 To test:"
echo "1. Go to Dashboard"
echo "2. Click 'Load Verified Team Emails'"
echo "3. Click 'Test Email System'"
echo "4. Create a todo and assign it to team members" 