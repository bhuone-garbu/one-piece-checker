import sgMail from '@sendgrid/mail';

import { getSSMParameter } from './ssm-parameter';

(async function () {
  sgMail.setApiKey(
    await getSSMParameter(process.env.PARAMETER_NAME_SENDGRID_API_KEY!)
  );
})();

/**
 * Send email using SendGrid - 100 free emails per day, so plenty enough
 * @param chapterNo chapter no
 */
export async function sendEmail(chapterNo: number) {
  const msg = {
    to: process.env.TO_ADD!,
    from: process.env.FROM_ADD!,
    templateId: process.env.SEND_GRID_TEMPLATE_ID!,
    dynamicTemplateData: {
      chapterNo,
      buttonLink: `https://online-one-piece.com/manga/one-piece-chapter-${chapterNo}`,
    },
  };
  await sgMail.send(msg);
}
