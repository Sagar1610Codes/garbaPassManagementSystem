const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../middleware/async');

// @desc    Invite a user
// @route   POST /api/v1/auth/invite
// @access  Private/Admin
exports.inviteUser = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  console.log("email :",email);
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already invited or registered', 400));
  }

  // Create invitation token
  const invitationToken = crypto.randomBytes(20).toString('hex');
  const invitationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  // Create user with minimal required fields for invitation
  const user = await User.create({
    email,
    invitationToken,
    invitationExpires,
    status: 'invited',
    // Set default values for required fields
    name: '',
    college: '',
    // Set a temporary password that will be changed during registration
    password: crypto.randomBytes(16).toString('hex')
  });
  
  // Clear the password so it's not included in any responses
  user.password = undefined;

  // Create invitation URL
  const invitationUrl = `${process.env.FRONTEND_URL}garbaPass/frontend/register/${invitationToken}`;

  // Email message
  const message = `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Garba Gravity Registration Confirmation</title>
  </head>
  <body
    style="
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      padding: 20px;
    "
  >
    <table
      style="
        width: 100%;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      "
    >
      <tr>
        <td>
          <h2 style="color: #2c3e50">
            Payment Confirmed – Complete Your Garba Gravity Registration!
          </h2>
          <p>Dear Participant,</p>
          <p>
            Thank you for your recent payment! We're thrilled to have you join
            us for Garba Gravity. To finalize your registration, please take a
            moment to fill out the required form.
          </p>
          <p>To access the form, simply click the link below:</p>
          <p style="text-align: center; margin: 20px 0">
            <br>
            <a
              href="${invitationUrl}"
              style="
                background-color: #3498db;
                color: #ffffff;
                text-decoration: none;
                padding: 12px 25px;
                border-radius: 5px;
                font-size: 16px;
              "
            >
              Complete Your Garba Gravity Registration Form
            </a>
        </p>
        <br>
          <p>
            Make sure all your details are accurate. If you have any questions
            or need help, feel free to contact us at [support email/phone].
          </p>
          <p>We look forward to seeing you at Garba Gravity!</p>
          <p>Best regards, <br />CACS <br />cacs@iiitkota.ac.in</p>
        </td>
      </tr>
    </table>
  </body>
</html>

  `;
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'You are invited to register on GarbaPass',
      html: message
    });

    res.status(200).json({ 
      success: true, 
      data: 'Invitation sent successfully' 
    });
  } catch (err) {
    console.error(err);
    await User.findOneAndUpdate({ email }, { status: 'rejected' }, { new: true });
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Verify invitation token
// @route   GET /api/v1/auth/verify-invite/:token
// @access  Public
exports.verifyInvitation = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  const user = await User.findOne({
    invitationToken: token,
    invitationExpires: { $gt: Date.now() },
    status: 'invited'
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired invitation token', 400));
  }

  res.status(200).json({
    success: true,
    data: { email: user.email }
  });
});
