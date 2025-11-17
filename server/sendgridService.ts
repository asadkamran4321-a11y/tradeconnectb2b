import sgMail from '@sendgrid/mail';

interface SendGridEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmailWithSendGrid(params: SendGridEmailParams): Promise<EmailResult> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      return {
        success: false,
        error: "SendGrid API key not configured"
      };
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: params.to,
      from: "marketing@gtsmt.com", // Using verified sender from gtsmt.com
      subject: params.subject,
      text: params.text,
      html: params.html,
    };

    await sgMail.send(msg);

    return {
      success: true
    };
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    
    let errorMessage = 'Unknown email service error';
    if (error.response?.body?.errors) {
      errorMessage = error.response.body.errors.map((e: any) => e.message).join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}