/** input/controls.js. Explicit view/interaction ports; no imported global game state. */
export function createControls(__qvPorts) {
function input() {
    const canvas = __qvPorts.$('#world'), pointers = new Map();
    let down = null, lastPinch = 0, lastCenter = null, multi = false, dragged = false, brush = false;
    const visited = new Set();
    const local = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const pick = (x, y, touch = false) => __qvPorts.FarmPick.plotAt(__qvPorts.R, __qvPorts.art.cropModels.filter(m => m.region === __qvPorts.state.world.region && (m.region !== 'river' || __qvPorts.FarmExpansion.level(__qvPorts.state, 'river_fields'))), x, y, touch ? 8 : 4);
    const paint = id => { if (id === null || visited.has(id) || !__qvPorts.state.plots[id]?.unlocked)
        return; visited.add(id); __qvPorts.choosePlot(id); };
    function tapAt(x, y, touch) {
        if (__qvPorts.tool === 'inspect' && __qvPorts.state.world.region === 'farm') {
            for (const v of __qvPorts.art.villagers || []) {
                const q = __qvPorts.R.project([v.g.p[0], 1.15, v.g.p[2]]);
                if (Math.hypot(q.x - x, q.y - y) < 22) {
                    __qvPorts.renderModal('people');
                    return;
                }
            }
            for (const station of Object.values(__qvPorts.FarmProduction.STATIONS)) {
                const q = __qvPorts.R.project([station.at[0], 1.2, station.at[1]]);
                if (Math.hypot(q.x - x, q.y - y) < 21) {
                    __qvPorts.renderModal('production');
                    return;
                }
            }
        }
        if (__qvPorts.buildType) {
            const p = __qvPorts.R.ground(x, y, .25), cx = Math.round(p[0] / 2) * 2, cz = Math.round(p[2] / 2) * 2;
            if (__qvPorts.buildType === 'remove') {
                const item = __qvPorts.state.world.decor.find(d => d.region === __qvPorts.state.world.region && d.x === cx && d.z === cz);
                if (item)
                    __qvPorts.run({ type: 'removeDecor', id: item.id });
                else
                    __qvPorts.toast('Нажмите на нижнюю часть своего украшения.');
            }
            else
                __qvPorts.run({ type: 'placeDecor', region: __qvPorts.state.world.region, key: __qvPorts.buildType, x: cx, z: cz, rotation: __qvPorts.buildRotation });
            return;
        }
        const id = pick(x, y, touch);
        if (__qvPorts.tool !== 'inspect' && id !== null) {
            __qvPorts.choosePlot(id);
            return;
        }
        let closest = null;
        for (const a of __qvPorts.state.world.region === 'farm' ? __qvPorts.state.animals : []) {
            const m = __qvPorts.art.animalModels.get(a.id);
            if (!m)
                continue;
            const q = __qvPorts.R.project([m.g.p[0], .8, m.g.p[2]]), d = Math.hypot(q.x - x, q.y - y);
            if (d < (touch ? 24 : 22) && (!closest || d < closest.d))
                closest = { id: a.id, d };
        }
        if (closest) {
            __qvPorts.chooseAnimal(closest.id);
            return;
        }
        if (id !== null) {
            __qvPorts.choosePlot(id, {direct:true});
            return;
        }
        let nearest = null;
        for (const f of __qvPorts.world.features) {
            if (!__qvPorts.world.featureVisible(f, __qvPorts.state))
                continue;
            const q = __qvPorts.R.project([f.pos[0], f.kind === 'tree' ? 1.2 : .6, f.pos[2]]), d = Math.hypot(q.x - x, q.y - y);
            if (d < (touch ? 28 : 23) && (!nearest || d < nearest.d))
                nearest = { f, d };
        }
        if (nearest) {
            __qvPorts.chooseFeature(nearest.f.key);
            return;
        }
        const g = __qvPorts.R.ground(x, y);
        if (__qvPorts.state.world.region === 'farm' && Math.hypot(g[0] + 5.2, g[2] - 7.1) < 2.3)
            __qvPorts.renderModal('barn');
        else {
            __qvPorts.selected = null;
            __qvPorts.renderDetails();
            __qvPorts.updateSelection();
            if (__qvPorts.tool === 'water')
                __qvPorts.toast('Нажмите на грядку. Кнопка «Огород» приблизит посадки.');
        }
    }
    __qvPorts.lifetime.on(document, 'pointerdown', e => {
        const target = e.target.closest?.('#world, .world-label[data-plot]');
        if (!target || __qvPorts.modalKind || !__qvPorts.$('#intro-overlay').hidden || e.button > 0)
            return;
        const pt = local(e);
        pointers.set(e.pointerId, pt);
        try {
            target.setPointerCapture(e.pointerId);
        }
        catch (_) { }
        if (pointers.size === 1) {
            if (target === canvas)
                canvas.focus({ preventScroll: true });
            const label = target.dataset.plot;
            down = { ...pt, lx: pt.x, ly: pt.y, touch: e.pointerType !== 'mouse', label: label !== undefined, plot: label !== undefined ? +label : pick(pt.x, pt.y, e.pointerType !== 'mouse') };
            dragged = false;
            multi = false;
            brush = false;
            visited.clear();
        }
        else {
            multi = true;
            dragged = true;
            const a = [...pointers.values()];
            lastPinch = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
            lastCenter = { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
        }
    });
    __qvPorts.lifetime.on(document, 'pointermove', e => {
        if (__qvPorts.buildType && e.target === canvas) {
            const point = local(e), g = __qvPorts.R.ground(point.x, point.y, .25);
            __qvPorts.world.preview(Math.round(g[0] / 2) * 2, Math.round(g[2] / 2) * 2, __qvPorts.state);
        }
        if (!pointers.has(e.pointerId) || !down)
            return;
        const pt = local(e);
        pointers.set(e.pointerId, pt);
        if (pointers.size >= 2) {
            const a = [...pointers.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
            if (lastPinch > 0 && d > 0)
                __qvPorts.R.camera.size = Math.max(6.5, Math.min(43, __qvPorts.R.camera.size * lastPinch / d));
            const center = { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
            if (lastCenter) {
                __qvPorts.R.cameraVP();
                const before = __qvPorts.R.ground(lastCenter.x, lastCenter.y, .25), after = __qvPorts.R.ground(center.x, center.y, .25);
                __qvPorts.R.camera.target[0] = Math.max(-12, Math.min(12, __qvPorts.R.camera.target[0] + before[0] - after[0]));
                __qvPorts.R.camera.target[2] = Math.max(-10, Math.min(10, __qvPorts.R.camera.target[2] + before[2] - after[2]));
            }
            lastCenter = center;
            lastPinch = d;
            multi = true;
            return;
        }
        if (multi)
            return;
        const dx = pt.x - down.lx, dy = pt.y - down.ly;
        if (Math.hypot(pt.x - down.x, pt.y - down.y) > (down.touch ? 11 : 6)) {
            dragged = true;
            if (__qvPorts.tool === 'water' && down.plot !== null)
                brush = true;
        }
        if (dragged) {
            if (brush) {
                paint(down.plot);
                paint(pick(pt.x, pt.y, down.touch));
            }
            else {
                __qvPorts.R.camera.yaw -= dx * .006;
                __qvPorts.R.camera.pitch = Math.max(.40, Math.min(1.28, __qvPorts.R.camera.pitch + dy * .004));
            }
            if (e.cancelable)
                e.preventDefault();
        }
        down.lx = pt.x;
        down.ly = pt.y;
    }, { passive: false });
    function finish(e, cancel = false) {
        if (!pointers.has(e.pointerId))
            return;
        const pt = local(e);
        pointers.delete(e.pointerId);
        if (dragged || multi || cancel)
            __qvPorts.suppressPlotClickUntil = performance.now() + 500;
        if (!cancel && !multi && !dragged && down && !down.label)
            tapAt(pt.x, pt.y, down.touch);
        if (!pointers.size) {
            down = null;
            lastPinch = 0;
            lastCenter = null;
            visited.clear();
            brush = false;
        }
    }
    __qvPorts.lifetime.on(document, 'pointerup', e => finish(e));
    __qvPorts.lifetime.on(document, 'pointercancel', e => finish(e, true));
    __qvPorts.lifetime.on(document, 'lostpointercapture', e => { if (pointers.has(e.pointerId))
        finish(e, true); });
    __qvPorts.lifetime.on(window, 'blur', () => { pointers.clear(); down = null; multi = false; });
    __qvPorts.lifetime.on(canvas, 'wheel', e => { e.preventDefault(); __qvPorts.R.camera.size = Math.max(6.5, Math.min(43, __qvPorts.R.camera.size * Math.exp(e.deltaY * .001))); }, { passive: false });
    __qvPorts.lifetime.on(canvas, 'contextmenu', e => e.preventDefault());
    __qvPorts.$('#focus-garden').onclick = __qvPorts.focusGarden;
    __qvPorts.$('#zoom-in').onclick = () => __qvPorts.R.camera.size = Math.max(6.5, __qvPorts.R.camera.size / 1.18);
    __qvPorts.$('#zoom-out').onclick = () => __qvPorts.R.camera.size = Math.min(43, __qvPorts.R.camera.size * 1.18);
    __qvPorts.$('#home-camera').onclick = __qvPorts.defaultCamera;
    __qvPorts.$('#day-toggle').onclick = () => { __qvPorts.night = !__qvPorts.night; __qvPorts.$('#day-toggle').innerHTML = __qvPorts.icon(__qvPorts.night ? 'moon' : 'sun'); document.body.style.background = __qvPorts.night ? 'radial-gradient(ellipse at 40% 25%,#abb5ad,#8eaaa1 65%,#7b9a96)' : ''; };
    __qvPorts.$('#sound-toggle').onclick = () => { __qvPorts.audioOn = !__qvPorts.audioOn; __qvPorts.$('#sound-toggle').innerHTML = __qvPorts.icon(__qvPorts.audioOn ? 'sound' : 'muted'); __qvPorts.$('#sound-toggle').setAttribute('aria-label', __qvPorts.audioOn ? 'Выключить звук' : 'Включить звук'); __qvPorts.chime('heart'); };
    __qvPorts.lifetime.on(document, 'keydown', e => { if (e.key === 'Escape') {
        if (__qvPorts.buildType) {
            __qvPorts.endBuild();
            __qvPorts.setTool('inspect', { applySelection: false });
            return;
        }
        if (__qvPorts.modalKind)
            __qvPorts.closeModal();
        else {
            __qvPorts.selected = null;
            __qvPorts.renderDetails();
            __qvPorts.updateSelection();
        }
        return;
    } if (__qvPorts.modalKind) {
        if (e.key === 'Tab') {
            const focusable = [...__qvPorts.$('#modal').querySelectorAll('button:not(:disabled),a,input')];
            let first = focusable[0], last = focusable.at(-1);
            if (e.shiftKey && (document.activeElement === first || document.activeElement === __qvPorts.$('#modal'))) {
                e.preventDefault();
                last?.focus();
            }
            else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
            }
        }
        return;
    } if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey)
        return; if ('1234'.includes(e.key) && e.key.length === 1)
        __qvPorts.setTool(['inspect', 'plant', 'water', 'harvest'][+e.key - 1]); if (e.key.toLowerCase() === 'm')
        __qvPorts.renderModal('map'); if (e.key.toLowerCase() === 'u')
        __qvPorts.renderModal('land'); if (e.key.toLowerCase() === 'r' && __qvPorts.buildType)
        __qvPorts.rotateBuild(); if (e.key.toLowerCase() === 'b')
        __qvPorts.renderModal('barn'); if (e.key.toLowerCase() === 'h')
        __qvPorts.photo(); if (e.key === 'ArrowLeft')
        __qvPorts.R.camera.yaw -= .12; if (e.key === 'ArrowRight')
        __qvPorts.R.camera.yaw += .12; });
}
return {input};
}
