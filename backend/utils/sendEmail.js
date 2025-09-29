const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter


  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // ⛔ Warning: this disables SSL verification
    },
  });



  // Define email options
  const mailOptions = {
    from: `${process.env.EMAIL_USER}`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
