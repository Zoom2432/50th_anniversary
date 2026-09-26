/**
 * Приём ответов гостей: запись в Google Таблицу и письмо на почту.
 * Инструкция по установке — в README.md проекта, раздел «Ответы гостей на почту и в Google Таблицу».
 */

const SHEET_NAME = 'Ответы';

// Куда присылать письма. Пусто — на почту аккаунта Google, от имени которого развёрнут скрипт.
// Можно указать несколько адресов через запятую: 'mama@mail.ru, ya@gmail.com'
const NOTIFY_EMAIL = '';

function doPost(e) {
  // doPost вызывается сам, когда гость отправляет анкету. Для проверки из редактора есть testSend
  if (!e || !e.parameter) {
    throw new Error('Эту функцию не нужно запускать вручную. Выберите вверху testSend и нажмите «Выполнить».');
  }
  const p = e.parameter;

  getSheet().appendRow([
    new Date(),
    p.name || '',
    p.attendance || '',
    Number(p.guests || 0),
    p.drinks || '',
    p.comment || '',
  ]);

  sendNotification(p);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendNotification(p) {
  const coming = p.attendance === 'Приду';
  const lines = [
    `Имя: ${p.name || ''}`,
    `Ответ: ${p.attendance || ''}`,
  ];
  if (coming) lines.push(`Гостей: ${p.guests || 1}`);
  if (p.drinks) lines.push(`Напитки: ${p.drinks}`);
  if (p.comment) lines.push(`Комментарий: ${p.comment}`);
  lines.push('', `Все ответы: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL || Session.getEffectiveUser().getEmail(),
    subject: `Юбилей: ${p.name || 'гость'} — ${coming ? `придёт (${p.guests || 1})` : 'не сможет'}`,
    body: lines.join('\n'),
    name: 'Приглашение на юбилей',
  });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Дата ответа', 'Имя', 'Ответ', 'Гостей', 'Напитки', 'Комментарий']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:F1').setFontWeight('bold');
  }
  return sheet;
}

// Проверка из редактора: выберите эту функцию и нажмите «Выполнить».
// Появится тестовая строка в таблице и придёт письмо.
function testSend() {
  doPost({ parameter: {
    name: 'Тестовый гость',
    attendance: 'Приду',
    guests: '2',
    drinks: 'Шампанское, Красное вино',
    comment: 'Это проверка, строку можно удалить',
  } });
}
