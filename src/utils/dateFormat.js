export function formatedDate(date) {
  if (!date) return '';

  const [day, month, year] = date.split('/');
  const dateObj = new Date(year, month - 1, day);

  const finalDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dateObj);

  return finalDate;
}