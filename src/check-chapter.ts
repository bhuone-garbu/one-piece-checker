import axios from 'axios';
import cheerio from 'cheerio';

export async function isChapterNotReady(chapterNo: number) {
  const { data } = await axios.get(
    `https://online-one-piece.com/manga/one-piece-chapter-${chapterNo}/`
  );

  // the h2 where it will tell if the chapter is available or not
  const cssSelector = 'div.entry-inner > div.entry-content > h2:nth-child(2)';
  const $ = cheerio.load(data);

  const h2Text = $(cssSelector).text();
  return h2Text.toLowerCase().includes('is not available');
}
