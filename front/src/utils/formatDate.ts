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
] as const;

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(`${dateStr.replace(' ', 'T')}Z`);
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()] ?? '';
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} ${hours}:${minutes}`;
};

export default formatDate;
