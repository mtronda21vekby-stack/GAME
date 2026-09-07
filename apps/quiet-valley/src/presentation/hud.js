/** presentation/hud.js. Explicit view/interaction ports; no imported global game state. */
export function createHUD(__qvPorts) {
function renderDetails(force = false) {
    const el = __qvPorts.$('#details');
    if (__qvPorts.selected?.kind === 'feature') {
        const f = __qvPorts.world.features.find(f => f.key === __qvPorts.selected.id);
        if (!f || !__qvPorts.world.featureVisible(f, __qvPorts.state)) {
            __qvPorts.selected = null;
            el.hidden = true;
            __qvPorts.detailsSignature = '';
            return;
        }
        if (!force && el.contains(document.activeElement))
            return;
        let fsig = f.kind === 'tree' ? JSON.stringify(['feature', f.key, __qvPorts.state.world.trees[f.id]?.planted, __qvPorts.state.world.trees[f.id]?.waterAt, __qvPorts.state.world.trees[f.id]?.readyAt, __qvPorts.state.coins, __qvPorts.FarmExpansion.irrigated(__qvPorts.state, 'orchard')]) : f.kind === 'honey' ? JSON.stringify(['feature', f.key, __qvPorts.state.world.apiaryStock, __qvPorts.FarmExpansion.level(__qvPorts.state, 'forest_cabin')]) : JSON.stringify(['feature', f.key]);
        if (!force && fsig === __qvPorts.detailsSignature) {
            const tr = f.kind === 'tree' ? __qvPorts.state.world.trees[f.id] : null, left = tr?.readyAt ? Math.max(0, Math.ceil((tr.readyAt - __qvPorts.gameNow()) / 1000)) : 0;
            const rem = el.querySelector('[data-tree-remaining]');
            if (rem)
                rem.textContent = left + ' сек.';
            return;
        }
        __qvPorts.detailsSignature = fsig;
        el.innerHTML = __qvPorts.ValleyUI.detail(f, __qvPorts.state);
        el.hidden = false;
        return;
    }
    if (__qvPorts.selected?.kind === 'plot' && __qvPorts.tool !== 'inspect' && __qvPorts.state.plots[__qvPorts.selected.id]?.unlocked) {
        el.hidden = true;
        return;
    }
    if (!__qvPorts.selected) {
        el.hidden = true;
        __qvPorts.detailsSignature = '';
        return;
    }
    if (!force && el.contains(document.activeElement))
        return;
    let subject = __qvPorts.selected.kind === 'plot' ? __qvPorts.state.plots[__qvPorts.selected.id] : __qvPorts.state.animals.find(a => a.id === __qvPorts.selected.id);
    let signature = JSON.stringify([__qvPorts.selected, __qvPorts.selected.kind === 'plot' ? [subject?.crop, subject ? __qvPorts.FarmSim.status(subject) : '', Math.round(__qvPorts.FarmSim.moisture(subject) * 10), __qvPorts.state.coins] : [subject?.stock, Math.round(subject?.hunger || 0), Math.round(subject?.mood || 0)]]);
    if (!force && signature === __qvPorts.detailsSignature) {
        let p = __qvPorts.state.plots[__qvPorts.selected.id];
        if (__qvPorts.selected.kind === 'plot' && p?.crop) {
            let remaining = Math.max(0, Math.ceil((p.readyAt - __qvPorts.gameNow()) / 1000));
            const text = el.querySelector('[data-remaining]'), bar = el.querySelector('[data-grow-progress]');
            if (text)
                text.textContent = remaining + ' сек.';
            if (bar)
                bar.style.width = Math.min(100, Math.max(0, 100 * (1 - remaining / __qvPorts.FarmSim.CROPS[p.crop].seconds))) + '%';
        }
        return;
    }
    __qvPorts.detailsSignature = signature;
    let html = '<button class="close" data-close-details aria-label="Закрыть">×</button>';
    if (__qvPorts.selected.kind === 'plot') {
        const p = __qvPorts.state.plots[__qvPorts.selected.id], s = __qvPorts.FarmSim.status(p), c = __qvPorts.FarmSim.CROPS[p.crop];
        html += `<div class="eyebrow">${p.id < 16 ? 'ДОМАШНЯЯ ФЕРМА' : 'РЕЧНЫЕ ТЕРРАСЫ'} · ГРЯДКА ${p.id < 16 ? p.id + 1 : p.id - 15} / ${p.id < 16 ? 16 : 8}</div><div class="detail-icon">${c?.icon || '🌱'}</div><h2 class="detail-title">${c?.name || 'Новая жизнь'}</h2>`;
        if (s === 'locked')
            html += '<p class="detail-desc">Здесь может быть ещё один маленький огород. Откройте грядку за 55 монет.</p>' + __qvPorts.detailButton('unlock', p.id, 'Открыть · 55 🪙', __qvPorts.state.coins < 55);
        if (s === 'empty')
            html += `<p class="detail-desc">${__qvPorts.FarmSim.moisture(p) > .05 ? 'Почва влажная — посаженные семена сразу начнут расти.' : 'Можно сначала увлажнить землю или сразу посадить семена.'}</p><div class="detail-actions"><button class="primary" data-select-plant>Выбрать семена</button>${__qvPorts.detailButton('water', p.id, 'Увлажнить землю 💧')}</div>`;
        if (s === 'dry')
            html += `<p class="detail-desc">Семена уже в земле. Немного воды — и начнётся рост. Полив бесплатный.</p>${__qvPorts.detailButton('water', p.id, 'Полить грядку 💧')}`;
        if (s === 'growing') {
            let left = Math.max(1, Math.ceil((p.readyAt - __qvPorts.gameNow()) / 1000)), progress = Math.min(100, 100 * (1 - left / c.seconds));
            html += `<p class="detail-desc">Всё идёт своим чередом. Рост продолжается, даже когда браузер закрыт.</p><div class="soil-status">💧 Почва влажная · полив сохранён</div><div class="detail-meta"><span>До урожая</span><b data-remaining>${left} сек.</b></div><div class="meter"><i data-grow-progress style="width:${progress}%"></i></div><div class="fineprint">Урожай: ${c.yield} шт. · Стоимость: ${c.price * c.yield} монет<br>В прототипе таймеры ускорены.</div>`;
        }
        if (s === 'ready')
            html += `<p class="detail-desc">Урожай созрел! Соберите его, затем продайте в амбаре или оставьте пшеницу для корма.</p>${__qvPorts.detailButton('harvest', p.id, `Собрать ${c.yield} шт. · +12 опыта`)}<div class="fineprint">Выручка за урожай: ${c.yield * c.price} монет.</div>`;
    }
    else {
        const a = __qvPorts.state.animals.find(a => a.id === __qvPorts.selected.id);
        if (!a) {
            __qvPorts.selected = null;
            return renderDetails();
        }
        const sp = __qvPorts.FarmSim.SPECIES[a.type];
        html += `<div class="eyebrow">${sp.name.toUpperCase()} · ВАША ФЕРМА</div><div class="detail-icon">${sp.icon}</div><h2 class="detail-title">${__qvPorts.escapeText(a.name)}</h2><p class="detail-desc">${a.hunger < 35 ? 'Проголодалась и ждёт угощения.' : a.mood > 80 ? 'Счастлива, что вы рядом.' : 'Гуляет, отдыхает и наслаждается днём.'}</p><div class="detail-meta"><span>Сытость</span><b>${Math.round(a.hunger)}%</b></div><div class="meter"><i style="width:${a.hunger}%"></i></div><div class="detail-meta"><span>Настроение</span><b>${Math.round(a.mood)}%</b></div><div class="meter gold"><i style="width:${a.mood}%"></i></div><div class="detail-actions"><button class="secondary" data-action="feed" data-id="${a.id}">Покормить · 1 🌾</button><button class="secondary" data-action="pet" data-id="${a.id}">Погладить ♥</button></div><div class="detail-actions">${__qvPorts.detailButton('collect', a.id, a.stock ? `Забрать ${sp.product === 'milk' ? 'молоко' : sp.product === 'egg' ? 'яйца' : 'шерсть'} · ${a.stock} шт.` : `${__qvPorts.FarmSim.PRODUCTS[sp.product].icon} Продукция ещё готовится`, !a.stock)}</div><div class="fineprint">${a.hunger <= 15 ? 'Накормите животное, чтобы возобновить производство.' : 'Прогресс продукции: ' + Math.floor(a.progress * 100) + '% · запас до 3 шт.'}<br>Животные не погибают, пока вас нет.</div>`;
    }
    el.innerHTML = html;
    el.hidden = false;
}
function updateUI(force = false) {
    const goal = __qvPorts.FarmProduction.nextGoal(__qvPorts.state);
    __qvPorts.$('#objective-title').textContent = goal.title;
    __qvPorts.$('#objective-sub').textContent = goal.detail;
    __qvPorts.$('#objective-step').textContent = goal.step + ' / ' + goal.total;
    __qvPorts.$('#craft-ready').textContent = __qvPorts.state.production.jobs.filter(j => j.readyAt <= __qvPorts.gameNow()).length || '';
    __qvPorts.$('#quick-region').textContent = __qvPorts.FarmExpansion.regions[__qvPorts.state.world.region].name;
    if (__qvPorts.modalKind === 'production') {
        const readyIds = __qvPorts.state.production.jobs.filter(j => j.readyAt <= __qvPorts.gameNow()).map(j => j.id).join(',');
        if (__qvPorts.$('#modal').dataset.readyIds !== readyIds) {
            __qvPorts.$('#modal').dataset.readyIds = readyIds;
            renderModal('production', false);
        }
        for (const b of document.querySelectorAll('#modal [data-action="collectCraft"]')) {
            const job = __qvPorts.state.production.jobs.find(j => j.id === Number(b.dataset.id));
            if (job && job.readyAt > __qvPorts.gameNow())
                b.textContent = Math.ceil((job.readyAt - __qvPorts.gameNow()) / 1000) + ' с';
        }
    }
    if (__qvPorts.world) {
        const r = __qvPorts.FarmExpansion.regions[__qvPorts.state.world.region];
        __qvPorts.$('#region-name').textContent = r.icon + ' ' + r.short;
        __qvPorts.$('#area-summary').hidden = __qvPorts.state.world.region === 'farm';
        __qvPorts.$('.quest-card').hidden = __qvPorts.state.world.region !== 'farm';
        __qvPorts.$('#area-tag').textContent = r.tag;
        __qvPorts.$('#area-title').textContent = r.name;
        __qvPorts.$('#area-desc').textContent = r.description;
        __qvPorts.$('#area-materials').textContent = '🪵 ' + __qvPorts.state.world.materials.wood + ' древесины · 🪨 ' + __qvPorts.state.world.materials.stone + ' камня';
    }
    __qvPorts.$('#coins').textContent = __qvPorts.state.coins.toLocaleString('ru');
    __qvPorts.$('#level').textContent = (Math.floor(__qvPorts.state.xp / 100) + 1) + ' уровень';
    __qvPorts.$('#xp').textContent = (__qvPorts.state.xp % 100) + ' / 100 опыта';
    __qvPorts.$('#inv-count').textContent = Object.values(__qvPorts.state.inventory).reduce((a, b) => a + b, 0);
    const w = __qvPorts.ValleyGameplay.weather(__qvPorts.state, __qvPorts.gameNow()), secs = Math.max(0, Math.ceil(w.remainingMs / 1000));
    __qvPorts.$('#weather-icon').textContent = w.icon;
    __qvPorts.$('#weather-name').textContent = w.name;
    __qvPorts.$('#weather-time').textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
    __qvPorts.$('#weather-chip').title = w.desc;
    const readyOrders = __qvPorts.state.game.orders.filter(o => __qvPorts.ValleyGameplay.canDeliver(__qvPorts.state, o)).length;
    __qvPorts.$('#orders-ready').textContent = readyOrders;
    __qvPorts.$('#orders-ready').classList.toggle('hot', readyOrders > 0);
    __qvPorts.$('#weather-layer').className = 'weather-layer weather-' + w.key;
    const lease = __qvPorts.ValleyGameplay.leaseStatus(__qvPorts.state);
    __qvPorts.$('#lease-title').textContent = 'День ' + lease.day;
    __qvPorts.$('#lease-note').textContent = lease.debt ? 'к оплате ' + lease.debt + ' 🪙' : lease.free ? '1-я неделя бесплатно' : 'неделя ' + lease.week + ' оплачена';
    __qvPorts.$('#lease-chip').classList.toggle('due', lease.debt > 0);
    const story = __qvPorts.ValleyGameplay.storyStatus(__qvPorts.state);
    __qvPorts.$('#story-eyebrow').innerHTML = (story.complete ? 'ИСТОРИЯ ЗАВЕРШЕНА' : 'ГЛАВА ' + (story.index + 1) + ' / ' + __qvPorts.ValleyGameplay.STORY.length) + ' <span class="tiny-sun">' + story.icon + '</span>';
    __qvPorts.$('#story-title').textContent = story.title;
    __qvPorts.$('#story-intro').textContent = story.text;
    let questHtml;
    if (story.complete)
        questHtml = '<div class="quest completed"><span class="quest-check">✓</span><div class="quest-text">Долина живёт<small>' + __qvPorts.state.game.ordersCompleted + ' заказов · ' + __qvPorts.state.game.reputation + ' репутации</small></div></div>';
    else
        questHtml = story.requirements.map(r => `<div class="quest ${r.done ? 'completed' : ''}"><span class="quest-check">${r.done ? '✓' : Math.min(r.value, r.target) + '/' + r.target}</span><div class="quest-text">${r.text}<small>${r.done ? 'Готово' : 'Цель главы'}</small></div></div>`).join('') + (story.ready ? `<button class="story-claim-mini" data-action="claimStory" data-id="${story.index}">Получить награду главы</button>` : '');
    if (questHtml !== __qvPorts.questSignature) {
        __qvPorts.$('#quests').innerHTML = questHtml;
        __qvPorts.questSignature = questHtml;
    }
    renderDetails(force);
}
function renderModal(kind, focus = true) {
    __qvPorts.$('#ui').classList.remove('menu-open');
    __qvPorts.visualDirty = true;
    __qvPorts.modalKind = kind;
    __qvPorts.$('#modal').classList.toggle('valley-modal', ['map', 'land', 'decor', 'orders', 'journal', 'people', 'lease'].includes(kind));
    if (kind === 'production') {
        if (focus)
            __qvPorts.lastModalTrigger = document.activeElement;
        __qvPorts.$('#modal').innerHTML = __qvPorts.ProductionUI.render(__qvPorts.state, __qvPorts.gameNow());
        __qvPorts.$('#modal-overlay').hidden = false;
        if (focus)
            __qvPorts.$('#modal').focus();
        return;
    }
    if (['orders', 'journal', 'people', 'lease'].includes(kind)) {
        if (focus)
            __qvPorts.lastModalTrigger = document.activeElement;
        __qvPorts.$('#modal').innerHTML = kind === 'orders' ? __qvPorts.GameplayUI.orders(__qvPorts.state) : kind === 'journal' ? __qvPorts.GameplayUI.journal(__qvPorts.state) : kind === 'people' ? __qvPorts.GameplayUI.people(__qvPorts.state) : __qvPorts.GameplayUI.lease(__qvPorts.state);
        __qvPorts.$('#modal-overlay').hidden = false;
        if (focus)
            __qvPorts.$('#modal').focus();
        return;
    }
    if (['map', 'land', 'decor'].includes(kind)) {
        if (focus)
            __qvPorts.lastModalTrigger = document.activeElement;
        __qvPorts.$('#modal').innerHTML = __qvPorts.ValleyUI.modal(kind, __qvPorts.state);
        __qvPorts.$('#modal-overlay').hidden = false;
        if (focus)
            __qvPorts.$('#modal').focus();
        return;
    }
    if (focus)
        __qvPorts.lastModalTrigger = document.activeElement;
    let html = '<button class="close" data-close-modal aria-label="Закрыть окно">×</button>';
    if (kind === 'barn') {
        let total = Object.entries(__qvPorts.state.inventory).reduce((sum, [k, n]) => sum + (k === 'wheat' ? Math.max(0, n - 3) : n) * __qvPorts.FarmSim.PRODUCTS[k].price, 0);
        html += '<div class="eyebrow">ВСЁ, ЧТО ВЫ ВЫРАСТИЛИ</div><h2 id="modal-title">Ваш амбар</h2><p>Свежий урожай и маленькие подарки от животных.</p>';
        for (const [key, p] of Object.entries(__qvPorts.FarmSim.PRODUCTS)) {
            html += `<div class="inventory-row"><span class="inventory-emoji">${p.icon}</span><div class="inventory-name">${p.name}<small>${p.price} монет за штуку${key === 'wheat' ? ' · корм для животных' : ''}</small></div><b class="inventory-quantity">${__qvPorts.state.inventory[key]}</b><button data-action="sell" data-key="${key}" data-qty="1" ${__qvPorts.state.inventory[key] ? '' : 'disabled'}>Продать 1</button></div>`;
        }
        html += `<div class="inventory-total"><span>Продать запасы</span><b>${total} 🪙</b></div><button class="primary" data-action="sell" ${total ? '' : 'disabled'}>Продать всё · ${total} монет</button><div class="fineprint">При продаже всего остаются 3 единицы пшеницы на корм.<br>Отдельной кнопкой можно продать и этот запас.</div>`;
    }
    else if (kind === 'shop') {
        html += '<div class="eyebrow">НОВЫЕ ЖИТЕЛИ ДОЛИНЫ</div><h2 id="modal-title">Кого поселим?</h2><p>Каждое животное гуляет по ферме самостоятельно. Кормите, гладьте и собирайте продукцию.</p>';
        for (const [key, sp] of Object.entries(__qvPorts.FarmSim.SPECIES)) {
            html += `<div class="shop-card"><span class="shop-emoji">${sp.icon}</span><div class="shop-copy">${sp.name}<small>${__qvPorts.FarmSim.PRODUCTS[sp.product].name} · ${sp.seconds} сек.<br>Нужны еда и внимание</small></div><button class="primary" data-action="buyAnimal" data-species="${key}" ${__qvPorts.state.coins < sp.price || __qvPorts.state.animals.length >= 12 ? 'disabled' : ''}>${sp.price} 🪙</button></div>`;
        }
        html += `<div class="fineprint">В загоне ${__qvPorts.state.animals.length} из 12 животных. Покупки только за игровые монеты — реальных платежей нет.</div>`;
    }
    else if (kind === 'graphics') {
        html += '<div class="eyebrow">СВЕТ, ВОДА И ВЕТЕР</div><h2 id="modal-title">Графика</h2><p>Шейдерная вода, ветер в листве и влажная земля работают во всех режимах.</p>';
        for (const [key, q] of Object.entries(__qvPorts.F.QUALITY))
            html += `<button class="quality-choice ${__qvPorts.R.quality === key ? 'chosen' : ''}" data-quality="${key}" aria-pressed="${__qvPorts.R.quality === key}"><b>${q.label}</b><small>${key === 'high' ? 'Мягкие тени 2048 · лёгкое свечение' : key === 'balanced' ? 'Тени 1024 · умеренное разрешение' : 'Меньше нагрузка · упрощённые тени'}</small><span>${__qvPorts.R.quality === key ? '✓' : '○'}</span></button>`;
        html += '<div class="notice">При нагреве телефона выберите «Экономный». Прогресс фермы не меняется при переключении графики. Это процедурные эффекты, без трассировки лучей.</div><div class="modal-button-row"><button class="secondary" id="save-help">Сохранение и справка</button></div>';
    }
    else {
        html += '<div class="eyebrow">МАЛЕНЬКАЯ ФЕРМА. БОЛЬШАЯ ЗАБОТА.</div><h2 id="modal-title">Добро пожаловать</h2><div class="help-grid"><span>🌱</span><div>Нажмите на каплю для полива. Либо выберите «Полить» и коснитесь самой земли.<small>Морковь: 45 сек. Пшеница: 30 сек. Тыква: 75 сек.</small></div><span>🐑</span><div>Нажмите на животное: покормите пшеницей, погладьте и заберите продукцию.<small>Сытость и настроение влияют на производство. Животные не погибают.</small></div><span>🪙</span><div>Выполняйте заказы на рыночной доске, а лишние запасы продавайте в амбаре.<small>Срочные заказы и серии поставок дают повышенную награду.</small></div><span>🖐</span><div>В режиме осмотра перетаскивание вращает ферму. С лейкой — поливает грядки. Колёсико или два пальца — масштаб.<small>Клавиши 1–4: инструменты. B: амбар. H: убрать интерфейс. Escape: закрыть окно.</small></div></div><div class="notice"><b>Это локальный прототип, не онлайн-сервис.</b><br>Прогресс хранится только в этом браузере. Очистка данных браузера может его удалить. Аккаунтов, друзей и серверной экономики здесь пока нет. Таймеры ускорены; изменение часов устройства влияет на локальную симуляцию. Все 3D-модели созданы программно.</div><div class="modal-button-row"><button class="secondary" id="export-save">Экспорт сохранения</button><button class="secondary" id="import-save">Импорт</button><input type="file" id="import-file" accept="application/json,.json" hidden><button class="secondary" id="reset-save">Начать заново</button></div>';
    }
    __qvPorts.$('#modal').innerHTML = html;
    __qvPorts.$('#modal-overlay').hidden = false;
    if (focus)
        __qvPorts.$('#modal').focus();
}
function closeModal() { __qvPorts.visualDirty = true; __qvPorts.modalKind = null; __qvPorts.$('#modal-overlay').hidden = true; __qvPorts.lastModalTrigger?.focus?.(); }
function buildSeeds() { __qvPorts.$('#seed-picker').innerHTML = Object.entries(__qvPorts.FarmSim.CROPS).map(([key, c]) => `<button class="seed-chip ${key === __qvPorts.seed ? 'active' : ''}" data-seed="${key}"><span class="seed-emoji">${c.icon}</span><span><b>${c.name}</b><small>${c.cost} 🪙 · ${c.seconds} сек.</small></span></button>`).join(''); }
return {renderDetails,updateUI,renderModal,closeModal,buildSeeds};
}
