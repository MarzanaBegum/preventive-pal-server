const nodemailer = require("nodemailer");

const sendEmail = async ({ email, subject, message }) => {
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.NODEMAILER_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.NODEMAILER_USERNAME,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.NODEMAILER_USERNAME,
      to: email,
      subject: subject,
      text: message,
    });

    console.log("email sent sucessfully");
  } catch (error) {
    console.log(error, "email not sent");
  }
};

module.exports = sendEmail;
