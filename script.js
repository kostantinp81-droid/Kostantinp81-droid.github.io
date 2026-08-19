const PRICE = 10000;

const form = document.getElementById('bookingForm');
const checkin = document.getElementById('checkin');
const checkout = document.getElementById('checkout');
const total = document.getElementById('total');
const nightsLabel = document.getElementById('nights');
const house = document.getElementById('house');
const statusEl = document.getElementById('formStatus');

const today = new Date();
today.setHours(0, 0, 0, 0);

const iso = (date) => date.toISOString().split('T')[0];

checkin.min = iso(today);
checkout.min = iso(new Date(today.getTime() + 86400000));

function getNights() {
  if (!checkin.value || !checkout.value) return 1;

  const start = new Date(checkin.value + 'T00:00:00');
  const end = new Date(checkout.value + 'T00:00:00');
  const diff = Math.round((end - start) / 86400000);

  return diff > 0 ? diff : 1;
}

function getNightWord(nights) {
  return 'суток';
}

function recalc() {
  if (checkin.value) {
    const minCheckout = new Date(checkin.value + 'T00:00:00');
    minCheckout.setDate(minCheckout.getDate() + 1);
    checkout.min = iso(minCheckout);

    if (checkout.value && checkout.value <= checkin.value) {
      checkout.value = '';
    }
  }

  const nights = getNights();
  const price = nights * PRICE;

  if (total) {
    total.textContent = price.toLocaleString('ru-RU') + ' ₽';
  }

  if (nightsLabel) {
    nightsLabel.textContent = nights + ' ' + getNightWord(nights);
  }
}

checkin.addEventListener('change', recalc);
checkout.addEventListener('change', recalc);

document.querySelectorAll('.choose').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.house) {
      house.value = btn.dataset.house;
    }
  });
});

const menuButton = document.querySelector('.menu');
const topbarNav = document.querySelector('.topbar nav');

if (menuButton && topbarNav) {
  menuButton.addEventListener('click', () => {
    topbarNav.classList.toggle('open');
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  recalc();

  const nights = getNights();
  const price = nights * PRICE;
  const submitButton = form.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'ОТПРАВЛЯЕМ...';
  }

  if (statusEl) {
    statusEl.textContent = 'Отправляем заявку...';
  }

  const data = new FormData(form);

  data.append('nights', nights);
  data.append('total', price);

  try {
    const response = await fetch(
      'https://api.островжайск.рф/telegram.php',
      {
        method: 'POST',
        body: data
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error('Ошибка отправки');
    }

    if (statusEl) {
      statusEl.innerHTML =
        'Заявка отправлена! Мы свяжемся с вами для подтверждения бронирования.<br><br>' +
        'Телефон: <a href="tel:+79200540303"><strong>+7 (920) 054-03-03</strong></a>';
    }

    form.reset();

    checkin.min = iso(today);
    checkout.min = iso(new Date(today.getTime() + 86400000));

    recalc();

  } catch (error) {
    console.error(error);

    if (statusEl) {
      statusEl.innerHTML =
        'Не удалось отправить заявку.<br><br>' +
        'Позвоните нам: <a href="tel:+79200540303"><strong>+7 (920) 054-03-03</strong></a>';
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'ОТПРАВИТЬ ЗАЯВКУ';
    }
  }
});

recalc();
