/* DOM view for the production domain. This module never spends resources. */
'use strict';
export function createProductionUI(FarmSim, FarmProduction) {
  const P=FarmProduction,S=FarmSim;
  function ingredientList(state,items){return Object.entries(items).map(([key,n])=>`<span class="ingredient ${(state.inventory[key]||0)>=n?'enough':'short'}">${S.PRODUCTS[key].icon} ${S.PRODUCTS[key].name} <b>${state.inventory[key]||0}/${n}</b></span>`).join('');}
  function render(state,now=Date.now()){
    const goal=P.nextGoal(state),p=state.production;
    let html=`<button class="close" data-close-modal aria-label="Закрыть">×</button><div class="eyebrow">УРОЖАЙНАЯ МАСТЕРСКАЯ · ${goal.step} / ${goal.total}</div><h2 id="modal-title">От зерна до праздника</h2><p class="production-lead">Не спешите продавать всё. Превратите урожай в муку, хлеб и подарки для соседей.</p><div class="production-goal"><b>${goal.title}</b><small>${goal.detail}</small></div><div class="workshop-grid">`;
    for(const [key,station] of Object.entries(P.STATIONS)){
      const opened=p.stations[key],jobs=p.jobs.filter(job=>P.RECIPES[job.recipe].station===key);
      html+=`<article class="workshop ${opened?'opened':''}"><header><span>${station.icon}</span><div><h3>${station.name}</h3><small>${opened?'Открыта · '+jobs.length+'/3 в очереди':'Восстановите производство'}</small></div></header>`;
      if(!opened){const error=P.buildError(state,key);html+=`<p>${station.cost.coins} монет · ${station.cost.wood} дерева · ${station.cost.stone} камня</p><button class="primary" data-action="buildWorkshop" data-key="${key}" ${error?'disabled':''}>Открыть мастерскую</button>${error?`<small class="workshop-note">${error}</small>`:''}`;}
      else{
        for(const job of jobs){const recipe=P.RECIPES[job.recipe],ready=now>=job.readyAt;const left=Math.max(0,Math.ceil((job.readyAt-now)/1000));html+=`<div class="craft-job"><span>${S.PRODUCTS[recipe.output].icon} ${S.PRODUCTS[recipe.output].name} ×${recipe.amount}</span><button class="${ready?'primary':'secondary'}" data-action="collectCraft" data-id="${job.id}" ${ready?'':'disabled'}>${ready?'Забрать':left+' с'}</button></div>`;}
        for(const [recipeKey,recipe] of Object.entries(P.RECIPES).filter(([,r])=>r.station===key)){
          const error=P.craftError(state,recipeKey);html+=`<div class="recipe"><b>${S.PRODUCTS[recipe.output].icon} ${S.PRODUCTS[recipe.output].name} ×${recipe.amount}</b><div class="ingredients">${ingredientList(state,recipe.inputs)}</div><div class="recipe-footer"><small>${recipe.seconds} с · продажа ${S.PRODUCTS[recipe.output].price*recipe.amount} монет</small><button class="primary" data-action="craft" data-key="${recipeKey}" ${error?'disabled':''}>Готовить</button></div>${error?`<small class="workshop-note">${error}</small>`:''}</div>`;
        }
      }
      html+='</article>';
    }
    html+=`</div><section class="festival-card"><div class="eyebrow">ПРОСЬБА ЕЛЕНЫ</div><h3>${p.festivalDelivered?'Спасибо. Долина снова вместе.':'Корзина на Праздник урожая'}</h3><p>«Хлеб от Мии, конфитюр из нашего сада и тёплая ткань от Леи. Так и получается настоящий праздник».</p><div class="ingredients">${ingredientList(state,P.FESTIVAL)}</div><button class="primary" data-action="deliverFestival" ${p.festivalDelivered||!P.ingredients(state,P.FESTIVAL)?'disabled':''}>${p.festivalDelivered?'Поставка выполнена':'Доставить · 420 монет + 8 репутации'}</button></section><p class="fineprint">Очередь сохраняется. Готовая продукция не портится. Никаких платежей реальными деньгами.</p>`;
    return html;
  }
  return {render};
}
