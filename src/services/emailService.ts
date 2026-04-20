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

/** Tenant submits a reservation / rent request */
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
    message_preview: `Reservation request for "${propertyTitle}" from ${tenantName}${message ? ': ' + message.slice(0, 100) : ''}`,
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

/** Tenant initiates notice period — notifies owner */
export const notifyNoticePeriod = (
  ownerEmail: string,
  ownerName: string,
  tenantName: string,
  propertyTitle: string,
) =>
  send({
    timestamp: now(),
    to_name: ownerName,
    message_preview: `Notice of termination for "${propertyTitle}" from ${tenantName} (15-day period)`,
    sender_name: tenantName,
    email: ownerEmail,
  });

/** Owner initiates notice period — notifies tenant */
export const notifyNoticeFromOwner = (
  tenantEmail: string,
  tenantName: string,
  ownerName: string,
  propertyTitle: string,
) =>
  send({
    timestamp: now(),
    to_name: tenantName,
    message_preview: `Notice of termination for "${propertyTitle}" from owner ${ownerName} (15-day period)`,
    sender_name: ownerName,
    email: tenantEmail,
  });

/** Owner uploads EBM receipt — notifies tenant */
export const notifyEBMUpload = (
  tenantEmail: string,
  tenantName: string,
  propertyTitle: string,
) =>
  send({
    timestamp: now(),
    to_name: tenantName,
    message_preview: `A new tax receipt (EBM) has been uploaded for your payment at "${propertyTitle}"`,
    sender_name: 'Hive System',
    email: tenantEmail,
  });

/** Owner creates a new contract — notifies tenant */
export const notifyContractCreated = (
  tenantEmail: string,
  tenantName: string,
  propertyTitle: string,
) =>
  send({
    timestamp: now(),
    to_name: tenantName,
    message_preview: `A new rental contract has been created for you at "${propertyTitle}"`,
    sender_name: 'Hive System',
    email: tenantEmail,
  });

/** Owner updates property details — notifies the current tenant */
export const notifyPropertyUpdated = (
  tenantEmail: string,
  tenantName: string,
  ownerName: string,
  propertyTitle: string,
  changes: string,
) =>
  send({
    timestamp: now(),
    to_name: tenantName,
    message_preview: `The property "${propertyTitle}" has been updated by the owner ${ownerName}. ${changes}`,
    sender_name: ownerName,
    email: tenantEmail,
  });

/** Owner issues move-out notice to tenant */
export const notifyOwnerNoticeToTenant = (
  tenantEmail: string,
  tenantName: string,
  ownerName: string,
  propertyTitle: string,
  noticeDays: number,
) =>
  send({
    timestamp: now(),
    to_name: tenantName,
    message_preview: `You have been issued a ${noticeDays}-day move-out notice for "${propertyTitle}" by the owner ${ownerName}. Please make arrangements accordingly.`,
    sender_name: ownerName,
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