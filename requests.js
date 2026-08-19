const REQUESTS_STORAGE_KEY =
  'ostrov-zhaisk-applications-v1';

const requestsList =
  document.getElementById('requestsList');

const dateFormatter =
  new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  );

const dateTimeFormatter =
  new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  );

function loadStoredRequests() {
  try {
    const saved = localStorage.getItem(
      REQUESTS_STORAGE_KEY
    );

    if (!saved) return [];

    const requests = JSON.parse(saved);

    return Array.isArray(requests)
      ? requests
      : [];
  } catch (error) {
    console.error(
      'Не удалось прочитать заявки:',
      error
    );

    return [];
  }
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? 'Не указано'
    : dateFormatter.format(date);
}

function formatCreatedAt(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ''
    : dateTimeFormatter.format(date);
}

function addRequestDetail(list, label, value) {
  const item = document.createElement('div');
  const term = document.createElement('dt');
  const description = document.createElement('dd');

  term.textContent = label;
  description.textContent = value;

  item.append(term, description);
  list.append(item);
}

function createRequestCard(request) {
  const card = document.createElement('article');
  const head = document.createElement('div');
  const status = document.createElement('div');
  const statusDot = document.createElement('span');
  const statusText = document.createElement('strong');
  const createdAt = document.createElement('time');
  const title = document.createElement('h2');
  const details = document.createElement('dl');
  const note = document.createElement('p');

  card.className = 'request-card';
  head.className = 'request-card-head';
  status.className = 'request-status';
  statusDot.className = 'request-status-dot';
  statusText.textContent = 'Отправлена';

  const submittedAt = formatCreatedAt(
    request.createdAt
  );

  createdAt.textContent = submittedAt
    ? `Отправлена ${submittedAt}`
    : 'Отправлена недавно';

  title.textContent =
    `Домик «${request.house || 'Не выбран'}»`;

  details.className = 'request-details';

  addRequestDetail(
    details,
    'Заезд',
    formatDate(request.checkin)
  );

  addRequestDetail(
    details,
    'Выезд',
    formatDate(request.checkout)
  );

  addRequestDetail(
    details,
    'Гостей',
    String(request.guests || 'Не указано')
  );

  addRequestDetail(
    details,
    'Итого',
    Number(request.total || 0).toLocaleString('ru-RU') +
      ' ₽'
  );

  note.className = 'request-note';
  note.textContent =
    'Ожидайте подтверждения — администратор свяжется с вами по телефону.';

  status.append(statusDot, statusText);
  head.append(status, createdAt);
  card.append(head, title, details, note);

  return card;
}

function createEmptyState() {
  const empty = document.createElement('article');
  const title = document.createElement('h2');
  const text = document.createElement('p');
  const link = document.createElement('a');

  empty.className = 'requests-empty';
  title.textContent = 'Заявок пока нет';
  text.textContent =
    'После отправки формы здесь появятся домик, даты, сумма и статус заявки.';
  link.className = 'button gold';
  link.href = 'index.html#booking';
  link.textContent = 'Забронировать домик';

  empty.append(title, text, link);

  return empty;
}

if (requestsList) {
  const requests = loadStoredRequests();

  if (requests.length) {
    requests.forEach((request) => {
      requestsList.append(
        createRequestCard(request)
      );
    });
  } else {
    requestsList.append(createEmptyState());
  }
}
