import emailjs from "@emailjs/browser";

// EmailJS Configuration
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE_NUMBER = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || "";

export const sendEmailNotification = async (
  recipientEmail: string,
  recipientName: string,
  transactionDetails: {
    amount: number;
    type: "sent" | "received" | "self";
    fromUser?: string;
    toUser?: string;
  }
) => {
  try {
    const templateParams = {
      to_email: recipientEmail, // <-- this is correct
      to_name: recipientName,
      transaction_type: transactionDetails.type,
      amount: (transactionDetails.amount / 100).toFixed(2),
      from_user: transactionDetails.fromUser || "N/A",
      to_user: transactionDetails.toUser || "N/A",
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
};

export const sendWhatsAppNotification = async (
  phoneNumber: string,
  message: string
) => {
  try {
    // phoneNumber must be in international format, e.g. +919999999999
    const apiKey = process.env.NEXT_PUBLIC_CALLMEBOT_API_KEY;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
      phoneNumber
    )}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to send WhatsApp message");
    }

    console.log("WhatsApp message sent successfully");
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
  }
};

// ...existing code...

// Test call for sendEmailNotification
// Remove or comment this out in production!
// Test call for sendEmailNotification
// Remove or comment this out in production!
