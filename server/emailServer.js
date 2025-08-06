import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    
    console.log('📧 Sending email via server:', { to, subject });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_i3NbcnUz_CodFbefc8zW24aoZJYiebvav',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CIGASS <onboarding@resend.dev>',
        to,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return res.status(response.status).json({
        success: false,
        error: `Resend API error: ${response.status} - ${errorData.message || response.statusText}`
      });
    }

    const result = await response.json();
    console.log('✅ Email sent successfully:', result.id);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      id: result.id
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Email server running on http://localhost:${PORT}`);
  console.log('📧 Ready to send emails via Resend API');
}); 