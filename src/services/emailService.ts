/**
 * emailService.ts
 * Uses EmailJS (already configured in .env) to send notification emails.
 * We POST directly to the EmailJS REST API so we don't need any extra npm package.
 */

import emailjs from '@emailjs/browser';

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string;

async function send(params: Record<string, string>) {
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
  } catch {
    // fire-and-forget — never throw
  }
}

export const emailNewBookingRequest = async ({
  ownerEmail,
  ownerName,
  tenantName,
  propertyTitle,
  message,
}: {
  ownerEmail: string;
  ownerName: string;
  tenantName: string;
  propertyTitle: string;
  message: string;
}) =>
  send({
    to_email:        ownerEmail,
    to_name:         ownerName,
    subject:         `New booking request for ${propertyTitle}`,
    message:
      `Hi ${ownerName},\n\n` +
      `${tenantName} has sent a booking request for your property "${propertyTitle}".\n\n` +
      `Their message:\n"${message}"\n\n` +
      `Log in to Hive to review and respond to the request.`,
    from_name: 'Hive Platform',
  });

export const emailNewMessage = async ({
  recipientEmail,
  recipientName,
  senderName,
  propertyTitle,
  messageText,
}: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  propertyTitle: string;
  messageText: string;
}) =>
  send({
    to_email: recipientEmail,
    to_name:  recipientName,
    subject:  `New message from ${senderName} – ${propertyTitle}`,
    message:
      `Hi ${recipientName},\n\n` +
      `You have a new message from ${senderName} regarding "${propertyTitle}":\n\n` +
      `"${messageText}"\n\n` +
      `Log in to Hive to continue the conversation.`,
    from_name: 'Hive Platform',
  });
