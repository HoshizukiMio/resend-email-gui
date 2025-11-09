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
    const headers = {
      'svix-id': request.headers.get('svix-id')!,
      'svix-timestamp': request.headers.get('svix-timestamp')!,
      'svix-signature': request.headers.get('svix-signature')!,
    };

    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET is not set');
      return new NextResponse('Webhook secret is not set', { status: 500 });
    }

    const event = resend.webhooks.verify({
      payload,
      headers: headers as any,
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
