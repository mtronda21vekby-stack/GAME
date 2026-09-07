import { createFeedback } from '../presentation/feedback.js';
import { createWorldLabels } from '../presentation/labels.js';
import { createHUD } from '../presentation/hud.js';
import { createInteractions } from '../input/interactions.js';
import { createControls } from '../input/controls.js';
/* UI, input, persistence and presentation composition root. */
'use strict';
export async function startController({ session, FarmSim, FarmExpansion, ValleyGameplay, FarmProduction, FarmArt, ValleyWorld, FarmAtmosphere, FarmWater, ValleyUI, GameplayUI, ProductionUI, FarmPick, F, diagnostics, lifetime, graphics, createCountryDetails }) {
    const gameNow = () => session.now();
    const $ = s => document.querySelector(s);
    const icons = { sprout: '<path d="M12 21v-9M12 15C5 16 3 10 3 6c6-1 10 2 9 9ZM12 11C11 5 15 2 21 3c0 6-3 9-9 8Z"/>', coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="M12 8v8m-2-6 2-2 2 2"/>', star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', home: '<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-8h6v8"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>', moon: '<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>', muted: '<path d="m11 4-5 4H3v8h3l5 4ZM16 9l5 6m0-6-5 6"/>', sound: '<path d="m11 4-5 4H3v8h3l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>', cursor: '<path d="m5 3 14 10-7 1-3 7Z"/>', water: '<path d="M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13Z"/><path d="M9 15c0 2 1 3 3 3"/>', basket: '<path d="M3 10h18l-2 11H5ZM7 10l5-8 5 8M9 14v4m6-4v4"/>', barn: '<path d="M3 10 12 3l9 7v11H3ZM8 21V11h8v10M8 12l8 9m0-9-8 9"/>', paw: '<ellipse cx="12" cy="16" rx="5" ry="4"/><ellipse cx="5" cy="10" rx="2" ry="2.7" transform="rotate(-20 5 10)"/><ellipse cx="9" cy="5.5" rx="2" ry="2.7"/><ellipse cx="15" cy="5.5" rx="2" ry="2.7"/><ellipse cx="19" cy="10" rx="2" ry="2.7" transform="rotate(20 19 10)"/>' };
    const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.sprout}</svg>`;
    document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
    let R, art, world, atmosphere, country, waterFX, state, storageOK = true, loadWarning = '', selected = null, tool = 'inspect', seed = 'carrot', modalKind = null, night = false, audioOn = false, audio = null, saveCount = 0, detailsSignature = '', questSignature = '';
    const escapeText = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const store = { inspect: () => session.persistence() };
    state = session.snapshot();
    loadWarning = session.warning;
    storageOK = session.persistence().available;
    function save() { const result = session.save(); storageOK = result.ok; if (storageOK)
        saveCount++; $('#save-status').textContent = result.ok ? 'Сохранено на устройстве' : result.message; }
    function advance(resume = false) { session.advance(resume); state = session.snapshot(); }
    let toastTimer;
    let suppressPlotClickUntil = 0;
    let visualDirty = true, buildType = null, buildRotation = 0;
    const featureLabels = new Map();
    const plotLabels = [], animalLabels = new Map(), villagerLabels = new Map();
    let marketLabel, ordersLabel;
    const particles = [];
    let selectors = [];
    const detailButton = (type, id, text, disabled = false, extra = '') => `<button class="primary" data-action="${type}" data-id="${id}" ${extra} ${disabled ? 'disabled' : ''}>${text}</button>`;
    let lastModalTrigger = null;
    const { toast, chime, fx } = createFeedback({
        get $() { return $; },
        get audio() { return audio; }, set audio(value) { audio = value; },
        get audioOn() { return audioOn; }, set audioOn(value) { audioOn = value; },
        get F() { return F; },
        get lifetime() { return lifetime; },
        get particles() { return particles; },
        get R() { return R; }, set R(value) { R = value; },
        get toastTimer() { return toastTimer; }, set toastTimer(value) { toastTimer = value; }
    });
    const { addAnimalLabel, setupLabels, updateLabels, updateSelection } = createWorldLabels({
        get $() { return $; },
        get animalLabels() { return animalLabels; },
        get art() { return art; }, set art(value) { art = value; },
        get buildType() { return buildType; }, set buildType(value) { buildType = value; },
        get chooseAnimal() { return chooseAnimal; },
        get chooseFeature() { return chooseFeature; },
        get choosePlot() { return choosePlot; },
        get FarmExpansion() { return FarmExpansion; },
        get FarmSim() { return FarmSim; },
        get featureLabels() { return featureLabels; },
        get marketLabel() { return marketLabel; }, set marketLabel(value) { marketLabel = value; },
        get ordersLabel() { return ordersLabel; }, set ordersLabel(value) { ordersLabel = value; },
        get plotLabels() { return plotLabels; },
        get R() { return R; }, set R(value) { R = value; },
        get renderModal() { return renderModal; },
        get selected() { return selected; }, set selected(value) { selected = value; },
        get selectors() { return selectors; }, set selectors(value) { selectors = value; },
        get state() { return state; }, set state(value) { state = value; },
        get suppressPlotClickUntil() { return suppressPlotClickUntil; }, set suppressPlotClickUntil(value) { suppressPlotClickUntil = value; },
        get tool() { return tool; }, set tool(value) { tool = value; },
        get ValleyGameplay() { return ValleyGameplay; },
        get villagerLabels() { return villagerLabels; },
        get world() { return world; }, set world(value) { world = value; }
    });
    const { renderDetails, updateUI, renderModal, closeModal, buildSeeds } = createHUD({
        get $() { return $; },
        get detailButton() { return detailButton; },
        get detailsSignature() { return detailsSignature; }, set detailsSignature(value) { detailsSignature = value; },
        get escapeText() { return escapeText; },
        get F() { return F; },
        get FarmExpansion() { return FarmExpansion; },
        get FarmProduction() { return FarmProduction; },
        get FarmSim() { return FarmSim; },
        get gameNow() { return gameNow; },
        get GameplayUI() { return GameplayUI; },
        get lastModalTrigger() { return lastModalTrigger; }, set lastModalTrigger(value) { lastModalTrigger = value; },
        get modalKind() { return modalKind; }, set modalKind(value) { modalKind = value; },
        get ProductionUI() { return ProductionUI; },
        get questSignature() { return questSignature; }, set questSignature(value) { questSignature = value; },
        get R() { return R; }, set R(value) { R = value; },
        get seed() { return seed; }, set seed(value) { seed = value; },
        get selected() { return selected; }, set selected(value) { selected = value; },
        get state() { return state; }, set state(value) { state = value; },
        get tool() { return tool; }, set tool(value) { tool = value; },
        get ValleyGameplay() { return ValleyGameplay; },
        get ValleyUI() { return ValleyUI; },
        get visualDirty() { return visualDirty; }, set visualDirty(value) { visualDirty = value; },
        get world() { return world; }, set world(value) { world = value; }
    });
    const { setTool, choosePlot, chooseAnimal, run, chooseFeature, endBuild, startBuild, rotateBuild } = createInteractions({
        get $() { return $; },
        get addAnimalLabel() { return addAnimalLabel; },
        get art() { return art; }, set art(value) { art = value; },
        get buildRotation() { return buildRotation; }, set buildRotation(value) { buildRotation = value; },
        get buildType() { return buildType; }, set buildType(value) { buildType = value; },
        get chime() { return chime; },
        get closeModal() { return closeModal; },
        get defaultCamera() { return defaultCamera; },
        get FarmExpansion() { return FarmExpansion; },
        get FarmSim() { return FarmSim; },
        get fx() { return fx; },
        get gameNow() { return gameNow; },
        get lifetime() { return lifetime; },
        get modalKind() { return modalKind; }, set modalKind(value) { modalKind = value; },
        get R() { return R; }, set R(value) { R = value; },
        get renderDetails() { return renderDetails; },
        get renderModal() { return renderModal; },
        get save() { return save; },
        get seed() { return seed; }, set seed(value) { seed = value; },
        get selected() { return selected; }, set selected(value) { selected = value; },
        get session() { return session; },
        get state() { return state; }, set state(value) { state = value; },
        get toast() { return toast; },
        get tool() { return tool; }, set tool(value) { tool = value; },
        get updateLabels() { return updateLabels; },
        get updateSelection() { return updateSelection; },
        get updateUI() { return updateUI; },
        get waterFX() { return waterFX; }, set waterFX(value) { waterFX = value; },
        get world() { return world; }, set world(value) { world = value; }
    });
    const { input } = createControls({
        get $() { return $; },
        get art() { return art; }, set art(value) { art = value; },
        get audioOn() { return audioOn; }, set audioOn(value) { audioOn = value; },
        get buildRotation() { return buildRotation; }, set buildRotation(value) { buildRotation = value; },
        get buildType() { return buildType; }, set buildType(value) { buildType = value; },
        get chime() { return chime; },
        get chooseAnimal() { return chooseAnimal; },
        get chooseFeature() { return chooseFeature; },
        get choosePlot() { return choosePlot; },
        get closeModal() { return closeModal; },
        get defaultCamera() { return defaultCamera; },
        get endBuild() { return endBuild; },
        get FarmExpansion() { return FarmExpansion; },
        get FarmPick() { return FarmPick; },
        get FarmProduction() { return FarmProduction; },
        get focusGarden() { return focusGarden; },
        get icon() { return icon; },
        get lifetime() { return lifetime; },
        get modalKind() { return modalKind; }, set modalKind(value) { modalKind = value; },
        get night() { return night; }, set night(value) { night = value; },
        get photo() { return photo; },
        get R() { return R; }, set R(value) { R = value; },
        get renderDetails() { return renderDetails; },
        get renderModal() { return renderModal; },
        get rotateBuild() { return rotateBuild; },
        get run() { return run; },
        get selected() { return selected; }, set selected(value) { selected = value; },
        get setTool() { return setTool; },
        get state() { return state; }, set state(value) { state = value; },
        get suppressPlotClickUntil() { return suppressPlotClickUntil; }, set suppressPlotClickUntil(value) { suppressPlotClickUntil = value; },
        get toast() { return toast; },
        get tool() { return tool; }, set tool(value) { tool = value; },
        get updateSelection() { return updateSelection; },
        get world() { return world; }, set world(value) { world = value; }
    });
    lifetime.on(document, 'click', e => { const b = e.target.closest('button'); if (!b)
        return; if (b.dataset.tool)
        setTool(b.dataset.tool); if (b.dataset.quality) {
        R.setQuality(b.dataset.quality);
        renderModal('graphics', false);
        toast('Графика: ' + F.QUALITY[R.quality].label);
    } if (b.dataset.lighting) { night=b.dataset.lighting==='evening';visualDirty=true;closeModal(); } if (b.dataset.seed) {
        seed = b.dataset.seed;
        buildSeeds();
    } if (b.hasAttribute('data-close-details')) {
        selected = null;
        renderDetails();
        updateSelection();
    } if (b.hasAttribute('data-select-plant'))
        setTool('plant'); if (b.hasAttribute('data-close-modal'))
        closeModal(); if (b.dataset.action) {
        const a = { type: b.dataset.action };
        if (b.dataset.id !== undefined)
            a.id = +b.dataset.id;
        if (b.dataset.key)
            a.key = b.dataset.key;
        if (b.dataset.qty)
            a.qty = +b.dataset.qty;
        if (b.dataset.species)
            a.species = b.dataset.species;
        run(a);
    } if (b.hasAttribute('data-open-journal'))
        renderModal('journal', false); if (b.hasAttribute('data-open-orders'))
        renderModal('orders', false); if (b.hasAttribute('data-open-people'))
        renderModal('people', false); if (b.hasAttribute('data-open-lease'))
        renderModal('lease', false); if (b.id === 'save-help')
        renderModal('help'); if (b.id === 'export-save') {
        const blob = new Blob([session.exportJSON()], { type: 'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url;
        link.download = 'quiet-valley-save.json';
        link.click();
        lifetime.timeout(() => URL.revokeObjectURL(url), 2000);
        toast('Копия сохранения подготовлена');
    } if (b.id === 'import-save')
        $('#import-file').click(); if (b.id === 'reset-save' && confirm('Начать новую ферму? Текущее локальное сохранение будет заменено. Экспортируйте копию заранее.')) {
        const result = session.reset();
        if (result.ok)
            location.reload();
        else
            toast(result.message);
    } });
    lifetime.on(document, 'change', async (e) => { if (e.target.id !== 'import-file')
        return; const file = e.target.files?.[0]; if (!file)
        return; try {
        if (file.size > 1048576)
            throw new Error('Слишком большой файл');
        const result = session.importJSON(await file.text());
        if (!result.ok)
            throw Error(result.message);
        const imported = session.snapshot();
        for (const [id, m] of art.animalModels) {
            const a = imported.animals.find(a => a.id === id);
            if (!a || a.type !== m.type) {
                m.g.visible = false;
                art.animalModels.delete(id);
                animalLabels.get(id)?.remove();
                animalLabels.delete(id);
            }
        }
        state = imported;
        endBuild();
        world.sync(state);
        defaultCamera();
        for (const a of state.animals) {
            if (!art.animalModels.has(a.id))
                art.animalModel(a);
            addAnimalLabel(a);
        }
        selected = null;
        save();
        art.updateCrops(state, gameNow());
        updateUI(true);
        updateSelection();
        renderModal('help', false);
        toast('Ферма восстановлена из копии');
    }
    catch (error) {
        toast('Не удалось импортировать сохранение: ' + error.message);
    } });
    lifetime.on(document, 'click', e => {
        const b = e.target.closest('button');
        if (!b)
            return;
        if (b.dataset.travel)
            run({ type: 'travel', region: b.dataset.travel });
        if (b.dataset.valleyTab)
            renderModal(b.dataset.valleyTab);
        if (b.dataset.place)
            startBuild(b.dataset.place);
    });
    $('#quick-map').onclick = () => renderModal('map');
    $('#open-production').onclick = () => renderModal('production');
    $('#objective-chip').onclick = () => {
        const goal=FarmProduction.nextGoal(state);
        if(goal.view==='garden'||goal.view==='water'||goal.view==='animals'){
            if(state.world.region!=='farm')run({type:'travel',region:'farm'});
            if(goal.view==='animals'){
                const a=state.animals.find(a=>a.type==='cow')||state.animals[0],m=a&&art.animalModels.get(a.id);if(m){R.camera.target=[m.g.p[0],.5,m.g.p[2]];R.camera.size=innerWidth<700?9:7;R.camera.pitch=.65;R.cameraVP();chooseAnimal(a.id);}else renderModal('shop');
            }else{focusGarden();setTool(goal.view==='water'?'water':'inspect',{applySelection:false});}
            toast(goal.detail);
        }else renderModal(goal.view);
    };
    $('#menu-toggle').onclick = () => { $('#ui').classList.toggle('menu-open'); $('#menu-toggle').setAttribute('aria-expanded', String($('#ui').classList.contains('menu-open'))); };
    $('#quick-story').onclick = () => renderModal('journal');
    $('#quick-graphics').onclick = () => renderModal('graphics');
    $('#quick-photo').onclick = photo;
    $('#quick-audio').onclick=()=>{$('#sound-toggle').click();$('#quick-audio').textContent=audioOn?'Выключить звук':'Включить звук';};
    $('#focus-animals').onclick=()=>{
        if(state.world.region!=='farm')run({type:'travel',region:'farm'});
        R.camera.target=[6,.5,-.1];R.camera.size=innerWidth<700?10.5:7.5;R.camera.pitch=.7;R.camera.yaw=.22;
        R.cameraVP();setTool('inspect',{applySelection:false});updateLabels(gameNow());
    };
    $('#open-map').onclick = () => renderModal('map');
    $('#open-land').onclick = () => renderModal('land');
    $('#open-orders').onclick = () => renderModal('orders');
    $('#open-people').onclick = () => renderModal('people');
    $('#lease-chip').onclick = () => renderModal('lease');
    $('#open-journal-inline').onclick = () => renderModal('journal');
    $('#weather-chip').onclick = () => toast(ValleyGameplay.weather(state).desc);
    $('#area-projects').onclick = () => renderModal('land');
    $('#build-finish').onclick = () => { endBuild(); setTool('inspect', { applySelection: false }); };
    $('#build-rotate').onclick = rotateBuild;
    $('#graphics-settings').onclick = () => renderModal('graphics');
    $('#open-barn').onclick = () => renderModal('barn');
    $('#open-shop').onclick = () => { if (state.world.region !== 'farm')
        run({ type: 'travel', region: 'farm' }); renderModal('shop'); };
    $('#help').onclick = () => renderModal('help');
    lifetime.on($('#modal-overlay'), 'click', e => { if (e.target === $('#modal-overlay'))
        closeModal(); });
    function photo() { $('#ui').classList.remove('menu-open'); document.body.classList.toggle('photo'); $('#photo-return').hidden = !document.body.classList.contains('photo'); }
    $('#photo-return').onclick = photo;
    const defaultCamera = () => { Object.assign(R.camera, world ? world.focusCamera(state.world.region, innerWidth < 700) : { yaw: .58, pitch: .79, size: innerWidth < 700 ? 23.4 : 14.7, target: [0, 0, -.05] }); };
    const focusGarden = () => { if (state.world.region === 'farm') {
        R.camera.yaw = .18;
        R.camera.pitch = 1.05;
        R.camera.size = innerWidth < 700 ? 11.3 : 8.6;
        R.camera.target = [-4.4, 0, .5];
    }
    else if (state.world.region === 'river') {
        R.camera.yaw = .08;
        R.camera.pitch = 1.05;
        R.camera.size = innerWidth < 700 ? 11 : 8;
        R.camera.target = [4.8, 0, 0];
    }
    else {
        defaultCamera();
        R.camera.pitch = 1.0;
        R.camera.size *= .82;
    } R.cameraVP(); updateLabels(gameNow()); };
    try {
        diagnostics?.setStage('Создание WebGL-сцены');
        R = await F.Renderer.create($('#world'), graphics);
        lifetime.own(() => R.dispose());
        lifetime.own(() => session.dispose());
        lifetime.own(() => audio?.close());
        defaultCamera();
        art = FarmArt.make(R);
        world = ValleyWorld.make(R, art);
        atmosphere = FarmAtmosphere.make(R, world, art);
        country = createCountryDetails(R,world);
        world.sync(state);
        defaultCamera();
        waterFX = FarmWater.make(R);
        state.animals.forEach(art.animalModel);
        for (let i = 0; i < 18; i++) {
            let node = R.add('sphere', [0, 0, 0], [.04, .065, .04], '#91c6cf');
            node.visible = false;
            particles.push({ node, life: 0, v: [0, 0, 0] });
        }
        for (let i = 0; i < 4; i++) {
            let n = R.add('box', [0, 0, 0], i < 2 ? [.07, .045, 2.02] : [2.02, .045, .07], '#dfc877');
            n.visible = false;
            selectors.push(n);
        }
        setupLabels();
        buildSeeds();
        input();
        art.updateCrops(state, gameNow());
        updateUI(true);
        save();
        if (!state.game.introSeen) {
            $('#intro-overlay').innerHTML = GameplayUI.intro(state);
            $('#intro-overlay').hidden = false;
        }
        let previous = performance.now(), uiAt = 0, labelAt = 0, frames = 0, started = performance.now();
        function frame(time) {
            if (diagnostics?.failed || lifetime.disposed)
                return;
            const elapsed = Math.max(0, (time - previous) / 1000);
            const dt = Math.min(.06, elapsed);
            previous = time;
            if (!document.hidden) {
                // A static backdrop behind dialogs avoids rendering a whole 3D world under a blurred sheet.
                // The deterministic simulation below still advances while the map is open.
                if (!modalKind || visualDirty || frames === 0) {
                    art.animate(time / 1000, dt, state);
                    world.animate(time / 1000, dt, state);
                    atmosphere.animate(time / 1000, dt, state);
                    country.animate(time / 1000);
                    waterFX.animate(dt);
                    for (const p of particles) {
                        if (p.life <= 0) {
                            p.node.visible = false;
                            continue;
                        }
                        p.life -= dt;
                        p.v[1] -= dt * 2.8;
                        for (let j = 0; j < 3; j++)
                            p.node.p[j] += p.v[j] * dt;
                        if (p.node.p[1] < .43)
                            p.node.visible = false;
                    }
                    const liveWeather = ValleyGameplay.weather(state, gameNow()), weatherLight = liveWeather.key === 'rain' ? .70 : liveWeather.key === 'cloud' ? .84 : 1;
                    R.day += ((night ? .20 : weatherLight) - R.day) * (1 - Math.exp(-Math.min(1, elapsed) * 1.7));
                    R.draw(time / 1000);
                    frames++;
                    visualDirty = false;
                    if (frames === 1) {
                        const error = R.gl.getError();
                        if (error !== R.gl.NO_ERROR)
                            throw Error('WebGL draw error: ' + error);
                        diagnostics?.ready();
                    }
                }
                if (!modalKind && time - labelAt > 90) {
                    updateLabels(gameNow());
                    labelAt = time;
                }
                if (time - uiAt > 700) {
                    advance();
                    art.updateCrops(state, gameNow());
                    updateUI();
                    uiAt = time;
                }
            }
            lifetime.frame(frame);
        }
        lifetime.frame(frame);
        lifetime.interval(save, 5000);
        lifetime.on(window, 'pagehide', save);
        lifetime.on(document, 'visibilitychange', () => { if (document.hidden)
            save();
        else {
            advance(true);
            art.updateCrops(state, gameNow());
            updateUI(true);
        } });
        lifetime.on(window, 'resize', () => { R.resize(); R.cameraVP(); updateLabels(gameNow()); });
        if (loadWarning)
            lifetime.timeout(() => toast(loadWarning), 450);
        window.FarmApp = { inspect: () => ({ version: '0.6.3-atelier.1', weather: ValleyGameplay.weather(state), story: ValleyGameplay.storyStatus(state), orders: state.game.orders.map(o => ({ ...o, deliverable: ValleyGameplay.canDeliver(state, o) })), world: world.inspect(), construction: { type: buildType, rotation: buildRotation }, graphics: { quality: R.quality, daylight: R.day, shadowSize: R.shadowSize, post: R.postOK, motion: R.motion, warnings: R.warnings }, waterFX: waterFX.inspect(), soilWetness: art.cropModels.map(m => m.wet), camera: { ...R.camera }, state: FarmSim.clone(state), tool, seed, selected, storageOK, saveCount, webgl: R.glVersion, shadow: R.shadowOK, meshes: R.meshes.length, drawBatches: R.batches.size, drawStats: R.drawStats, production: FarmSim.clone(state.production), persistence: store.inspect(), frames, elapsedMs: performance.now() - started }), projectPlot: (id, dx = 0, dz = 0) => { R.cameraVP(); let p = art.cropModels[id]; return R.project([p.x + dx, p.surface, p.z + dz]); }, projectWorld: (x, z) => { R.cameraVP(); return R.project([x, .25, z]); }, projectFeature: key => { const f = world.features.find(f => f.key === key); return f ? R.project(f.pos) : null; }, projectAnimal: id => { let m = art.animalModels.get(id); return m ? R.project([m.g.p[0], .8, m.g.p[2]]) : null; } };
        window.render_game_to_text = () => JSON.stringify({ coordinates: 'Y up; plots use world X/Z; screen origin top-left', ...window.FarmApp.inspect() });
    }
    catch (e) {
        console.error(e);
        diagnostics.fail(e);
    }
    return Object.freeze({ inspect: () => window.FarmApp.inspect(), dispose: () => lifetime.dispose() });
}
