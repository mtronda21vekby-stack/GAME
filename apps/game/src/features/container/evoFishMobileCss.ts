export const EVOFISH_MOBILE_CSS = `
html,body{overflow:hidden!important;background:#031827!important}canvas{width:100vw!important;height:100dvh!important}
#hud{left:10px!important;top:10px!important;width:132px!important;min-width:0!important;padding:8px 9px!important;border-radius:18px!important;transform:none!important;background:rgba(2,18,30,.42)!important}
#hud .row{font-size:0!important;min-height:20px!important;gap:6px!important;justify-content:flex-start!important}
#hud .row:nth-child(1)::before{content:'Lv.';font-size:12px;font-weight:900}
#hud .row:nth-child(3)::before{content:'Mass';font-size:12px;font-weight:900}
#hud .row:nth-child(5)::before{content:'DMG';font-size:12px;font-weight:900}
#hud .row:nth-child(6)::before{content:'SPD';font-size:12px;font-weight:900}
#hud .row:nth-child(1) span:last-child,#hud .row:nth-child(3) span:last-child,#hud .row:nth-child(5) span:last-child,#hud .row:nth-child(6) span:last-child{font-size:12px!important;font-weight:850!important}
#hud .row:nth-child(2),#hud .row:nth-child(4),#hud .row:nth-child(7),#hud .row:nth-child(8),#hud .row:nth-child(9){display:none!important}
.bar{height:6px!important;margin:4px 0!important}
#tips{left:12px!important;right:12px!important;bottom:18px!important;max-width:none!important;padding:10px 14px!important;border-radius:20px!important;font-size:12px!important;line-height:1.35!important;transform:none!important;background:rgba(2,16,27,.58)!important}
#dock,#shade,#drawer{display:none!important}
@media (orientation:landscape){#hud{width:112px!important;padding:6px 8px!important}#tips{left:50%!important;right:auto!important;width:min(520px,54vw)!important;bottom:10px!important;transform:translateX(-50%)!important}}
`;
