import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not configured — emails will be logged, not sent.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  const t = getTransporter();

  if (!t) {
    console.log(`[email skipped — no config] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Email failures should never break the request flow (e.g. order placement)
    console.error("Email send failed:", err.message);
  }
}

export function orderConfirmationEmail(order, userName) {
  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.name} x${i.quantity}</td><td style="padding:6px 0;text-align:right">₹${(
          i.price * i.quantity
        ).toFixed(2)}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>Thanks for your order, ${userName}!</h2>
      <p>Order ID: <strong>${order._id}</strong></p>
      <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>
      <hr/>
      <p>Total Paid: <strong>₹${order.totalAmount.toFixed(2)}</strong></p>
      <p>We'll notify you when your order ships.</p>
    </div>
  `;
}

export function orderStatusUpdateEmail(order, userName) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>Order Update</h2>
      <p>Hi ${userName}, your order <strong>${order._id}</strong> is now:</p>
      <p style="font-size:18px;text-transform:capitalize"><strong>${order.orderStatus}</strong></p>
    </div>
  `;
}
