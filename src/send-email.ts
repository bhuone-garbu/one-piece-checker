import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

/**
 * Send email using SendGrid - 100 free emails per day, so plenty enough
 * @param chapterNo chapter no
 */
export async function sendEmail(chapterNo: number) {
  console.log('Sending email about chapter: ', chapterNo);
  const msg = {
    to: process.env.TO_ADD!,
    from: process.env.FROM_ADD!,
    templateId: process.env.TEMPLATE_ID!,
    dynamicTemplateData: {
      chapterNo,
      buttonLink: `https://online-one-piece.com/manga/one-piece-chapter-${chapterNo}`,
    },
  };
  await sgMail.send(msg);
}
