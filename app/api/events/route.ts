import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

interface WebhookEvent {
  type: string;
  data: {
    id: string;
  };
}

// In-memory store for emails for now
const emails: any[] = [];

export const POST = async (request: NextRequest) => {
  try {
    const payload = await request.text();
    const svix_id = request.headers.get('svix-id');
    const svix_timestamp = request.headers.get('svix-timestamp');
    const svix_signature = request.headers.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new NextResponse('Missing svix headers', { status: 400 });
    }

    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET is not set');
      return new NextResponse('Webhook secret is not set', { status: 500 });
    }

    const headers = {
      id: svix_id,
      timestamp: svix_timestamp,
      signature: svix_signature,
    };

    const event = resend.webhooks.verify({
      payload,
      headers,
      webhookSecret,
    }) as WebhookEvent;

    if (event.type === 'email.received') {
      const { data: email } = await resend.emails.get(event.data.id);
      if (email) {
        emails.unshift(email); // Add new email to the beginning of the array
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new NextResponse('Invalid webhook', { status: 400 });
  }
};

export const GET = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.FRONTEND_PASSWORD}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  return NextResponse.json(emails);
};
