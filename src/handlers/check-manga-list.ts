import { APIGatewayProxyHandler } from 'aws-lambda';
import axios from 'axios';
import cheerio from 'cheerio';

import { sendEmail } from '../send-email';
import { getSSMParameter, updateSSMParameter } from '../ssm-parameter';
import { isChapterNotReady } from '../check-chapter';

const SITE_BASE_URL = 'https://online-one-piece.com';
const TEXT_CONTENT_REGEX = /^One Piece, Chapter (\d+)$/gim;

export const handler: APIGatewayProxyHandler = async () => {
  const parameterName = process.env.PARAMETER_NAME_CHAPTER_NO!;

  const { data } = await axios.get(SITE_BASE_URL);

  const cssSelector = '#ceo_latest_comics_widget-3 > ul > li:nth-child(1)';
  const $ = cheerio.load(data);

  const match = TEXT_CONTENT_REGEX.exec($(cssSelector).text());

  if (!match) {
    console.warn('Unable to match the text with the current cssSelector');
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Unable to match the text with the current cssSelector',
      }),
    };
  }

  // now the list might be shown but the chapter might still not be ready to see yet
  const observedLatestChapterNo = parseInt(match[1]);
  const lastReadChapterNo = parseInt(await getSSMParameter(parameterName));

  if (lastReadChapterNo === observedLatestChapterNo) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `lastReadChapterNo was ${lastReadChapterNo}. Already up to date ✅`,
      }),
    };
  }

  let nextReadyChapter = lastReadChapterNo;
  console.log('nextReadyChapter: ', nextReadyChapter);

  do {
    // if the next chapter is not ready then don't bother looping
    if (await isChapterNotReady(nextReadyChapter + 1)) {
      break;
    }

    // it must be ready to send a notification
    await sendEmail(++nextReadyChapter);

    // do something to update the current last known chapter no
  } while (nextReadyChapter !== observedLatestChapterNo);

  if (nextReadyChapter !== lastReadChapterNo) {
    await updateSSMParameter(parameterName, nextReadyChapter.toString());
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ lastReadChapterNo }),
  };
};
