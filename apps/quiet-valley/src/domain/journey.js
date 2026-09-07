/** First-session guidance and market reserves, derived from saveable state.
 * Guidance never locks other activities or creates a second reward ledger. */
export function marketReserves(state) {
  const reserved={wheat:3};
  for(const order of state.game.orders)for(const [key,amount] of Object.entries(order.items))reserved[key]=(reserved[key]||0)+amount;
  return reserved;
}
export function surplus(state,products) {
  const reserved=marketReserves(state),items={};let total=0;
  for(const [key,product] of Object.entries(products)){
    const count=Math.max(0,(state.inventory[key]||0)-(reserved[key]||0));
    if(count){items[key]=count;total+=count*product.price;}
  }
  return {items,total,reserved};
}
export function nextFarmGoal(state,productionGoal) {
  const goal=(title,detail,view,step)=>({title,detail,view,step,total:5,phase:'first-morning'});
  if(!state.stats.harvests)return goal('Соберите первый урожай','Нажмите на спелую морковь — без лишних меню','garden',1);
  if(!state.stats.waters&&state.plots.some(p=>p.unlocked&&p.crop&&!p.waterAt))return goal('Дайте растениям воды','Коснитесь сухой грядки или проведите лейкой по огороду','water',2);
  if(!state.stats.feeds)return goal('Познакомьтесь с Милкой','Погладьте корову и угостите пшеницей','animals',3);
  if(!state.game.ordersCompleted)return goal('Первая доставка Мии','Оставьте продукты для заказа: оплата выше обычной продажи','orders',4);
  if(state.stats.harvests<3)return goal('Подготовьте новый урожай','Сажайте пшеницу: она нужна пекарне и животным','garden',5);
  return {...productionGoal,view:'production',phase:'workshops'};
}
