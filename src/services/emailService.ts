// Uses EmailJS via CDN global (loaded in index.html)
// Template variables expected: timestamp, to_name, message_preview, sender_name, email

declare global {
  interface Window { emailjs: any; }
}

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

// ── Template shape (must match your EmailJS template) ────────────────
interface TemplateParams {
  timestamp: string; // when the event happened
  to_name: string; // recipient's display name
  message_preview: string; // short subject / preview line
  sender_name: string; // who triggered the notification
  email: string; // recipient email address  ← the "To" field
}

// ── Core sender ───────────────────────────────────────────────────────
const send = async (params: TemplateParams): Promise<void> => {
  if (!window.emailjs) {
    console.error('EmailJS CDN not loaded. Check index.html has the script tag.');
    return;
  }
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error('EmailJS env vars missing (VITE_EMAILJS_SERVICE_ID / TEMPLATE_ID / PUBLIC_KEY).');
    return;
  }
  try {
    await window.emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
  } catch (err: any) {
    // fire-and-forget — log but never crash the UI
    console.error('EmailJS send failed:', JSON.stringify(err));
  }
};

const now = () =>
  new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

// ── Public helpers ────────────────────────────────────────────────────

/** New in-app message — notifies the other party (owner or tenant) */
export const emailNewMessage = (params: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  propertyTitle: string;
  messageText: string;
}) =>
  send({
    timestamp: now(),
    to_name: params.recipientName,
    message_preview: `New message about "${params.propertyTitle}": ${params.messageText.slice(0, 120)}`,
    sender_name: params.senderName,
    email: params.recipientEmail,
  });

/** Tenant contacts owner from property detail page */
export const notifyOwnerContact = (
  ownerEmail: string,
  ownerName: string,
  tenantName: string,
  propertyTitle: string,
  message: string,
) =>
  send({
    timestamp: now(),
    to_name: ownerName,
    message_preview: `New inquiry about "${propertyTitle}": ${message.slice(0, 120)}`,
    sender_name: tenantName,
    email: ownerEmail,
  });

/** Tenant submits a booking / rent request */
export const notifyOwnerBookingRequest = (
  ownerEmail: string,
  ownerName: string,
  tenantName: string,
  propertyTitle: string,
  message: string,
) =>
  send({
    timestamp: now(),
    to_name: ownerName,
    message_preview: `Booking request for "${propertyTitle}" from ${tenantName}${message ? ': ' + message.slice(0, 100) : ''}`,
    sender_name: tenantName,
    email: ownerEmail,
  });

/** New maintenance request — notifies owner */
export const notifyMaintenanceCreated = (
  ownerEmail: string,
  ownerName: string,
  requestTitle: string,
  propertyTitle: string,
) =>
  send({
    timestamp: now(),
    to_name: ownerName,
    message_preview: `New maintenance request for "${propertyTitle}": ${requestTitle}`,
    sender_name: 'Hive System',
    email: ownerEmail,
  });

/** Maintenance resolved — notifies tenant */
export const notifyMaintenanceResolved = (
  tenantEmail: string,
  tenantName: string,
  requestTitle: string,
) =>
  send({
    timestamp: now(),
    to_name: tenantName,
    message_preview: `Your maintenance request "${requestTitle}" has been resolved`,
    sender_name: 'Hive System',
    email: tenantEmail,
  });

/** Quick test — call from browser console: testEmailJS('you@example.com') */
export const testEmailJS = async (toEmail = 'test@example.com'): Promise<boolean> => {
  console.log('🧪 Testing EmailJS...');
  try {
    await send({
      timestamp: now(),
      to_name: 'Test User',
      message_preview: 'Test email from Hive — if you see this, EmailJS is working!',
      sender_name: 'Hive System',
      email: toEmail,
    });
    console.log('✅ EmailJS test passed');
    return true;
  } catch (err) {
    console.error('❌ EmailJS test failed:', err);
    return false;
  }
};