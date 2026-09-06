/* Quiet Valley runtime composition root.
 * Owns orchestration only: persistence, input and UI. Domain mutations stay in FarmSim.act.
 */
'use strict';

(() => {
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const SAVE_KEY = 'bc.world.quiet-valley.v1';
  const LEGACY_SAVE_KEYS = ['quiet-valley.v4', 'quiet-valley.v3', 'quiet-valley.v2', 'quiet-valley.v1'];

  let state;
  let renderer;
  let art;
  let valleyWorld;
  let waterFX;
  let storageOK = true;
  let saveCount = 0;
  let selected = null;
  let activeTool = 'inspect';
  let modalKind = null;
  let buildType = null;
  let buildRotation = 0;
  let night = false;
  let lastSaveAt = 0;

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

  function loadState() {
    try {
      let raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        for (const key of LEGACY_SAVE_KEYS) {
          raw = localStorage.getItem(key);
          if (raw) break;
        }
      }
      state = raw ? FarmSim.validate(JSON.parse(raw)) : FarmSim.fresh();
      FarmSim.tick(state);
    } catch (error) {
      console.warn('Quiet Valley save load failed; starting a safe local farm.', error);
      state = FarmSim.fresh();
      storageOK = false;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      storageOK = true;
      saveCount += 1;
    } catch (_) {
      storageOK = false;
    }
    const status = qs('#save-status');
    if (status) status.textContent = storageOK ? 'Сохранено в браузере' : 'Сохранение недоступно';
  }

  let toastTimer;
  function toast(message) {
    const node = qs('#toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 3200);
  }

  function setTool(nextTool) {
    activeTool = nextTool;
    qsa('[data-tool]').forEach((button) => {
      button.classList.toggle('active', button.dataset.tool === activeTool);
    });
    const hint = qs('#control-hint');
    if (!hint) return;
    hint.textContent = {
      inspect: 'Осмотр: нажмите на грядку, животное или жителя',
      plant: 'Посадка: выберите пустую грядку и культуру',
      water: 'Полив: нажмите на сухую грядку',
      harvest: 'Сбор: нажмите на созревший урожай',
    }[activeTool] || '';
  }

  function resetCamera() {
    const region = state.world.region;
    renderer.camera.yaw = region === 'river' ? 0.68 : region === 'forest' ? 0.46 : 0.58;
    renderer.camera.pitch = 0.78;
    renderer.camera.size = innerWidth < 700 ? 18 : 15.8;
    renderer.camera.target = region === 'river' ? [1, 0, 0] : [0, 0, 0];
  }

  function runAction(action) {
    const result = FarmSim.act(state, action);
    toast(result.message);
    if (!result.ok) return result;

    if (action.type === 'markIntroSeen') {
      const intro = qs('#intro-overlay');
      if (intro) intro.hidden = true;
    }

    if (action.type === 'travel') {
      selected = null;
      buildType = null;
      valleyWorld.sync(state);
      resetCamera();
      closeModal();
    }

    if (result.effect === 'water' && Number.isInteger(action.id)) {
      const model = art.cropModels[action.id];
      if (model) waterFX.start(action.id, model.x, model.z, model.surface - 0.475);
    }

    if (result.effect === 'waterTree' && Number.isInteger(action.id)) {
      const site = FarmExpansion.fruitSites[action.id];
      if (site) waterFX.start(100 + action.id, site.x, site.z, 0);
    }

    saveState();
    valleyWorld.sync(state);
    art.updateCrops(state, Date.now());
    renderHUD();
    renderDetails();
    updateLabels();
    if (modalKind) renderModal(modalKind, false);
    return result;
  }

  function renderHUD() {
    const weather = ValleyGameplay.weather(state);
    const story = ValleyGameplay.storyStatus(state);
    const lease = ValleyGameplay.leaseStatus(state);

    qs('#coins').textContent = state.coins.toLocaleString('ru-RU');
    qs('#level').textContent = `LV ${Math.floor(state.xp / 100) + 1}`;
    qs('#rep').textContent = `${state.game.reputation} REP`;
    qs('#region-title').textContent = FarmExpansion.regions[state.world.region].name;
    qs('#region-desc').textContent = FarmExpansion.regions[state.world.region].description;
    qs('#weather').textContent = `${weather.icon} ${weather.name}`;
    qs('#weather-sub').textContent = `${weather.short} · ${Math.ceil(weather.remainingMs / 1000)}с`;
    qs('#story-title').textContent = story.complete ? 'История завершена' : story.title;
    qs('#story-progress').textContent = story.complete
      ? 'Свободная игра'
      : `${story.requirements.filter((goal) => goal.done).length}/${story.requirements.length} целей`;
    qs('#orders-ready').textContent = state.game.orders.filter((order) => ValleyGameplay.canDeliver(state, order)).length;
    qs('#lease-dot').textContent = lease.debt ? '!' : '✓';
    qs('#lease-dot').classList.toggle('due', Boolean(lease.debt));
    qs('#weather-layer').className = `weather-layer ${weather.key === 'rain' ? 'rain' : ''}`;
    qs('#save-status').textContent = storageOK ? 'Сохранено в браузере' : 'Локальное сохранение недоступно';
  }

  function barnHTML() {
    let html = '<button class="close" data-close-modal>×</button>';
    html += '<div class="eyebrow">АМБАР · ЗАПАСЫ</div><h2 id="modal-title">Ваш урожай</h2>';
    html += '<p>Обычная продажа даёт деньги сразу. Заказы жителей обычно выгоднее, поэтому часть запасов стоит оставить.</p>';
    let total = 0;

    for (const [key, product] of Object.entries(FarmSim.PRODUCTS)) {
      const quantity = state.inventory[key] || 0;
      total += quantity * product.price;
      html += `<div class="inventory-row"><span>${product.icon}</span><div><b>${product.name}</b><small>${product.price} 🪙 за единицу</small></div><strong>${quantity}</strong><button data-action="sell" data-key="${key}" data-qty="1" ${quantity ? '' : 'disabled'}>Продать 1</button></div>`;
    }

    html += '<div class="modal-button-row"><button class="primary" data-action="sell">Продать доступное</button><button class="secondary" data-open-orders>Сначала посмотреть заказы</button></div>';
    html += `<div class="fineprint">Полная стоимость запасов по обычной цене: ${total} 🪙. При «продать доступное» игра сохраняет минимум 3 пшеницы на корм.</div>`;
    return html;
  }

  function shopHTML() {
    let html = '<button class="close" data-close-modal>×</button>';
    html += '<div class="eyebrow">ЖИВОТНЫЕ · ДОМАШНЯЯ ФЕРМА</div><h2 id="modal-title">Новые жители</h2>';
    html += '<p>Животные гуляют по загону, требуют корм и постепенно производят молоко, яйца или шерсть.</p>';

    for (const [key, species] of Object.entries(FarmSim.SPECIES)) {
      const disabled = state.coins < species.price || state.animals.length >= 12;
      html += `<div class="shop-card"><span>${species.icon}</span><div><b>${species.name}</b><small>${FarmSim.PRODUCTS[species.product].name} · примерно каждые ${species.seconds} сек.</small></div><button class="primary" data-action="buyAnimal" data-species="${key}" ${disabled ? 'disabled' : ''}>${species.price} 🪙</button></div>`;
    }

    html += '<div class="fineprint">Максимум 12 животных. Они не погибают: при низкой сытости производство просто останавливается.</div>';
    return html;
  }

  function helpHTML() {
    return `<button class="close" data-close-modal>×</button>
      <div class="eyebrow">QUIET VALLEY · BLACKCROWN WORLD</div>
      <h2 id="modal-title">Как играть</h2>
      <div class="help-grid">
        <span>🌱</span><div><b>Выращивайте.</b> Посадите, полейте, дождитесь созревания и соберите урожай.</div>
        <span>🐄</span><div><b>Ухаживайте.</b> Кормите животных пшеницей, гладьте и забирайте продукцию.</div>
        <span>📦</span><div><b>Планируйте.</b> Заказы выгоднее обычной продажи и развивают отношения с жителями.</div>
        <span>🏗️</span><div><b>Развивайте землю.</b> Откройте сад, мост, речные террасы, пасеку и автополив.</div>
        <span>🏠</span><div><b>Аренда мягкая.</b> Первая неделя бесплатная, штрафов и выселения нет.</div>
      </div>
      <div class="notice"><b>Архитектура BLACKCROWN:</b> этот мир работает изолированно от Lobby. Текущее сохранение локальное; серверная синхронизация будет отдельным авторитетным слоем.</div>`;
  }

  function renderModal(kind, focus = true) {
    modalKind = kind;
    let html;

    switch (kind) {
      case 'orders': html = GameplayUI.orders(state); break;
      case 'journal': html = GameplayUI.journal(state); break;
      case 'people': html = GameplayUI.people(state); break;
      case 'lease': html = GameplayUI.lease(state); break;
      case 'map':
      case 'land':
      case 'decor': html = ValleyUI.modal(kind, state); break;
      case 'barn': html = barnHTML(); break;
      case 'shop': html = shopHTML(); break;
      default: html = helpHTML(); break;
    }

    qs('#modal').innerHTML = html;
    qs('#modal-overlay').hidden = false;
    if (focus) qs('#modal').focus();
  }

  function closeModal() {
    modalKind = null;
    qs('#modal-overlay').hidden = true;
  }

  function renderPlotDetails(plot) {
    const status = FarmSim.status(plot);
    const crop = plot.crop && FarmSim.CROPS[plot.crop];
    let html = `<div class="detail-icon">${crop?.icon || '🌱'}</div><h2>${plot.unlocked ? (crop?.name || 'Свободная грядка') : 'Закрытая грядка'}</h2>`;

    if (!plot.unlocked) {
      html += `<p>Откройте грядку за 55 монет.</p><button class="primary" data-action="unlock" data-id="${plot.id}" ${state.coins < 55 ? 'disabled' : ''}>Открыть · 55 🪙</button>`;
      return html;
    }

    if (!plot.crop) {
      html += '<p>Выберите культуру или заранее увлажните землю.</p><div class="detail-actions">';
      html += Object.entries(FarmSim.CROPS).map(([key, item]) => (
        `<button class="secondary" data-plant="${key}" data-id="${plot.id}">${item.icon} ${item.cost} 🪙</button>`
      )).join('');
      html += `<button class="secondary" data-action="water" data-id="${plot.id}">💧 Полить</button></div>`;
      return html;
    }

    if (status === 'dry') {
      return `${html}<p>Растение ждёт воды. Полив бесплатный.</p><button class="primary" data-action="water" data-id="${plot.id}">Полить 💧</button>`;
    }

    if (status === 'ready') {
      return `${html}<p>Урожай созрел.</p><button class="primary" data-action="harvest" data-id="${plot.id}">Собрать</button>`;
    }

    const remaining = Math.max(1, Math.ceil((plot.readyAt - Date.now()) / 1000));
    return `${html}<p>До созревания примерно ${remaining} сек.</p><div class="soil-status">💧 Земля влажная</div>`;
  }

  function renderAnimalDetails(animal) {
    const species = FarmSim.SPECIES[animal.type];
    return `<div class="detail-icon">${species.icon}</div>
      <h2>${escapeHTML(animal.name)}</h2>
      <p>Сытость ${Math.round(animal.hunger)}% · настроение ${Math.round(animal.mood)}% · готово продукции: ${animal.stock}</p>
      <div class="detail-actions">
        <button class="secondary" data-action="feed" data-id="${animal.id}">🌾 Покормить</button>
        <button class="secondary" data-action="pet" data-id="${animal.id}">♥ Погладить</button>
        <button class="primary" data-action="collect" data-id="${animal.id}" ${animal.stock ? '' : 'disabled'}>Забрать ${FarmSim.PRODUCTS[species.product].name.toLowerCase()}</button>
      </div>`;
  }

  function renderFeatureDetails(feature) {
    if (feature.kind === 'tree' || feature.kind === 'honey') return ValleyUI.detail(feature, state);

    if (feature.kind === 'resource') {
      return '<div class="detail-icon">🪵</div><h2>Расчистить участок</h2><p>Получите строительный материал и освободите землю.</p>' +
        `<button class="primary" data-action="clear" data-key="${feature.key}">Убрать</button>`;
    }

    if (feature.kind === 'person') {
      const character = ValleyGameplay.CHARACTERS[feature.id];
      return `<div class="detail-icon">${character.icon}</div><h2>${character.name}</h2><p>${escapeHTML(ValleyGameplay.characterDialogue(state, feature.id))}</p><button class="primary" data-open-people>Открыть отношения</button>`;
    }

    return '<div class="detail-icon">🏗️</div><h2>Проект участка</h2><p>Откройте список улучшений этой локации.</p><button class="primary" data-valley-tab="land">Улучшения</button>';
  }

  function renderDetails() {
    const panel = qs('#details');
    if (!selected) {
      panel.hidden = true;
      return;
    }

    let html = '<button class="close" data-close-details>×</button>';

    if (selected.kind === 'plot') {
      const plot = state.plots[selected.id];
      if (!plot) {
        selected = null;
        panel.hidden = true;
        return;
      }
      html += renderPlotDetails(plot);
    } else if (selected.kind === 'animal') {
      const animal = state.animals.find((item) => item.id === selected.id);
      if (!animal) {
        selected = null;
        panel.hidden = true;
        return;
      }
      html += renderAnimalDetails(animal);
    } else if (selected.kind === 'feature') {
      const feature = valleyWorld.features.find((item) => item.key === selected.key);
      if (!feature) {
        selected = null;
        panel.hidden = true;
        return;
      }
      html += renderFeatureDetails(feature);
    }

    panel.innerHTML = html;
    panel.hidden = false;
  }

  const labels = new Map();
  function ensureLabel(key, text, className, onClick) {
    let node = labels.get(key);
    if (!node) {
      node = document.createElement('button');
      node.dataset.label = key;
      qs('#labels').appendChild(node);
      labels.set(key, node);
    }
    node.textContent = text;
    node.className = `world-label ${className}`;
    node.onclick = onClick;
    node.hidden = false;
    return node;
  }

  function updateLabels() {
    const live = new Set();
    const now = Date.now();

    for (const model of art.cropModels) {
      const plot = state.plots[model.id];
      if (model.region !== state.world.region || !plot?.unlocked) continue;
      const point = renderer.project([model.x, model.surface + 0.65, model.z]);
      if (point.z < -1 || point.z > 1) continue;
      const status = FarmSim.status(plot, now);
      const text = status === 'ready' ? '✓' : status === 'dry' ? '💧' : !plot.crop ? '+' : '…';
      const node = ensureLabel(`p${model.id}`, text, status, () => choosePlot(model.id));
      node.style.left = `${point.x}px`;
      node.style.top = `${point.y}px`;
      live.add(`p${model.id}`);
    }

    if (state.world.region === 'farm') {
      for (const animal of state.animals) {
        const model = art.animalModels.get(animal.id);
        if (!model?.g.visible) continue;
        const point = renderer.project([model.g.p[0], 1.65, model.g.p[2]]);
        const node = ensureLabel(`a${animal.id}`, FarmSim.SPECIES[animal.type].icon, 'animal', () => {
          selected = { kind: 'animal', id: animal.id };
          renderDetails();
        });
        node.style.left = `${point.x}px`;
        node.style.top = `${point.y}px`;
        live.add(`a${animal.id}`);
      }
    }

    for (const feature of valleyWorld.features) {
      if (!valleyWorld.featureVisible(feature, state) || !feature.node.visible) continue;
      const point = renderer.project([feature.pos[0], feature.pos[1] + 0.7, feature.pos[2]]);
      const text = feature.kind === 'resource'
        ? '✦'
        : feature.kind === 'tree'
          ? '🍎'
          : feature.kind === 'honey'
            ? '🍯'
            : feature.kind === 'person'
              ? ValleyGameplay.CHARACTERS[feature.id].icon
              : '⚙';
      const node = ensureLabel(`f${feature.key}`, text, `feature ${feature.kind === 'person' ? 'person' : ''}`, () => {
        selected = { kind: 'feature', key: feature.key };
        renderDetails();
      });
      node.style.left = `${point.x}px`;
      node.style.top = `${point.y}px`;
      live.add(`f${feature.key}`);
    }

    for (const [key, node] of labels) node.hidden = !live.has(key);
  }

  function choosePlot(id) {
    selected = { kind: 'plot', id };
    const plot = state.plots[id];
    if (!plot) return;

    if (activeTool === 'water') {
      runAction({ type: 'water', id });
      return;
    }
    if (activeTool === 'harvest') {
      runAction({ type: 'harvest', id });
      return;
    }
    renderDetails();
  }

  function startBuild(type) {
    if (type !== 'remove' && !FarmExpansion.decor[type]) return;
    buildType = type;
    buildRotation = 0;
    closeModal();
    toast(type === 'remove' ? 'Нажмите на своё украшение' : 'Нажмите на свободную клетку земли');
    valleyWorld.setPlacement(type, state, buildRotation);
  }

  function tapWorld(x, y) {
    if (buildType) {
      const ground = renderer.ground(x, y, 0.25);
      const gridX = Math.round(ground[0] / 2) * 2;
      const gridZ = Math.round(ground[2] / 2) * 2;

      if (buildType === 'remove') {
        const item = state.world.decor.find((decor) => (
          decor.region === state.world.region && Math.hypot(decor.x - gridX, decor.z - gridZ) < 1
        ));
        if (item) runAction({ type: 'removeDecor', id: item.id });
        else toast('Здесь нет вашего украшения');
      } else {
        runAction({
          type: 'placeDecor',
          region: state.world.region,
          key: buildType,
          x: gridX,
          z: gridZ,
          rotation: buildRotation,
        });
      }

      valleyWorld.setPlacement(buildType, state, buildRotation);
      return;
    }

    const plotId = FarmPick.plotAt(
      renderer,
      art.cropModels.filter((model) => model.region === state.world.region && state.plots[model.id]?.unlocked),
      x,
      y,
      7,
    );
    if (plotId !== null) {
      choosePlot(plotId);
      return;
    }

    let nearest = null;
    for (const animal of state.animals) {
      const model = art.animalModels.get(animal.id);
      if (!model?.g.visible) continue;
      const point = renderer.project([model.g.p[0], 0.9, model.g.p[2]]);
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < 28 && (!nearest || distance < nearest.distance)) {
        nearest = { kind: 'animal', id: animal.id, distance };
      }
    }

    for (const feature of valleyWorld.features) {
      if (!valleyWorld.featureVisible(feature, state) || !feature.node.visible) continue;
      const point = renderer.project(feature.pos);
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < 30 && (!nearest || distance < nearest.distance)) {
        nearest = { kind: 'feature', key: feature.key, distance };
      }
    }

    selected = nearest;
    renderDetails();
  }

  function bindUI() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      if (button.dataset.tool) {
        setTool(button.dataset.tool);
        return;
      }
      if (button.dataset.action) {
        const action = { type: button.dataset.action };
        if (button.dataset.id !== undefined) action.id = Number(button.dataset.id);
        if (button.dataset.key) action.key = button.dataset.key;
        if (button.dataset.qty) action.qty = Number(button.dataset.qty);
        if (button.dataset.species) action.species = button.dataset.species;
        runAction(action);
        return;
      }
      if (button.dataset.plant) {
        runAction({ type: 'plant', id: Number(button.dataset.id), crop: button.dataset.plant });
        return;
      }
      if (button.dataset.travel) {
        runAction({ type: 'travel', region: button.dataset.travel });
        return;
      }
      if (button.dataset.valleyTab) {
        renderModal(button.dataset.valleyTab);
        return;
      }
      if (button.dataset.place) {
        startBuild(button.dataset.place);
        return;
      }
      if (button.hasAttribute('data-open-orders')) renderModal('orders');
      else if (button.hasAttribute('data-open-journal')) renderModal('journal');
      else if (button.hasAttribute('data-open-people')) renderModal('people');
      else if (button.hasAttribute('data-open-lease')) renderModal('lease');
      else if (button.hasAttribute('data-close-modal')) closeModal();
      else if (button.hasAttribute('data-close-details')) {
        selected = null;
        renderDetails();
      }
    });

    qs('#open-orders').onclick = () => renderModal('orders');
    qs('#open-journal').onclick = () => renderModal('journal');
    qs('#open-map').onclick = () => renderModal('map');
    qs('#open-land').onclick = () => renderModal('land');
    qs('#open-barn').onclick = () => renderModal('barn');
    qs('#open-shop').onclick = () => renderModal('shop');
    qs('#open-help').onclick = () => renderModal('help');
    qs('#open-lease').onclick = () => renderModal('lease');

    qs('#zoom-in').onclick = () => { renderer.camera.size = Math.max(6, renderer.camera.size / 1.18); };
    qs('#zoom-out').onclick = () => { renderer.camera.size = Math.min(36, renderer.camera.size * 1.18); };
    qs('#home-camera').onclick = resetCamera;
    qs('#day-toggle').onclick = () => { night = !night; };

    const canvas = qs('#world');
    let pointer = null;
    let dragged = false;

    canvas.addEventListener('pointerdown', (event) => {
      if (modalKind || !qs('#intro-overlay').hidden) return;
      canvas.setPointerCapture?.(event.pointerId);
      pointer = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY };
      dragged = false;
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!pointer) return;
      const dx = event.clientX - pointer.lastX;
      const dy = event.clientY - pointer.lastY;
      if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 7) dragged = true;

      if (dragged) {
        renderer.camera.yaw -= dx * 0.006;
        renderer.camera.pitch = Math.max(0.38, Math.min(1.25, renderer.camera.pitch + dy * 0.004));
        pointer.lastX = event.clientX;
        pointer.lastY = event.clientY;
        event.preventDefault();
      }

      if (buildType) {
        const rect = canvas.getBoundingClientRect();
        const ground = renderer.ground(event.clientX - rect.left, event.clientY - rect.top, 0.25);
        valleyWorld.preview(Math.round(ground[0] / 2) * 2, Math.round(ground[2] / 2) * 2, state);
      }
    });

    canvas.addEventListener('pointerup', (event) => {
      if (!pointer) return;
      const rect = canvas.getBoundingClientRect();
      if (!dragged) tapWorld(event.clientX - rect.left, event.clientY - rect.top);
      pointer = null;
    });
    canvas.addEventListener('pointercancel', () => { pointer = null; });
    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      renderer.camera.size = Math.max(6, Math.min(36, renderer.camera.size * Math.exp(event.deltaY * 0.001)));
    }, { passive: false });

    qs('#modal-overlay').addEventListener('click', (event) => {
      if (event.target === qs('#modal-overlay')) closeModal();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (buildType) {
          buildType = null;
          valleyWorld.setPlacement(null, state);
          toast('Режим строительства завершён');
        } else if (modalKind) {
          closeModal();
        } else {
          selected = null;
          renderDetails();
        }
      }

      if ('1234'.includes(event.key)) setTool(['inspect', 'plant', 'water', 'harvest'][Number(event.key) - 1]);
      if (event.key.toLowerCase() === 'm') renderModal('map');
      if (event.key.toLowerCase() === 'o') renderModal('orders');
      if (event.key.toLowerCase() === 'r' && buildType) {
        buildRotation = (buildRotation + 1) % 4;
        valleyWorld.setPlacement(buildType, state, buildRotation);
      }
    });

    window.addEventListener('resize', () => {
      renderer.resize();
      resetCamera();
    });
  }

  function exposeRuntimeInspection() {
    window.FarmApp = {
      inspect: () => ({
        version: '0.5.0-blackcrown.1',
        state: FarmSim.clone(state),
        world: valleyWorld.inspect(),
        weather: ValleyGameplay.weather(state),
        story: ValleyGameplay.storyStatus(state),
        graphics: { quality: renderer.quality, shadow: renderer.shadowOK, post: renderer.postOK },
        webgl: renderer.gl.getParameter(renderer.gl.VERSION),
        storageOK,
        saveCount,
        tool: activeTool,
        selected,
      }),
    };
  }

  function startRenderLoop() {
    let previous = performance.now();
    let lastUIUpdate = 0;

    function frame(timestamp) {
      if (window.QuietValleyLaunch?.failed) return;
      const dt = Math.min(0.06, (timestamp - previous) / 1000);
      previous = timestamp;

      if (!document.hidden) {
        FarmSim.tick(state, Date.now());
        art.animate(timestamp / 1000, dt, state);
        valleyWorld.animate(timestamp / 1000, dt, state);
        waterFX.animate(dt);

        const weather = ValleyGameplay.weather(state);
        const weatherLight = weather.key === 'rain' ? 0.70 : weather.key === 'cloud' ? 0.84 : 1;
        const targetLight = night ? 0.22 : weatherLight;
        renderer.day += (targetLight - renderer.day) * Math.min(1, dt * 1.8);
        renderer.draw(timestamp / 1000);
        updateLabels();

        if (timestamp - lastUIUpdate > 700) {
          art.updateCrops(state, Date.now());
          valleyWorld.sync(state);
          renderHUD();
          if (selected) renderDetails();
          if (modalKind === 'orders') renderModal('orders', false);
          lastUIUpdate = timestamp;
        }

        if (timestamp - lastSaveAt > 5000) {
          saveState();
          lastSaveAt = timestamp;
        }
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  loadState();

  try {
    window.QuietValleyLaunch?.setStage('Создание мира');
    renderer = new F.Renderer(qs('#world'));
    art = FarmArt.make(renderer);
    valleyWorld = ValleyWorld.make(renderer, art);
    waterFX = FarmWater.make(renderer);

    for (const animal of state.animals) art.animalModel(animal);
    valleyWorld.sync(state);
    resetCamera();
    art.updateCrops(state, Date.now());
    bindUI();
    setTool('inspect');
    renderHUD();
    saveState();

    if (!state.game.introSeen) {
      const intro = qs('#intro-overlay');
      intro.innerHTML = GameplayUI.intro();
      intro.hidden = false;
    }

    exposeRuntimeInspection();
    startRenderLoop();
    setTimeout(() => window.QuietValleyLaunch?.ready(), 100);

    window.addEventListener('pagehide', saveState);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) saveState();
      else {
        FarmSim.tick(state);
        renderHUD();
      }
    });
  } catch (error) {
    console.error(error);
    window.QuietValleyLaunch?.fail(error);
  }
})();
