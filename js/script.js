/* =========================================================
   Приглашение на юбилей Марии — скрипты
   ========================================================= */

// ---------- Настройки праздника (меняйте здесь) ----------
const EVENT = {
  title: 'Юбилей Марии — 50 лет',
  start: '2026-11-09T17:00:00+03:00', // время по Москве
  durationHours: 5,
  location: 'Москва, Митинская улица, 55к1',
  description: 'Жду вас на своём дне рождения! Вопросы: +7 926 188-31-75',
};

// ---------- Анкета гостя ----------
// Вставьте сюда ссылку веб-приложения Google Apps Script (инструкция в README.md).
// Пока ссылка пустая, ответы гостей отправляются в WhatsApp.
const RSVP = {
  googleScriptUrl: 'https://script.google.com/macros/s/AKfycbxyI7oZ8xO5ce_-1wI2QymaQHHdCCsLMzrOFHu5gIWwm34YObmKSWSwFoXo7gQLXg/exec',
  whatsappPhone: '79261883175',
};

document.addEventListener('DOMContentLoaded', () => {
  initPhotoPlaceholders();
  initCover();
  initMusic();
  initCountdown();
  initCalendarButton();
  initRsvp();
});

// ---------- Заглушки для фото ----------
// Если файла с фото ещё нет, показываем подсказку с путём к нему
function initPhotoPlaceholders() {
  document.querySelectorAll('.photo img').forEach((img) => {
    const markEmpty = () => img.closest('.photo').classList.add('is-empty');
    const markLoaded = () => img.closest('.photo').classList.remove('is-empty');

    if (img.complete && img.naturalWidth === 0) markEmpty();
    img.addEventListener('error', markEmpty);
    img.addEventListener('load', markLoaded);
  });
}

// ---------- Заставка ----------
function initCover() {
  const cover = document.getElementById('cover');
  const openBtn = document.getElementById('openInvite');
  if (!cover || !openBtn) return;

  document.body.classList.add('is-locked');

  openBtn.addEventListener('click', () => {
    cover.classList.add('is-hidden');
    document.body.classList.remove('is-locked');
    playMusic(); // клик по кнопке позволяет браузеру включить звук
  });
}

// ---------- Музыка ----------
let audio, musicBtn;

function initMusic() {
  audio = document.getElementById('bgMusic');
  musicBtn = document.getElementById('musicBtn');
  if (!audio || !musicBtn) return;

  audio.volume = 0.6;

  musicBtn.addEventListener('click', () => {
    if (audio.paused) playMusic();
    else pauseMusic();
  });
}

function playMusic() {
  if (!audio) return;
  audio.play()
    .then(() => setMusicState(true))
    .catch(() => {
      setMusicState(false);
      showToast('Добавьте трек в папку assets/audio с именем music.mp3');
    });
}

function pauseMusic() {
  audio.pause();
  setMusicState(false);
}

function setMusicState(isPlaying) {
  musicBtn.classList.toggle('is-playing', isPlaying);
  musicBtn.setAttribute('aria-pressed', String(isPlaying));
  musicBtn.setAttribute('aria-label', isPlaying ? 'Выключить музыку' : 'Включить музыку');
}

// ---------- Таймер обратного отсчёта ----------
function initCountdown() {
  const timer = document.getElementById('timer');
  const done = document.getElementById('timerDone');
  if (!timer) return;

  const target = new Date(timer.dataset.date).getTime();
  const units = {
    days:    timer.querySelector('[data-unit="days"]'),
    hours:   timer.querySelector('[data-unit="hours"]'),
    minutes: timer.querySelector('[data-unit="minutes"]'),
    seconds: timer.querySelector('[data-unit="seconds"]'),
  };
  const labels = {
    days:    timer.querySelector('[data-label="days"]'),
    hours:   timer.querySelector('[data-label="hours"]'),
    minutes: timer.querySelector('[data-label="minutes"]'),
    seconds: timer.querySelector('[data-label="seconds"]'),
  };
  const words = {
    days:    ['день', 'дня', 'дней'],
    hours:   ['час', 'часа', 'часов'],
    minutes: ['минута', 'минуты', 'минут'],
    seconds: ['секунда', 'секунды', 'секунд'],
  };

  function tick() {
    const diff = target - Date.now();

    if (diff <= 0) {
      timer.hidden = true;
      if (done) done.hidden = false;
      clearInterval(intervalId);
      return;
    }

    const values = {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor(diff / 3600000) % 24,
      minutes: Math.floor(diff / 60000) % 60,
      seconds: Math.floor(diff / 1000) % 60,
    };

    for (const key in values) {
      units[key].textContent = String(values[key]).padStart(2, '0');
      labels[key].textContent = plural(values[key], words[key]);
    }
  }

  const intervalId = setInterval(tick, 1000);
  tick();
}

