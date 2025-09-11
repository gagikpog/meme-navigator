function normalizeString(text) {
    return text.toLowerCase().trim().replace(/\W/g, (v) => {
        if (v === 'ё') {
            return 'е'
        }

        return v !== v.toUpperCase() ? v : ' ';
    }).replace(/\s+/g, ' ');
}

const translateMap = {
    ф: 'a', и: 'b', с: 'c', в: 'd', у: 'e', а: 'f', п: 'g', р: 'h', ш: 'i', о: 'j', л: 'k', д: 'l', ь: 'm', т: 'n',
    щ: 'o', з: 'p', й: 'q', к: 'r', ы: 's', е: 't', г: 'u', м: 'v', ц: 'w', ч: 'x', н: 'y', я: 'z',

    f: 'а', ',': 'б', d: 'в', u: 'г', l: 'д', t: 'е', '~': 'ё', ';': 'ж', p: 'з', b: 'и', q: 'й', r: 'к', k: 'л',
    v: 'м', y: 'н', j: 'о', g: 'п', h: 'р', c: 'с', n: 'т', e: 'у', a: 'ф', '[': 'х', w: 'ц', x: 'ч', i: 'ш', o: 'щ',
    '\'': 'э', '.': 'ю', z: 'я'
};

function translate(str) {
    return str.split('').map((char) => translateMap[char] || char).join('');
}

export default function compareText(tags, searchString) {
    if ((!tags || tags.length === 0) && searchString === '') {
      return true;
    }

    const normalizedSearch = normalizeString(searchString);
    const normalizedTranslateSearch = normalizeString(translate(searchString));

    return tags.some((tag) => {
      try {
        const normalizedTag = normalizeString(tag)
        return normalizedTag.search(normalizedSearch) !== -1 || normalizedTag.search(normalizedTranslateSearch) !== -1;
      } catch (error) {
        return false;
      }
    });
}
