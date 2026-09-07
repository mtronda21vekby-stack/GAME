/** presentation/labels.js. Explicit view/interaction ports; no imported global game state. */
export function createWorldLabels(__qvPorts) {
function addAnimalLabel(a) { if (__qvPorts.animalLabels.has(a.id))
    return; let b = document.createElement('button'); b.className = 'world-label animal-label'; b.setAttribute('aria-label', 'Уход: ' + a.name); b.dataset.animal = a.id; b.onclick = () => __qvPorts.chooseAnimal(a.id); __qvPorts.$('#labels').appendChild(b); __qvPorts.animalLabels.set(a.id, b); }
function setupLabels() { for (let id = 0; id < 24; id++) {
    let b = document.createElement('button');
    b.className = 'world-label';
    b.dataset.plot = id;
    b.onclick = () => { if (performance.now() > __qvPorts.suppressPlotClickUntil)
        __qvPorts.choosePlot(id, { direct: true }); };
    __qvPorts.$('#labels').appendChild(b);
    __qvPorts.plotLabels.push(b);
} __qvPorts.state.animals.forEach(addAnimalLabel); __qvPorts.marketLabel = document.createElement('button'); __qvPorts.marketLabel.className = 'world-label place-label'; __qvPorts.marketLabel.textContent = 'Лавка урожая'; __qvPorts.marketLabel.setAttribute('aria-label', 'Открыть амбар и продать урожай'); __qvPorts.marketLabel.onclick = () => __qvPorts.renderModal('barn'); __qvPorts.$('#labels').appendChild(__qvPorts.marketLabel); __qvPorts.ordersLabel = document.createElement('button'); __qvPorts.ordersLabel.className = 'world-label place-label orders-world-label'; __qvPorts.ordersLabel.textContent = '📋 Заказы'; __qvPorts.ordersLabel.setAttribute('aria-label', 'Открыть рыночные заказы'); __qvPorts.ordersLabel.onclick = () => __qvPorts.renderModal('orders'); __qvPorts.$('#labels').appendChild(__qvPorts.ordersLabel); for (const v of __qvPorts.art.villagers || []) {
    const c = __qvPorts.ValleyGameplay.CHARACTERS[v.id];
    let b = document.createElement('button');
    b.className = 'world-label place-label villager-label';
    b.textContent = (c?.icon || '●') + ' ' + v.name;
    b.setAttribute('aria-label', 'Поговорить: ' + v.name);
    b.onclick = () => __qvPorts.renderModal('people');
    __qvPorts.$('#labels').appendChild(b);
    __qvPorts.villagerLabels.set(v.id, b);
} }
function updateLabels(now) {
    const place = (el, pos) => { const q = __qvPorts.R.project(pos); el.style.left = q.x + 'px'; el.style.top = q.y + 'px'; el.classList.toggle('hidden-label', q.x < 12 || q.x > __qvPorts.R.w - 12 || q.y < 79 || q.y > __qvPorts.R.h - 115 || q.z < -1 || q.z > 1); };
    for (const m of __qvPorts.art.cropModels) {
        let p = __qvPorts.state.plots[m.id], s = __qvPorts.FarmSim.status(p, now), b = __qvPorts.plotLabels[m.id];
        b.hidden = m.region !== __qvPorts.state.world.region || (m.region === 'river' && !__qvPorts.FarmExpansion.level(__qvPorts.state, 'river_fields'));
        if (!b.hidden) {
            const isSelected = __qvPorts.selected?.kind === 'plot' && __qvPorts.selected.id === m.id;
            b.hidden = !isSelected && (__qvPorts.tool === 'inspect' ? (s !== 'ready' && s !== 'dry') : __qvPorts.tool === 'water' ? (s !== 'dry' && s !== 'empty') : __qvPorts.tool === 'harvest' ? s !== 'ready' : __qvPorts.tool === 'plant' ? (s !== 'empty' && s !== 'locked') : false);
        }
        if (b.hidden)
            continue;
        b.className = 'world-label ' + s + (s === 'empty' && __qvPorts.FarmSim.moisture(p, now) > .05 ? ' prewatered' : '');
        let remaining = p.readyAt ? Math.max(0, Math.ceil((p.readyAt - now) / 1000)) : 0;
        b.textContent = { empty: __qvPorts.FarmSim.moisture(p, now) > .05 ? '💧+' : '+', ready: '✓', dry: '💧', locked: '✧', growing: remaining + 'с' }[s];
        b.setAttribute('aria-label', 'Грядка ' + (m.id + 1) + ': ' + ({ empty: __qvPorts.FarmSim.moisture(p, now) > .05 ? 'влажная, можно сажать' : 'пустая', ready: 'урожай готов', dry: 'нужен полив', locked: 'открыть за 55 монет', growing: 'растёт' }[s]));
        place(b, [m.x, (m.surface - .475) + (s === 'ready' ? 1.7 : s === 'growing' ? 1.3 : .84), m.z]);
    }
    for (const a of __qvPorts.state.animals) {
        let m = __qvPorts.art.animalModels.get(a.id), b = __qvPorts.animalLabels.get(a.id);
        if (!m || !b)
            continue;
        b.hidden = __qvPorts.state.world.region !== 'farm' || (!a.stock && a.hunger >= 40 && !(__qvPorts.selected?.kind === 'animal' && __qvPorts.selected.id === a.id));
        if (b.hidden)
            continue;
        b.textContent = a.stock ? __qvPorts.FarmSim.PRODUCTS[__qvPorts.FarmSim.SPECIES[a.type].product].icon : a.hunger < 40 ? '🌾' : '♥';
        b.style.color = a.hunger < 40 ? '#b79251' : '#b38477';
        place(b, [m.g.p[0], a.type === 'cow' ? 2.2 : a.type === 'sheep' ? 1.9 : 1.5, m.g.p[2]]);
    }
    for (const v of __qvPorts.art.villagers || []) {
        const b = __qvPorts.villagerLabels.get(v.id);
        if (!b)
            continue;
        b.hidden = __qvPorts.state.world.region !== 'farm';
        if (!b.hidden)
            place(b, [v.g.p[0], 2.45, v.g.p[2]]);
    }
    __qvPorts.marketLabel.hidden = __qvPorts.state.world.region !== 'farm';
    place(__qvPorts.marketLabel, [-5.2, 3.35, 7.1]);
    __qvPorts.ordersLabel.hidden = __qvPorts.state.world.region !== 'farm';
    if (!__qvPorts.ordersLabel.hidden) {
        __qvPorts.ordersLabel.textContent = '📋 Заказы' + (__qvPorts.state.game.orders.some(o => __qvPorts.ValleyGameplay.canDeliver(__qvPorts.state, o)) ? ' · готово!' : '');
        place(__qvPorts.ordersLabel, __qvPorts.art.orderBoardPoint || [-2.55, 2.45, 6.75]);
    }
    for (const f of __qvPorts.world.features) {
        let b = __qvPorts.featureLabels.get(f.key);
        if (!b) {
            b = document.createElement('button');
            b.dataset.feature = f.key;
            b.onclick = () => __qvPorts.chooseFeature(f.key);
            __qvPorts.$('#labels').appendChild(b);
            __qvPorts.featureLabels.set(f.key, b);
        }
        b.hidden = !__qvPorts.world.featureVisible(f, __qvPorts.state) || !!__qvPorts.buildType;
        if (b.hidden)
            continue;
        b.className = 'world-label region-feature ' + f.kind + '-feature';
        if (f.kind === 'resource')
            b.textContent = (f.resource.type === 'wood' ? '🪵' : '🪨') + ' +' + f.resource.amount;
        if (f.kind === 'project')
            b.textContent = __qvPorts.FarmExpansion.projects[f.key].icon + ' ' + __qvPorts.FarmExpansion.projects[f.key].name;
        if (f.kind === 'honey')
            b.textContent = '🍯 ' + __qvPorts.state.world.apiaryStock + '/' + (__qvPorts.FarmExpansion.level(__qvPorts.state, 'forest_cabin') ? 6 : 3);
        if (f.kind === 'tree') {
            const tr = __qvPorts.state.world.trees[f.id];
            b.textContent = !tr.planted ? '+ 🍎' : !tr.waterAt ? '💧' : now >= tr.readyAt ? '🍎 Собрать' : Math.ceil((tr.readyAt - now) / 1000) + 'с';
        }
        b.setAttribute('aria-label', f.kind === 'resource' ? 'Расчистить: ' + f.key : f.kind === 'tree' ? 'Яблоня ' + (f.id + 1) : b.textContent);
        place(b, f.pos);
    }
    if (__qvPorts.buildType) {
        __qvPorts.plotLabels.forEach(b => b.hidden = true);
        __qvPorts.animalLabels.forEach(b => b.hidden = true);
        __qvPorts.marketLabel.hidden = true;
        __qvPorts.ordersLabel.hidden = true;
    }
}
function updateSelection() { __qvPorts.selectors.forEach(n => n.visible = false); if (__qvPorts.selected?.kind === 'plot') {
    const m = __qvPorts.art.cropModels[__qvPorts.selected.id];
    const poses = [[m.x - 1, m.surface + .01, m.z], [m.x + 1, m.surface + .01, m.z], [m.x, m.surface + .01, m.z - 1], [m.x, m.surface + .01, m.z + 1]];
    __qvPorts.selectors.forEach((n, i) => { n.visible = true; n.p = poses[i]; });
} }
return {addAnimalLabel,setupLabels,updateLabels,updateSelection};
}
