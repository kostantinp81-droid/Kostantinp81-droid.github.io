const PRICE = 10000;

const form = document.getElementById('bookingForm');
const checkin = document.getElementById('checkin');
const checkout = document.getElementById('checkout');
const total = document.getElementById('total');
const nightsLabel = document.getElementById('nights');
const house = document.getElementById('house');
const statusEl = document.getElementById('formStatus');

const guests = document.getElementById('guests');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const commentInput = document.getElementById('comment');

const today = new Date();
today.setHours(0, 0, 0, 0);

const iso = (date) => date.toISOString().split('T')[0];

if (checkin) {
  checkin.min = iso(today);
}

if (checkout) {
  checkout.min = iso(new Date(today.getTime() + 86400000));
}

function getNights() {
  if (!checkin || !checkout) return 1;

  if (!checkin.value || !checkout.value) return 1;

  const start = new Date(checkin.value + 'T00:00:00');
  const end = new Date(checkout.value + 'T00:00:00');

  const diff = Math.round((end - start) / 86400000);

  return diff > 0 ? diff : 1;
}

function getNightWord(nights) {
  if (nights % 10 === 1 && nights % 100 !== 11) {
    return 'сутки';
  }

  return 'суток';
}

function recalc() {
  if (!checkin || !checkout) return;

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
    total.textContent =
      price.toLocaleString('ru-RU') + ' ₽';
  }

  if (nightsLabel) {
    nightsLabel.textContent =
      nights + ' ' + getNightWord(nights);
  }
}


/* =========================
   ДАТЫ
   ========================= */

if (checkin) {
  checkin.addEventListener('change', recalc);
}

if (checkout) {
  checkout.addEventListener('change', recalc);
}


/* =========================
   ВЫБОР ДОМИКА
   ========================= */

document.querySelectorAll('.choose').forEach((btn) => {

  btn.addEventListener('click', (event) => {

    event.preventDefault();

    /*
      Подставляем выбранный домик
    */

    if (btn.dataset.house && house) {
      house.value = btn.dataset.house;

      /*
        Искусственно вызываем change,
        если понадобится другой логике сайта
      */

      house.dispatchEvent(
        new Event('change', {
          bubbles: true
        })
      );
    }

    /*
      Прокрутка к бронированию
    */

    const bookingSection =
      document.getElementById('booking');

    if (bookingSection) {

      const headerOffset = 80;

      const position =
        bookingSection.getBoundingClientRect().top +
        window.scrollY -
        headerOffset;

      window.scrollTo({
        top: position,
        behavior: 'smooth'
      });

      /*
        Через небольшой промежуток
        ставим курсор на дату заезда
      */

      setTimeout(() => {
        if (checkin) {
          checkin.focus({
            preventScroll: true
          });
        }
      }, 700);

    } else if (form) {

      /*
        Запасной вариант,
        если секции #booking нет
      */

      form.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

  });

});


/* =========================
   МОБИЛЬНОЕ МЕНЮ
   ========================= */

const menuButton =
  document.querySelector('.menu');

const topbarNav =
  document.querySelector('.topbar nav');

if (menuButton && topbarNav) {

  menuButton.addEventListener('click', () => {

    topbarNav.classList.toggle('open');

  });

}


/* =========================
   ОТПРАВКА ЗАЯВКИ
   ========================= */

if (form) {

  form.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();

      recalc();

      const nights = getNights();
      const price = nights * PRICE;

      const submitButton =
        form.querySelector(
          'button[type="submit"]'
        );

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent =
          'ОТПРАВЛЯЕМ...';
      }

      if (statusEl) {
        statusEl.textContent =
          'Отправляем заявку...';
      }


      /* =========================
         ДАННЫЕ ЗАЯВКИ
         ========================= */

      const data = new FormData();

      data.append(
        'house',
        house ? house.value : ''
      );

      data.append(
        'checkin',
        checkin ? checkin.value : ''
      );

      data.append(
        'checkout',
        checkout ? checkout.value : ''
      );

      data.append(
        'guests',
        guests ? guests.value : ''
      );

      data.append(
        'name',
        nameInput
          ? nameInput.value.trim()
          : ''
      );

      data.append(
        'phone',
        phoneInput
          ? phoneInput.value.trim()
          : ''
      );

      data.append(
        'comment',
        commentInput
          ? commentInput.value.trim()
          : ''
      );

      data.append(
        'nights',
        nights
      );

      data.append(
        'total',
        price
      );


      /* =========================
         ОТПРАВКА НА API
         ========================= */

      try {

        const response = await fetch(
          'https://api.островжайск.рф/telegram.php',
          {
            method: 'POST',
            body: data
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.ok
        ) {

          console.error(
            'Ответ сервера:',
            result
          );

          throw new Error(
            result.error ||
            'Не удалось отправить заявку'
          );
        }


        /* =========================
           УСПЕХ
           ========================= */

        if (statusEl) {

          statusEl.innerHTML =
            '<strong>Заявка отправлена!</strong><br>' +
            'Мы свяжемся с вами для подтверждения бронирования.<br><br>' +
            'Телефон: ' +
            '<a href="tel:+79200540303">' +
            '<strong>+7 (920) 054-03-03</strong>' +
            '</a>';

        }

        form.reset();

        if (checkin) {
          checkin.min = iso(today);
        }

        if (checkout) {
          checkout.min =
            iso(
              new Date(
                today.getTime() +
                86400000
              )
            );
        }

        recalc();

      } catch (error) {

        console.error(
          'Ошибка заявки:',
          error
        );

        if (statusEl) {

          statusEl.innerHTML =
            'Не удалось отправить заявку.<br><br>' +
            'Позвоните нам: ' +
            '<a href="tel:+79200540303">' +
            '<strong>+7 (920) 054-03-03</strong>' +
            '</a>';

        }

      } finally {

        if (submitButton) {

          submitButton.disabled = false;

          submitButton.textContent =
            'ОТПРАВИТЬ ЗАЯВКУ';

        }

      }

    }
  );

}


/* =========================
   ПЕРВЫЙ РАСЧЁТ
   ========================= */

recalc();
