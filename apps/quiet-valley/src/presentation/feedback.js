/** presentation/feedback.js. Explicit view/interaction ports; no imported global game state. */
export function createFeedback(__qvPorts) {
function toast(msg) { __qvPorts.$('#toast').textContent = msg; __qvPorts.$('#toast').classList.add('show'); clearTimeout(__qvPorts.toastTimer); __qvPorts.toastTimer = __qvPorts.lifetime.timeout(() => __qvPorts.$('#toast').classList.remove('show'), 4200); }
function chime(effect) { if (!__qvPorts.audioOn)
    return; try {
    __qvPorts.audio = __qvPorts.audio || new (window.AudioContext || window.webkitAudioContext)();
    if (__qvPorts.audio.state === 'suspended')
        __qvPorts.audio.resume();
    const now = __qvPorts.audio.currentTime, seq = effect === 'coins' ? [523, 659, 784] : effect === 'water' ? [620, 440, 330] : effect === 'heart' ? [523, 659] : [440, 587];
    seq.forEach((hz, i) => { const o = __qvPorts.audio.createOscillator(), g = __qvPorts.audio.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(hz, now + i * .07); g.gain.setValueAtTime(.0001, now + i * .07); g.gain.exponentialRampToValueAtTime(.045, now + i * .07 + .015); g.gain.exponentialRampToValueAtTime(.0001, now + i * .07 + .30); o.connect(g); g.connect(__qvPorts.audio.destination); o.start(now + i * .07); o.stop(now + i * .07 + .31); });
}
catch (e) {
    __qvPorts.audioOn = false;
} }
function fx(point, effect) {
    const p = __qvPorts.R.project(point);
    const el = document.createElement('div');
    el.className = 'floater';
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    el.textContent = { heart: '♥', water: '💧', harvest: '✨', coins: '🪙', seed: '🌱', newAnimal: '♥' }[effect] || '✨';
    if (effect === 'heart')
        el.style.color = '#c47e79';
    __qvPorts.$('#floaters').appendChild(el);
    __qvPorts.lifetime.timeout(() => el.remove(), 1600);
    if (effect === 'water' || effect === 'harvest' || effect === 'seed')
        for (let i = 0; i < __qvPorts.particles.length; i++) {
            let q = __qvPorts.particles[i];
            q.life = .6 + Math.random() * .45;
            q.node.visible = true;
            q.node.p = [point[0] + (Math.random() - .5) * .7, point[1] + .45, point[2] + (Math.random() - .5) * .7];
            q.v = [(Math.random() - .5) * 1.4, effect === 'water' ? -1 : 1 + Math.random(), (Math.random() - .5) * 1.4];
            q.node.c = __qvPorts.F.rgb(effect === 'water' ? '#8acbcc' : effect === 'seed' ? '#a9ba68' : '#e2c573');
        }
}
return {toast,chime,fx};
}
