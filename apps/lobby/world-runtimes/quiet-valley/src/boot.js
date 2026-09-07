/* Launch diagnostics run in a separate script before the game's scripts.
   This also makes syntax / WebGL / context-loss errors visible on mobile. */
(function () {
  'use strict';
  var loading = document.getElementById('loading');
  var preview = document.getElementById('launch-hint');
  var panel = document.getElementById('error');
  var boot = { failed: false, firstFrame: false, stage: 'Загрузка кода' };
  var timer;
  preview.hidden = true;
  function fail(reason) {
    if (boot.failed) return;
    boot.failed = true;
    clearTimeout(timer);
    loading.hidden = true;
    document.getElementById('ui').hidden = true;
    panel.hidden = false;
    panel.textContent = '';
    var title = document.createElement('h2');
    title.textContent = 'Не удалось запустить ферму';
    var message = document.createElement('p');
    message.textContent = String(reason && reason.message ? reason.message : reason || 'Неизвестная ошибка');
    var help = document.createElement('p');
    help.textContent = 'На iPhone открывайте опубликованную HTTPS-ссылку в Safari, а не HTML-вложение в просмотрщике. На Mac откройте файл через «Открыть с помощью → Safari / Chrome». При ошибке WebGL попробуйте другой браузер.';
    var detail = document.createElement('textarea');
    detail.readOnly = true;
    detail.setAttribute('aria-label', 'Диагностика запуска — можно скопировать');
    detail.value = 'Quiet Valley 0.3.0\nЭтап: ' + boot.stage + '\nПротокол: ' + location.protocol + '\nРазмер: ' + innerWidth + '×' + innerHeight + '\nОшибка: ' + message.textContent + '\nБраузер: ' + navigator.userAgent;
    var reload = document.createElement('button');
    reload.className = 'primary';
    reload.textContent = 'Повторить запуск';
    reload.onclick = function () { location.reload(); };
    var note = document.createElement('p');
    note.textContent = 'При повторной ошибке отправьте скриншот этого экрана. Сохранение не удалено.';
    panel.append(title, message, help, detail, reload, note);
  }
  boot.fail = fail;
  boot.setStage = function (stage) { boot.stage = stage; };
  boot.ready = function () {
    if (boot.failed || boot.firstFrame) return;
    boot.firstFrame = true;
    boot.stage = 'Первый кадр готов';
    clearTimeout(timer);
    loading.hidden = true;
  };
  function watchdog() {
    if (boot.firstFrame || boot.failed) return;
    if (document.hidden) { timer = setTimeout(watchdog, 12000); return; }
    fail('Первый 3D-кадр не появился за 12 секунд.');
  }
  timer = setTimeout(watchdog, 12000);
  window.addEventListener('error', function (event) { fail(event.error || event.message || 'Ошибка выполнения JavaScript'); });
  window.addEventListener('unhandledrejection', function (event) { fail(event.reason || 'Ошибка асинхронного запуска'); });
  document.getElementById('world').addEventListener('webglcontextlost', function (event) {
    event.preventDefault();
    fail('Браузер остановил 3D-графику (WebGL context lost). Закройте другие тяжёлые вкладки и повторите запуск.');
  });
  window.QuietValleyLaunch = boot;
}());
