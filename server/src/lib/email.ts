import nodemailer from "nodemailer";

/**
 * Function to send an email using the SMTP configuration provided in the environment variables.
 *
 * @param to - The email address to which the email should be sent.
 * @param subject - The subject of the email.
 * @param body - The body of the email.
 * 
 * @since v1.0.0
 * @return void
 */
const sendEmail = async (to: string, subject: string, body: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: to,
    subject: subject,
    text: body,
    html: body,
  });
};

export { sendEmail };
