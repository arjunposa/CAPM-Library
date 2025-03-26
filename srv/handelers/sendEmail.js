const nodemailer = require('nodemailer');

// Create a transporter object
const transporter = nodemailer.createTransport({
    host: 'live.smtp.mailtrap.io',
    port: 587,
    secure: false, // use SSL
    auth: {
        user: "gt8729576@gmail.com",
        pass: "ovwg suns iopu gtrz"
    }
});

// Configure the mail options
const mailOptions = {
    from: 'gt8729576@gmail.com',
    to: 'nagarjunaposa9@gmail.com',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
};

// Send the email
transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        console.log('Error:', error);
    } else {
        console.log('Email sent:', info.response);
    }
});