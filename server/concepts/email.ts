import nodemailer from 'nodemailer';

// // Create a transport for sending emails (replace with your email service's data)
// export function sendemail( ){
  
// }
// const transporter = nodemailer.createTransport({
//   service: 'Gmail', // Use your email service
//   auth: {
//     user: 'yinghouwangdesign@gmail.com', // Your email address
//     pass: '19981118ac', // Your password
//   },
// });

// const mailOptions = {
//   from: 'yinghouwangdesign@gmail.com', // Sender
//   to: 'yinghouwang@gsd.harvard.edu', // Recipient
//   subject: 'Email Subject', // Email subject
//   text: 'Email Body', // Email content in plain text
//   // html: yourHTMLContent, // Email HTML content
// };

// transporter.sendMail(mailOptions, (error, info) => {
//   if (error) {
//     console.error('Email sending failed:', error);
//   } else {
//     console.log('Email sent: ' + info.response);
//   }
// });

// // "use strict";
// const nodemailer = require("nodemailer");
export default class EmailConcept {
  transporter = nodemailer.createTransport({
    host: "smtp.forwardemail.net",
    port: 465,
    secure: true,
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: "testnonreply@vermouthwang.com",
      pass: "3de17036662f068b1acc1b05",
    },
  });

  // async..await is not allowed in global scope, must use a wrapper
  async send(username:string, to:string, text:string) {
    console.log("send email")
    // send mail with defined transport object
    const info = await this.transporter.sendMail({
      from: '"Palliative Care App" <testnonreply@vermouthwang.com>', // sender address
      to: to, // list of receivers
      subject: "Letter from " + username, // Subject line
      text: "Hi this is Palliative Care App, Our user " +username+ " want to send you a letter. This email is not reply-able: " + text, // plain text body
      // html: "<b>Hello world?</b>", // html body
    });

    // console.log("Message sent: %s", info.messageId);
    return { msg: "Email sent successfully!"}
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    //
    // NOTE: You can go to https://forwardemail.net/my-account/emails to see your email delivery status and preview
    //       Or you can use the "preview-email" npm package to preview emails locally in browsers and iOS Simulator
    //       <https://github.com/forwardemail/preview-email>
    //
  }
}

