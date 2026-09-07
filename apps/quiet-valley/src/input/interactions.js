/** input/interactions.js. Explicit view/interaction ports; no imported global game state. */
export function createInteractions(__qvPorts) {
function setTool(next, { applySelection = true } = {}) {
    if (__qvPorts.buildType)
        endBuild();
    const previousPlot = __qvPorts.selected?.kind === 'plot' ? __qvPorts.selected.id : null;
    __qvPorts.tool = next;
    document.body.dataset.activeTool = __qvPorts.tool;
    document.querySelectorAll('[data-tool]').forEach(b => { b.classList.toggle('active', b.dataset.tool === __qvPorts.tool); b.setAttribute('aria-pressed', String(b.dataset.tool === __qvPorts.tool)); });
    __qvPorts.$('#seed-picker').hidden = __qvPorts.tool !== 'plant';
    __qvPorts.$('#water-guide').hidden = __qvPorts.tool !== 'water';
    if (__qvPorts.tool !== 'inspect')
        __qvPorts.$('#details').hidden = true;
    __qvPorts.$('#control-hint').textContent = { inspect: 'Нажмите на грядку или животное · Перетаскивайте для вращения', plant: 'Выберите семена и нажмите на пустую грядку', water: 'Нажмите на землю · Проведите по грядкам для полива · Два пальца — масштаб', harvest: 'Нажмите на золотой значок: урожай созрел' }[__qvPorts.tool];
    if (__qvPorts.tool === 'water' && applySelection && previousPlot !== null && __qvPorts.state.plots[previousPlot]?.unlocked)
        run({ type: 'water', id: previousPlot });
    __qvPorts.updateSelection();
    if (__qvPorts.tool === 'inspect')
        __qvPorts.renderDetails(true);
}
function choosePlot(id, { direct = false } = {}) {
    const p = __qvPorts.state.plots[id];
    if (!p)
        return;
    __qvPorts.selected = { kind: 'plot', id };
    if (!p.unlocked) {
        __qvPorts.renderDetails(true);
        __qvPorts.updateSelection();
        return;
    }
    if (direct && __qvPorts.tool === 'inspect' && __qvPorts.FarmSim.status(p, __qvPorts.gameNow()) === 'ready') {
        run({ type: 'harvest', id });
        __qvPorts.updateSelection();
        return;
    }
    if (direct && __qvPorts.tool === 'inspect' && __qvPorts.FarmSim.status(p, __qvPorts.gameNow()) === 'dry') {
        run({ type: 'water', id });
        __qvPorts.updateSelection();
        return;
    }
    if (__qvPorts.tool === 'inspect') {
        __qvPorts.renderDetails(true);
        __qvPorts.updateSelection();
        return;
    }
    run(__qvPorts.tool === 'plant' ? { type: 'plant', id, crop: __qvPorts.seed } : { type: __qvPorts.tool, id });
    __qvPorts.updateSelection();
}
function chooseAnimal(id) { __qvPorts.selected = { kind: 'animal', id }; setTool('inspect'); __qvPorts.selected = { kind: 'animal', id }; __qvPorts.renderDetails(true); __qvPorts.updateSelection(); }
function run(action) {
    const result = __qvPorts.session.dispatch(action);
    __qvPorts.state = __qvPorts.session.snapshot();
    __qvPorts.toast(result.message);
    if (!result.ok)
        return result;
    if (action.type === 'markIntroSeen') {
        __qvPorts.$('#intro-overlay').hidden = true;
        __qvPorts.save();
    }
    if (action.type === 'travel') {
        endBuild();
        __qvPorts.selected = null;
        __qvPorts.closeModal();
        __qvPorts.world.sync(__qvPorts.state);
        __qvPorts.defaultCamera();
        __qvPorts.waterFX.animate(20);
        document.getElementById('location-shade').classList.add('active');
        __qvPorts.lifetime.timeout(() => document.getElementById('location-shade').classList.remove('active'), 170);
        setTool('inspect', { applySelection: false });
    }
    let point = [0, 1, 0];
    if (['plant', 'water', 'harvest', 'unlock'].includes(action.type)) {
        const m = __qvPorts.art.cropModels[action.id];
        point = [m.x, m.surface + .4, m.z];
    }
    else if (['pet', 'feed', 'collect'].includes(action.type)) {
        const m = __qvPorts.art.animalModels.get(action.id);
        if (m) {
            point = [m.g.p[0], 1.8, m.g.p[2]];
            if (action.type === 'pet') {
                m.pet = 1.8;
                m.wait = 3;
            }
            if (action.type === 'feed') {
                m.target = m.type === 'chicken' ? [8.2, 4.9] : [3.55, -3.0];
                m.wait = 5;
            }
        }
    }
    else if (action.type === 'buyAnimal') {
        const a = __qvPorts.state.animals.at(-1);
        __qvPorts.art.animalModel(a);
        __qvPorts.addAnimalLabel(a);
        point = __qvPorts.art.animalModels.get(a.id).g.p;
    }
    else if (['plantTree', 'waterTree', 'harvestTree'].includes(action.type)) {
        const p = __qvPorts.FarmExpansion.fruitSites[action.id];
        point = [p.x, 1.2, p.z];
    }
    else if (action.type === 'clear') {
        const p = __qvPorts.FarmExpansion.resourceNodes.find(n => n.key === action.key);
        if (p)
            point = [p.x, 1, p.z];
    }
    else if (action.type === 'placeDecor')
        point = [action.x, .8, action.z];
    else if (action.type === 'deliverOrder')
        point = __qvPorts.art.orderBoardPoint || [-2.55, 2.45, 6.75];
    else if (action.type === 'claimStory')
        point = [-6.5, 2.4, -6.8];
    if (result.effect === 'water' && Number.isInteger(action.id)) {
        const m = __qvPorts.art.cropModels[action.id];
        __qvPorts.waterFX.start(action.id, m.x, m.z, m.surface - .475);
    }
    else if (result.effect === 'waterTree') {
        const p = __qvPorts.FarmExpansion.fruitSites[action.id];
        __qvPorts.waterFX.start(100 + action.id, p.x, p.z, 0);
    }
    else if (action.type !== 'travel')
        __qvPorts.fx(point, result.effect);
    __qvPorts.world.sync(__qvPorts.state);
    if (__qvPorts.buildType)
        __qvPorts.world.setPlacement(__qvPorts.buildType, __qvPorts.state, __qvPorts.buildRotation);
    __qvPorts.chime(result.effect);
    __qvPorts.save();
    __qvPorts.art.updateCrops(__qvPorts.state, __qvPorts.gameNow());
    __qvPorts.updateUI(true);
    __qvPorts.updateLabels(__qvPorts.gameNow());
    if (__qvPorts.modalKind)
        __qvPorts.renderModal(__qvPorts.modalKind, false);
    return result;
}
function chooseFeature(key) {
    const f = __qvPorts.world.features.find(f => f.key === key && __qvPorts.world.featureVisible(f, __qvPorts.state));
    if (!f)
        return;
    if (f.kind === 'project') {
        __qvPorts.renderModal('land');
        return;
    }
    if (f.kind === 'resource') {
        run({ type: 'clear', key: f.key });
        return;
    }
    if (f.kind === 'tree' && __qvPorts.tool === 'water') {
        run({ type: 'waterTree', id: f.id });
        return;
    }
    if (f.kind === 'tree' && __qvPorts.tool === 'harvest') {
        run({ type: 'harvestTree', id: f.id });
        return;
    }
    setTool('inspect', { applySelection: false });
    __qvPorts.selected = { kind: 'feature', id: f.key };
    __qvPorts.renderDetails(true);
    __qvPorts.updateSelection();
}
function endBuild() { __qvPorts.buildType = null; document.body.classList.remove('construction'); __qvPorts.$('#build-controls').hidden = true; __qvPorts.world?.setPlacement(null, __qvPorts.state); }
function startBuild(type) {
    if (type !== 'remove' && !Object.hasOwn(__qvPorts.FarmExpansion.decor, type))
        return;
    __qvPorts.closeModal();
    __qvPorts.selected = null;
    setTool('inspect', { applySelection: false });
    __qvPorts.buildType = type;
    __qvPorts.buildRotation = 0;
    document.body.classList.add('construction');
    __qvPorts.$('#build-controls').hidden = false;
    const d = __qvPorts.FarmExpansion.decor[type];
    __qvPorts.$('#build-item-icon').textContent = d?.icon || '🪓';
    __qvPorts.$('#build-item-name').textContent = d?.name || 'Разобрать украшение';
    __qvPorts.$('#build-item-price').textContent = d ? d.price + ' монет · за установку' : 'Возврат 50% цены';
    __qvPorts.$('#build-rotate').hidden = type === 'remove';
    __qvPorts.$('#control-hint').textContent = type === 'remove' ? 'Нажмите на своё украшение · Грядки и постройки не удаляются' : 'Нажмите на свободную подсвеченную клетку · Перетаскивание вращает камеру';
    __qvPorts.world.setPlacement(type, __qvPorts.state, __qvPorts.buildRotation);
    __qvPorts.R.camera.pitch = 1.05;
    __qvPorts.R.camera.size = Math.min(__qvPorts.R.camera.size, innerWidth < 700 ? 18 : 12.8);
}
function rotateBuild() { if (!__qvPorts.buildType || __qvPorts.buildType === 'remove')
    return; __qvPorts.buildRotation = (__qvPorts.buildRotation + 1) % 4; __qvPorts.world.setPlacement(__qvPorts.buildType, __qvPorts.state, __qvPorts.buildRotation); __qvPorts.$('#build-rotate').textContent = 'Поворот ' + __qvPorts.buildRotation * 90 + '°'; }
return {setTool,choosePlot,chooseAnimal,run,chooseFeature,endBuild,startBuild,rotateBuild};
}
