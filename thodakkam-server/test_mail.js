const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 't67757535@gmail.com',
    pass: 'hhtm smwp zpnq mgjw'
  },
  tls: {
    rejectUnauthorized: false
  }
});

const mailOptions = {
  from: 't67757535@gmail.com',
  to: 'selv39629@gmail.com',
  subject: 'Test Email 2',
  text: 'This is a test email 2'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log('Error:', error);
  }
  console.log('Message sent: %s', info.messageId);
});
