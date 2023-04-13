const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, 
    auth: {
      user: process.env.SMTP_USERNAME, 
      pass: process.env.SMTP_PASSWORD, 
    },
  });

  let info = await transporter.sendMail({
    from: `${process.env.SMTP_FROM} <${process.env.SMTP_FROM_EMAIL}>`, 
    to: options.email, 
    subject: options.subject, 
    html: options.message, 
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

  return info;
};

module.exports = sendEmail;