// Склонение: 1 день, 2 дня, 5 дней
function plural(n, [one, few, many]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

// ---------- Добавить в календарь (.ics) ----------
function initCalendarButton() {
  const btn = document.getElementById('addToCalendar');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const start = new Date(EVENT.start);
    const end = new Date(start.getTime() + EVENT.durationHours * 3600000);
    const toICS = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Invite//RU',
      'BEGIN:VEVENT',
      `UID:${toICS(start)}-maria50@invite`,
      `DTSTAMP:${toICS(new Date())}`,
      `DTSTART:${toICS(start)}`,
      `DTEND:${toICS(end)}`,
      `SUMMARY:${EVENT.title}`,
      `LOCATION:${EVENT.location.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${EVENT.description.replace(/,/g, '\\,')}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Завтра юбилей Марии',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'yubiley-marii.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);

    showToast('Файл события скачан, откройте его, чтобы добавить в календарь');
  });
}

// ---------- Всплывающее сообщение ----------
let toastTimer;

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
}

// ---------- Анкета гостя ----------
function initRsvp() {
  const form = document.getElementById('rsvpForm');
  if (!form) return;

  const intro = document.getElementById('rsvpIntro');
  const done = document.getElementById('rsvpDone');
  const doneTitle = document.getElementById('rsvpDoneTitle');
  const doneText = document.getElementById('rsvpDoneText');
  const editBtn = document.getElementById('rsvpEdit');
  const submitBtn = document.getElementById('rsvpSubmit');
  const guestsField = document.getElementById('guestsField');
  const drinksField = document.getElementById('drinksField');
  const NO_ALCOHOL = 'Не пью алкоголь';
  const STORAGE_KEY = 'maria50-rsvp';

  // Количество гостей и напитки нужно спрашивать, только если человек придёт
  form.addEventListener('change', (e) => {
    if (e.target.name === 'attendance') {
      toggleComingFields(e.target.value === 'Приду');
      setError('attendance', false);
    }
    // «Не пью алкоголь» нельзя выбрать вместе с другими напитками
    if (e.target.name === 'drinks') setError('drinks', false);
    if (e.target.name === 'drinks' && e.target.checked) {
      const pickedNoAlcohol = e.target.value === NO_ALCOHOL;
      form.querySelectorAll('input[name="drinks"]').forEach((box) => {
        if ((box.value === NO_ALCOHOL) !== pickedNoAlcohol) box.checked = false;
      });
    }
  });
  form.elements.name.addEventListener('input', () => setError('name', false));

  // Если гость уже отвечал с этого устройства, показываем его ответ
  const saved = readSaved();
  if (saved) {
    fillForm(saved);
    showDone(saved);
  }

  editBtn.addEventListener('click', () => {
    done.hidden = true;
    intro.hidden = false;
    form.hidden = false;
    form.elements.name.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const coming = form.attendance.value === 'Приду';
    const data = {
      name: form.elements.name.value.trim(),
      attendance: form.attendance.value,
      guests: coming ? form.guests.value : '0',
      drinks: coming ? checkedDrinks().join(', ') : '',
      comment: form.comment.value.trim(),
    };

    const nameOk = data.name.length > 0;
    const attendanceOk = data.attendance !== '';
    const drinksOk = !coming || data.drinks !== '';
    setError('name', !nameOk);
    setError('attendance', !attendanceOk);
    setError('drinks', !drinksOk);
    if (!nameOk) { form.elements.name.focus(); return; }
    if (!attendanceOk) return;
    if (!drinksOk) { drinksField.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем…';

    try {
      if (RSVP.googleScriptUrl) {
        await sendToGoogleSheet(data);
      } else {
        sendToWhatsApp(data);
      }
      save(data);
      showDone(data);
      // Форма сменилась короткой карточкой, возвращаем гостя к началу блока «Вы придёте?»
      document.getElementById('rsvp').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error(err);
      showToast('Не удалось отправить ответ. Проверьте интернет и попробуйте ещё раз');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить ответ';
    }
  });

  function setError(field, hasError) {
    const error = document.getElementById(field + 'Error');
    if (!error) return;
    error.hidden = !hasError;
    error.closest('.field').classList.toggle('has-error', hasError);
  }

  function toggleComingFields(coming) {
    guestsField.hidden = !coming;
    drinksField.hidden = !coming;
  }

  function checkedDrinks() {
    return [...form.querySelectorAll('input[name="drinks"]:checked')].map((box) => box.value);
  }

  function showDone(data) {
    const coming = data.attendance === 'Приду';
    doneTitle.textContent = coming ? 'Спасибо, жду вас!' : 'Спасибо за ответ';
    doneText.textContent = coming
      ? `Записала: ${data.name}, гостей: ${data.guests}. До встречи 9 ноября!`
      : 'Очень жаль, что не получится. Буду рада, если позвоните или напишете в этот день.';
    form.hidden = true;
    intro.hidden = true;
    done.hidden = false;
  }

  function fillForm(data) {
    form.elements.name.value = data.name || '';
    form.comment.value = data.comment || '';
    const radio = form.querySelector(`input[name="attendance"][value="${data.attendance}"]`);
    if (radio) radio.checked = true;
    if (data.guests && data.guests !== '0') form.guests.value = data.guests;
    const drinks = (data.drinks || '').split(', ');
    form.querySelectorAll('input[name="drinks"]').forEach((box) => {
      box.checked = drinks.includes(box.value);
    });
    toggleComingFields(data.attendance === 'Приду');
  }

  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* хранилище недоступно */ }
  }

  function readSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
  }
}

// Отправка в Google Таблицу через веб-приложение Apps Script
async function sendToGoogleSheet(data) {
  const body = new URLSearchParams({ ...data, sentAt: new Date().toISOString() });
  // no-cors: Google не отдаёт заголовки CORS, ответ прочитать нельзя, но строка в таблицу записывается
  await fetch(RSVP.googleScriptUrl, { method: 'POST', mode: 'no-cors', body });
}

// Запасной вариант: готовое сообщение в WhatsApp
function sendToWhatsApp(data) {
  const lines = [
    'Ответ на приглашение на юбилей',
    `Имя: ${data.name}`,
    `Ответ: ${data.attendance}`,
  ];
  if (data.attendance === 'Приду') lines.push(`Гостей: ${data.guests}`);
  if (data.drinks) lines.push(`Напитки: ${data.drinks}`);
  if (data.comment) lines.push(`Комментарий: ${data.comment}`);

  const url = `https://wa.me/${RSVP.whatsappPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
  window.open(url, '_blank', 'noopener');
}
