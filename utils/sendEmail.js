import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// export const sendEmail = await resend.emails.send({
//     from: 'onboarding@resend.dev',
//     to: 'rajeevkr8917@gmail.com',
//     subject: 'Hello World',
//     html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
// });

export const sendEmail = async (to, subject, html) => {
    try {
        const response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: to,
            subject: subject,
            html: html
        });
        console.log(response);
    } catch (error) {
        console.error(error);
    }
}
