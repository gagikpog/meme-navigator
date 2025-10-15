  const months = [
    'янв.',
    'февр.',
    'мар.',
    'апр.',
    'май.',
    'июнь.',
    'июль.',
    'авг.',
    'сен.',
    'окт.',
    'нояб.',
    'дек.'
];

export default function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr.replace(' ', 'T') + 'Z');
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} ${hours}:${minutes}`;
}
