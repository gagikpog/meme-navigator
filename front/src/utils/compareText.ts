const normalizeString = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/\W/g, (value) => {
      if (value === 'ё') {
        return 'е';
      }

      return value !== value.toUpperCase() ? value : ' ';
    })
    .replace(/\s+/g, ' ');

const translateMap: Record<string, string> = {
  ф: 'a',
  и: 'b',
  с: 'c',
  в: 'd',
  у: 'e',
  а: 'f',
  п: 'g',
  р: 'h',
  ш: 'i',
  о: 'j',
  л: 'k',
  д: 'l',
  ь: 'm',
  т: 'n',
  щ: 'o',
  з: 'p',
  й: 'q',
  к: 'r',
  ы: 's',
  е: 't',
  г: 'u',
  м: 'v',
  ц: 'w',
  ч: 'x',
  н: 'y',
  я: 'z',
  f: 'а',
  ',': 'б',
  d: 'в',
  u: 'г',
  l: 'д',
  t: 'е',
  '~': 'ё',
  ';': 'ж',
  p: 'з',
  b: 'и',
  q: 'й',
  r: 'к',
  k: 'л',
  v: 'м',
  y: 'н',
  j: 'о',
  g: 'п',
  h: 'р',
  c: 'с',
  n: 'т',
  e: 'у',
  a: 'ф',
  '[': 'х',
  w: 'ц',
  x: 'ч',
  i: 'ш',
  o: 'щ',
  "'": 'э',
  '.': 'ю',
  z: 'я'
};

const translate = (str: string): string =>
  str
    .split('')
    .map((char) => translateMap[char] || char)
    .join('');

const compareText = (tags: string[] = [], searchString: string): boolean => {
  if (tags.length === 0 && searchString === '') {
    return true;
  }

  const normalizedSearch = normalizeString(searchString);
  const normalizedTranslateSearch = normalizeString(translate(searchString));

  return tags.some((tag) => {
    try {
      const normalizedTag = normalizeString(tag);
      return (
        normalizedTag.includes(normalizedSearch) ||
        normalizedTag.includes(normalizedTranslateSearch)
      );
    } catch {
      return false;
    }
  });
};

export default compareText;
