declare global {
  interface Window {
    emailjs: any;
  }
}

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

interface EmailParams {
  to_name: string;
  to_email: string;
  from_name: string;
  subject: string;
  message: string;
}

export const sendEmail = async (params: EmailParams): Promise<void> => {
  if (!window.emailjs) {
    throw new Error('EmailJS CDN is not loaded properly in index.html');
  }

  try {
    await window.emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
  } catch (err: any) {
    throw new Error('Email sending failed: ' + JSON.stringify(err));
  }
};

export const notifyOwnerContact = async (
  ownerEmail: string,
  ownerName: string,
  tenantName: string,
  propertyTitle: string,
  message: string
) => {
  await sendEmail({
    to_email: ownerEmail,
    to_name: ownerName,
    from_name: tenantName,
    subject: `New inquiry about ${propertyTitle}`,
    message,
  });
};

export const notifyMaintenanceCreated = async (
  ownerEmail: string,
  ownerName: string,
  title: string,
  propertyTitle: string
) => {
  await sendEmail({
    to_email: ownerEmail,
    to_name: ownerName,
    from_name: 'Hive System',
    subject: `New maintenance request: ${title}`,
    message: `A new maintenance request has been submitted for ${propertyTitle}: "${title}". Please log in to review it.`,
  });
};

export const notifyMaintenanceResolved = async (
  tenantEmail: string,
  tenantName: string,
  title: string
) => {
  await sendEmail({
    to_email: tenantEmail,
    to_name: tenantName,
    from_name: 'Hive System',
    subject: `Maintenance request resolved: ${title}`,
    message: `Your maintenance request "${title}" has been marked as resolved. If you have any further issues, please submit a new request.`,
  });
};

export const notifyOwnerBookingRequest = async (
  ownerEmail: string,
  ownerName: string,
  tenantName: string,
  propertyTitle: string,
  message: string
) => {
  try {
    await sendEmail({
      to_email: ownerEmail,
      to_name: ownerName,
      from_name: tenantName,
      subject: `New booking request for ${propertyTitle}`,
      message:
        `Hi ${ownerName},\n\n` +
        `${tenantName} has sent a booking request for your property "${propertyTitle}".\n\n` +
        (message ? `Their message:\n"${message}"\n\n` : '') +
        `Log in to Hive to review and respond to the request.`,
    });
  } catch { /* fire-and-forget */ }
};

/**
 * Test EmailJS configuration
 */
export const testEmailJS = async (testEmail: string = 'test@example.com'): Promise<boolean> => {
  try {
    const testData = {
      to_email: testEmail,
      to_name: 'Test User',
      from_name: 'Test Sender',
      subject: 'Test Email from Hive',
      message: 'This is a test message from the Hive app. If you see this, EmailJS is working perfectly!',
    };

    console.log('🧪 Testing EmailJS with:', testData);
    await sendEmail(testData);
    return true;
  } catch (error) {
    console.error('❌ EmailJS test failed:', error);
    return false;
  }
};
