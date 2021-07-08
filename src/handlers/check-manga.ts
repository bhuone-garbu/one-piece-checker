import type { Context, ScheduledEvent } from 'aws-lambda';
import axios from 'axios';
import cheerio from 'cheerio';

import { sendEmail } from '../send-email';

// augment
/* declare module 'axios' {
  interface AxiosResponse<T = any> {
    request?: {
      res: {
        responseUrl: string;
      };
    };
  }
} */

const SITE_BASE_URL = 'https://online-one-piece.com';
const TEXT_CONTENT_REGEX = /^One Piece, Chapter (\d+)$/gim;

export const handler = async (event: ScheduledEvent, context: Context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);
  console.log('event: ', event);

  // process env
  let lastKnownChapterNo = 1017;
  const { data } = await axios.get(SITE_BASE_URL);

  const cssSelector = '#ceo_latest_comics_widget-3 > ul > li:nth-child(1)';
  const $ = cheerio.load(data);

  const match = TEXT_CONTENT_REGEX.exec($(cssSelector).text());

  if (!match) {
    console.log('Unable to match the text with the current cssSelector');
    return;
  }

  const currentLatestNo = parseInt(match[1]);

  // if for some reason the last known chapter lagged behind
  do {
    await sendEmail(lastKnownChapterNo + 1);
    lastKnownChapterNo++;

    // do something to update the current last known chapter no
  } while (currentLatestNo !== lastKnownChapterNo);
};
