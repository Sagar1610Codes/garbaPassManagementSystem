const qrcode = require('qrcode');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;


// configure cloudinary (use your own env vars!)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create a transporter using your email service configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },tls: {
    rejectUnauthorized: false,  // Disable TLS validation
  },
});

const EMAIL_SUBJECT = 'Your Exclusive Digital Pass is Ready!';

async function generateQrCode(data) {
    try {
        const qrData = await qrcode.toDataURL(data, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 1,
            color: { dark: '#2D3748', light: '#FFFFFF' }
        });

        const uploadResponse = await cloudinary.uploader.upload(
            `${qrData}`,
            {
              folder: 'qr-codes',   // optional: saves inside a "qr-codes" folder
              public_id: `qr_${Date.now()}`, // optional: custom file name
              overwrite: true,
              resource_type: 'image',
            }
          );
      
          // Return the Cloudinary hosted URL
          return uploadResponse.secure_url;
      
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('QR code generation failed.');
    }
}

function getHtmlTemplate(qrDataUri, userName, passUrl) {
    return `
    <!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>$EMAIL_SUBJECT</title>
    <style>
        /* Use a Google Font fallback: "Merriweather" for a traditional look */
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700&display=swap');

        body {
            margin: 0; padding: 0;
            background-color: #FFF3E0; /* Warm saffron-ish background */
            font-family: 'Merriweather', Georgia, serif;
        }

        .container {
            max-width: 480px;
            background-color: #fff8f0;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 20px rgba(128, 0, 0, 0.3);
            border: 4px solid #B71C1C; /* Deep maroon border */
            margin: 30px auto;
        }

        .header {
            background: linear-gradient(45deg, #B71C1C, #F57C00); /* Maroon to orange gradient */
            color: #FFD54F; /* Goldish text */
            text-align: center;
            padding: 30px 20px 20px;
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
            font-size: 30px;
            font-weight: 900;
            letter-spacing: 3px;
            font-family: 'Merriweather', serif;
            position: relative;
        }

        .header::after {
            content: "✨";
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 24px;
            opacity: 0.7;
        }

        .content {
            padding: 40px 30px;
            color: #4E342E; /* Dark brown */
            text-align: center;
        }

        .content p {
            font-size: 16px;
            margin-bottom: 25px;
            color: #6D4C41;
        }

        .content strong {
            color: #D84315; /* Deep orange/red */
        }

        .qr-container {
            margin: 0 auto 30px;
            background-color: white;
            border-radius: 12px;
            border: 3px solid #F57C00; /* Bright saffron border */
            padding: 20px;
            display: inline-block;
        }

        .qr-container img {
            display: block;
            max-width: 100%;
            height: auto;
            border-radius: 6px;
        }

        .encoded-label {
            font-size: 12px;
            color: #A1887F;
            margin-top: 20px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 600;
            font-family: 'Merriweather', serif;
        }

        .encoded-data {
            font-size: 14px;
            font-weight: bold;
            color: #4E342E;
            margin: 5px 0 0 0;
            word-break: break-all;
        }

        .footer {
            text-align: center;
            padding: 15px;
            background-color: #FFE0B2;
            color: #6D4C41;
            font-size: 12px;
            border-bottom-left-radius: 16px;
            border-bottom-right-radius: 16px;
            font-family: 'Merriweather', serif;
        }

        /* Small decorative motif under header */
        .motif {
            font-size: 24px;
            color: #FFD54F;
            margin-top: 5px;
            letter-spacing: 10px;
        }
    </style>
</head>
<body>

    <div class="container">

        <div class="header">
            Garba Gravity PASS
            <div class="motif">✽ ✦ ✽</div>
        </div>

        <div class="content">
            <p>
                Thank you, <strong>${userName}</strong>. Please present this code for entry.
            </p>

            <div class="qr-container">
                <img src="${qrDataUri}" alt="QR Code" width="220" height="220" />
            </div>

            
        </div>

        

    </div>

</body>
</html>
`;
}

async function sendGarbaPassEmail(recipient, userName) {
    try {
        const passUrl = `${process.env.FRONTEND_URL}/pass/${encodeURIComponent(recipient)}`;
        const qrDataUri = await generateQrCode(passUrl);
        console.log('QR Code generated:', qrDataUri);
        const htmlContent = getHtmlTemplate(qrDataUri, userName, passUrl);

        const mailOptions = {
            from: `"Garba Gravity" <${process.env.EMAIL_FROM}>`,
            to: recipient,
            subject: EMAIL_SUBJECT,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log('Garba Pass email sent to:', recipient);
        return true;
    } catch (error) {
        console.error('Error sending Garba Pass email:', error);
        throw error;
    }
}

module.exports = { sendGarbaPassEmail };
