const PRICE = 10000;
const BOOKING_API_URL =
  'https://api.xn--80admnftapige.xn--p1ai/telegram.php';
const DEFAULT_BOOKING_COUNT = 2347;
const APPLICATIONS_STORAGE_KEY =
  'ostrov-zhaisk-applications-v1';
const CONTACT_DETAILS_COOKIE =
  'ostrov_zhaisk_contact_v1';
const VISITOR_ID_COOKIE =
  'ostrov_zhaisk_visitor_v1';

function readApplications() {
  try {
    const saved = localStorage.getItem(
      APPLICATIONS_STORAGE_KEY
    );

    if (!saved) return [];

    const applications = JSON.parse(saved);

    return Array.isArray(applications)
      ? applications
      : [];
  } catch (error) {
    console.error(
      'Не удалось прочитать заявки:',
      error
    );

    return [];
  }
}

function saveApplication(application) {
  try {
    const applications = readApplications();

    applications.unshift({
      id:
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 7),
      house: application.house,
      checkin: application.checkin,
      checkout: application.checkout,
      guests: application.guests,
      nights: application.nights,
      total: application.total,
      status: 'sent',
      createdAt: new Date().toISOString()
    });

    localStorage.setItem(
      APPLICATIONS_STORAGE_KEY,
      JSON.stringify(applications.slice(0, 20))
    );

    return true;
  } catch (error) {
    console.error(
      'Не удалось сохранить заявку:',
      error
    );

    return false;
  }
}

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
const bookingCounter = document.getElementById('bookingCounter');

function readContactDetails() {
  try {
    const prefix = `${CONTACT_DETAILS_COOKIE}=`;
    const savedCookie = document.cookie
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(prefix));

    if (!savedCookie) return {};

    const details = JSON.parse(
      decodeURIComponent(savedCookie.slice(prefix.length))
    );

    return details && typeof details === 'object'
      ? details
      : {};
  } catch (error) {
    console.error(
      'Не удалось прочитать контактные данные:',
      error
    );

    return {};
  }
}

