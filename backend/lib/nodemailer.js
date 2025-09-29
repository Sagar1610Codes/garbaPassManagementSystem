const nodemailer = require('nodemailer');


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


module.exports = { transporter };
