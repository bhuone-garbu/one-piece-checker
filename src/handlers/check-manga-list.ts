import type { Context, ScheduledEvent } from 'aws-lambda';
import axios from 'axios';
import cheerio from 'cheerio';

import { sendEmail } from '../send-email';
import { getSSMParameter, updateSSMParameter } from '../ssm-parameter';
import { isChapterNotReady } from '../check-chapter';

const SITE_BASE_URL = 'https://online-one-piece.com';
const TEXT_CONTENT_REGEX = /^One Piece, Chapter (\d+)$/gim;

export const handler = async (event: ScheduledEvent, context: Context) => {
  const parameterName = process.env.PARAMETER_NAME_CHAPTER_NO!;

  const { data } = await axios.get(SITE_BASE_URL);

  const cssSelector = '#ceo_latest_comics_widget-3 > ul > li:nth-child(1)';
  const $ = cheerio.load(data);

  const match = TEXT_CONTENT_REGEX.exec($(cssSelector).text());

  if (!match) {
    console.warn('Unable to match the text with the current cssSelector');
    return;
  }

  // now the list might be shown but the chapter might still not be ready to see yet
  const observedLatestChapterNo = parseInt(match[1]);
  const lastReadChapterNo = parseInt(await getSSMParameter(parameterName));

  if (lastReadChapterNo === observedLatestChapterNo) {
    return;
  }

  let nextChapter = lastReadChapterNo;

  do {
    // if the next chapter is not ready then don't bother looping
    if (await isChapterNotReady(nextChapter + 1)) {
      break;
    }

    // it must be ready to send a notification
    await sendEmail(++nextChapter);

    // do something to update the current last known chapter no
  } while (nextChapter !== observedLatestChapterNo);

  if (nextChapter !== lastReadChapterNo) {
    await updateSSMParameter(parameterName, nextChapter.toString());
  }
};