function saveContactDetails() {
  if (!nameInput && !phoneInput) return;

  try {
    const value = encodeURIComponent(
      JSON.stringify({
        name: nameInput ? nameInput.value.trim() : '',
        phone: phoneInput ? phoneInput.value.trim() : ''
      })
    );
    const secure = window.location.protocol === 'https:'
      ? '; Secure'
      : '';

    document.cookie =
      `${CONTACT_DETAILS_COOKIE}=${value}; ` +
      `Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
  } catch (error) {
    console.error(
      'Не удалось сохранить контактные данные:',
      error
    );
  }
}

function restoreContactDetails() {
  const details = readContactDetails();

  if (nameInput && typeof details.name === 'string') {
    nameInput.value = details.name.slice(0, 120);
  }

  if (phoneInput && typeof details.phone === 'string') {
    phoneInput.value = details.phone.slice(0, 60);
  }
}

function renderBookingCount(value, animate = false) {
  if (!bookingCounter) return;

  const count = Number.parseInt(value, 10);

  if (!Number.isFinite(count) || count < DEFAULT_BOOKING_COUNT) {
    return;
  }

  bookingCounter.textContent = count.toLocaleString('ru-RU');

  if (animate) {
    const card = bookingCounter.closest('.booking-counter');

    if (card) {
      card.classList.remove('is-updated');
      window.requestAnimationFrame(() => {
        card.classList.add('is-updated');
        window.setTimeout(
          () => card.classList.remove('is-updated'),
          700
        );
      });
    }
  }
}

async function loadBookingCount() {
  if (!bookingCounter) return;

  const controller = 'AbortController' in window
    ? new AbortController()
    : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), 12000)
    : 0;

  try {
    const response = await fetch(
      `${BOOKING_API_URL}?booking_count=1`,
      {
        cache: 'no-store',
        signal: controller ? controller.signal : undefined
      }
    );
    const result = await response.json();

    if (response.ok && result.ok) {
      renderBookingCount(result.count);
    }
  } catch (error) {
    if (error && error.name === 'AbortError') return;

    console.error(
      'Не удалось обновить счётчик заявок:',
      error
    );
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

restoreContactDetails();

if (nameInput) {
  nameInput.addEventListener('input', saveContactDetails);
}

if (phoneInput) {
  phoneInput.addEventListener('input', saveContactDetails);
}

function readCookieValue(name) {
  const prefix = `${name}=`;
  const item = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return item
    ? decodeURIComponent(item.slice(prefix.length))
    : '';
}

function createVisitorId() {
  const bytes = new Uint8Array(16);

  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);

    return Array.from(bytes, (value) =>
      value.toString(16).padStart(2, '0')
    ).join('');
  }

  return (
    Date.now().toString(16) +
    Math.random().toString(16).slice(2) +
    Math.random().toString(16).slice(2)
  ).slice(0, 32).padEnd(32, '0');
}

function getVisitorId() {
  const saved = readCookieValue(VISITOR_ID_COOKIE);

  if (/^[a-f0-9]{32}$/.test(saved)) {
    return saved;
  }

  const visitorId = createVisitorId();
  const secure = window.location.protocol === 'https:'
    ? '; Secure'
    : '';

  document.cookie =
    `${VISITOR_ID_COOKIE}=${visitorId}; ` +
    `Max-Age=31536000; Path=/; SameSite=Lax${secure}`;

  return visitorId;
}

function sendAnalyticsPing(eventName) {
  const data = new URLSearchParams();
  data.append('action', 'analytics_ping');
  data.append('visitor_id', getVisitorId());
  data.append('event', eventName);
  data.append(
    'path',
    window.location.pathname.slice(0, 160)
  );

  const body = data.toString();

  try {
    if (navigator.sendBeacon) {
      const payload = new Blob(
        [body],
        {
          type:
            'application/x-www-form-urlencoded;charset=UTF-8'
        }
      );

      if (navigator.sendBeacon(BOOKING_API_URL, payload)) {
        return;
      }
    }

    const request = fetch(BOOKING_API_URL, {
      method: 'POST',
      body,
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded;charset=UTF-8'
      },
      credentials: 'omit',
      keepalive: true
    });

    request.catch((error) => {
      console.error('Не удалось обновить статистику:', error);
    });
  } catch (error) {
    console.error('Не удалось обновить статистику:', error);
  }
}

function scheduleVisitorAnalytics() {
  let sent = false;
  const activityEvents = [
    'pointerdown',
    'touchstart',
    'scroll',
    'keydown'
  ];

  const sendPageview = () => {
    if (sent) return;
    sent = true;

    activityEvents.forEach((eventName) => {
      window.removeEventListener(eventName, sendPageview);
    });

    sendAnalyticsPing('pageview');
  };

  activityEvents.forEach((eventName) => {
    window.addEventListener(eventName, sendPageview, {
      passive: true,
      once: true
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendPageview();
    }
  });

  window.addEventListener('pagehide', sendPageview, {
    once: true
  });

  window.setTimeout(sendPageview, 15000);
}

function scheduleBookingCount() {
  if (!bookingCounter) return;

  const counterCard = bookingCounter.closest('.booking-counter');

  if (!counterCard || !('IntersectionObserver' in window)) {
    window.setTimeout(loadBookingCount, 2500);
    return;
  }

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      if (!entries[0].isIntersecting) return;

      observer.disconnect();
      loadBookingCount();
    },
    { rootMargin: '350px 0px' }
  );

  counterObserver.observe(counterCard);
}

window.setInterval(() => {
  if (document.visibilityState === 'visible') {
    sendAnalyticsPing('heartbeat');
  }
}, 30000);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    sendAnalyticsPing('heartbeat');
  }
});

const oxidationTriggerSelector =
  'button:not(.date-picker-button), .button, .nav-cta, .house-catalog-card';

function showOxidationOrnament(x, y) {
  const ornament = document.createElement('span');
  ornament.className = 'oxidation-ornament';
  ornament.setAttribute('aria-hidden', 'true');
  ornament.style.left = `${x}px`;
  ornament.style.top = `${y}px`;
  ornament.innerHTML = `
    <svg viewBox="0 0 120 120" focusable="false">
      <circle class="oxidation-ring" cx="60" cy="60" r="45" />
      <circle class="oxidation-ring oxidation-ring-inner" cx="60" cy="60" r="18" />
      <g class="oxidation-leaf">
        <path d="M60 48C51 40 52 29 60 20C68 29 69 40 60 48Z" />
        <path d="M60 21V51" />
      </g>
      <g class="oxidation-leaf" transform="rotate(90 60 60)">
        <path d="M60 48C51 40 52 29 60 20C68 29 69 40 60 48Z" />
        <path d="M60 21V51" />
      </g>
      <g class="oxidation-leaf" transform="rotate(180 60 60)">
        <path d="M60 48C51 40 52 29 60 20C68 29 69 40 60 48Z" />
        <path d="M60 21V51" />
      </g>
      <g class="oxidation-leaf" transform="rotate(270 60 60)">
        <path d="M60 48C51 40 52 29 60 20C68 29 69 40 60 48Z" />
        <path d="M60 21V51" />
      </g>
      <path class="oxidation-curl" d="M60 60C45 59 38 51 40 42C42 34 51 35 51 42C51 47 46 49 43 46" />
      <path class="oxidation-curl" d="M60 60C61 45 69 38 78 40C86 42 85 51 78 51C73 51 71 46 74 43" />
      <path class="oxidation-curl" d="M60 60C75 61 82 69 80 78C78 86 69 85 69 78C69 73 74 71 77 74" />
      <path class="oxidation-curl" d="M60 60C59 75 51 82 42 80C34 78 35 69 42 69C47 69 49 74 46 77" />
      <circle class="oxidation-core" cx="60" cy="60" r="3" />
    </svg>
  `;

  document.body.appendChild(ornament);

  const removeOrnament = () => ornament.remove();
  ornament.addEventListener('animationend', (event) => {
    if (
      event.target === ornament &&
      event.animationName === 'oxidation-bloom'
    ) {
      removeOrnament();
    }
  });
  window.setTimeout(removeOrnament, 1400);
}

document.addEventListener('pointerdown', (event) => {
  const target = event.target instanceof Element
    ? event.target.closest(oxidationTriggerSelector)
    : null;

  if (!target || target.matches(':disabled')) return;

  showOxidationOrnament(event.clientX, event.clientY);
});

document.addEventListener('keydown', (event) => {
  if (
    event.repeat ||
    (event.key !== 'Enter' && event.key !== ' ')
  ) {
    return;
  }

  const target = event.target instanceof Element
    ? event.target.closest('button, .button, .nav-cta')
    : null;

  if (!target || target.matches(':disabled')) return;

  const rect = target.getBoundingClientRect();
  showOxidationOrnament(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );
});


const fieldTraceTimers = new WeakMap();

function traceFieldBorder(control) {
  const frame = control.closest('.field-frame');

  if (!frame) return;

  const previousTimer = fieldTraceTimers.get(frame);

  if (previousTimer) {
    window.clearTimeout(previousTimer);
  }

  frame.classList.remove('is-tracing');

  window.requestAnimationFrame(() => {
    frame.classList.add('is-tracing');

    const timer = window.setTimeout(() => {
      frame.classList.remove('is-tracing');
      fieldTraceTimers.delete(frame);
    }, 1150);

    fieldTraceTimers.set(frame, timer);
  });
}

document
  .querySelectorAll(
    '#bookingForm .field-frame input, ' +
    '#bookingForm .field-frame select, ' +
    '#bookingForm .field-frame textarea'
  )
  .forEach((control) => {
    control.addEventListener('focus', () => {
      traceFieldBorder(control);
    });

    control.addEventListener('pointerdown', () => {
      if (document.activeElement === control) {
        traceFieldBorder(control);
      }
    });
  });

document.querySelectorAll('.date-picker-button').forEach((button) => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.dateTarget || '';
    const input = document.getElementById(targetId);

    if (!(input instanceof HTMLInputElement) || input.disabled) {
      return;
    }

    traceFieldBorder(input);
    input.focus({ preventScroll: true });

    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      } else {
        input.click();
      }
    } catch (error) {
      input.focus();
    }
  });
});


const today = new Date();
today.setHours(0, 0, 0, 0);

const iso = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

if (checkin) {
  checkin.min = iso(today);
}

if (checkout) {
  checkout.min = iso(new Date(today.getTime() + 86400000));
}

if (house) {
  const requestedHouse = new URLSearchParams(
    window.location.search
  ).get('house');
  const availableHouses = ['Осетровый', 'Окский', 'Еловый'];

  if (availableHouses.includes(requestedHouse)) {
    house.value = requestedHouse;
  }
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

document.querySelectorAll('.choose-house').forEach((btn) => {

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

  const setMenuState = (isOpen) => {

    topbarNav.classList.toggle('open', isOpen);

    menuButton.setAttribute(
      'aria-expanded',
      String(isOpen)
    );

    menuButton.setAttribute(
      'aria-label',
      isOpen ? 'Закрыть меню' : 'Открыть меню'
    );

    menuButton.textContent = isOpen ? '×' : '☰';

  };

  menuButton.addEventListener('click', () => {

    setMenuState(
      !topbarNav.classList.contains('open')
    );

  });

  topbarNav.querySelectorAll('a').forEach((link) => {

    link.addEventListener('click', () => {
      setMenuState(false);
    });

  });

  document.addEventListener('keydown', (event) => {

    if (event.key === 'Escape') {
      setMenuState(false);
    }

  });

  window.addEventListener('resize', () => {

    if (window.innerWidth > 900) {
      setMenuState(false);
    }

  });

}


/* =========================
   ПОЯВЛЕНИЕ ПРИ ПРОКРУТКЕ
   ========================= */

const revealElements =
  document.querySelectorAll('.reveal');

const heroSection =
  document.querySelector('.hero');

function revealVisibleElements() {
  const viewportHeight =
    window.innerHeight ||
    document.documentElement.clientHeight;

  revealElements.forEach((element) => {
    if (element.classList.contains('is-visible')) return;

    const bounds = element.getBoundingClientRect();

    if (
      bounds.top <= viewportHeight * 0.92 &&
      bounds.bottom >= 0
    ) {
      element.classList.add('is-visible');
    }
  });

  if (heroSection) {
    const heroBounds = heroSection.getBoundingClientRect();

    if (
      heroBounds.top <= viewportHeight * 0.92 &&
      heroBounds.bottom >= 0
    ) {
      heroSection.classList.add('is-visible');
    }
  }
}

if (!('IntersectionObserver' in window)) {

  revealElements.forEach((element) => {
    element.classList.add('is-visible');
  });

  if (heroSection) {
    heroSection.classList.add('is-visible');
  }

} else {

  const revealObserver =
    new IntersectionObserver(
      (entries, observer) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) return;

          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);

        });

      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px'
      }
    );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });

  if (heroSection) {

    const heroObserver =
      new IntersectionObserver(
        (entries, observer) => {

          if (!entries[0].isIntersecting) return;

          heroSection.classList.add('is-visible');
          observer.disconnect();

        },
        {
          threshold: 0.15
        }
      );

    heroObserver.observe(heroSection);

  }

}

let revealFrame = 0;

function scheduleRevealCheck() {
  if (revealFrame) return;

  revealFrame = window.requestAnimationFrame(() => {
    revealFrame = 0;
    revealVisibleElements();
  });
}

window.addEventListener('scroll', scheduleRevealCheck, {
  passive: true
});
window.addEventListener('resize', scheduleRevealCheck);
window.addEventListener('orientationchange', scheduleRevealCheck);
window.addEventListener('pageshow', scheduleRevealCheck);

revealVisibleElements();
window.setTimeout(revealVisibleElements, 900);


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
          BOOKING_API_URL,
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

        const applicationSaved =
          saveApplication({
            house: house ? house.value : '',
            checkin: checkin ? checkin.value : '',
            checkout: checkout ? checkout.value : '',
            guests: guests ? guests.value : '',
            nights,
            total: price
          });

        saveContactDetails();

        if (Number.isInteger(result.count)) {
          renderBookingCount(result.count, true);
        } else {
          loadBookingCount();
        }

        if (statusEl) {

          statusEl.innerHTML =
            '<strong>Заявка отправлена!</strong><br>' +
            'Мы свяжемся с вами для подтверждения бронирования.' +
            (
              applicationSaved
                ? '<br><br><a href="requests.html">' +
                  '<strong>Открыть «Ваши заявки»</strong>' +
                  '</a>'
                : ''
            ) +
            '<br><br>' +
            'Телефон: ' +
            '<a href="tel:+79200540303">' +
            '<strong>+7 (920) 054-03-03</strong>' +
            '</a>';

        }

        form.reset();

        restoreContactDetails();

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
scheduleVisitorAnalytics();
scheduleBookingCount();
