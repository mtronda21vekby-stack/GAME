import type {MapDef,Kind} from './types.js';
export const VERSION='1.0.0';
export const COLORS:Record<Kind,string>={cargo:'#eda84f',fishing:'#5ce0d1',ferry:'#ef8990'};
export const KINDS:Kind[]=['cargo','fishing','ferry'];
export const SHIPS:Record<Kind,{name:string;speed:number;radius:number;patience:number;reward:number}>={
 cargo:{name:'Грузовое судно',speed:1.32,radius:.6,patience:58,reward:120},
 fishing:{name:'Рыболовный катер',speed:1.78,radius:.46,patience:51,reward:95},
 ferry:{name:'Пассажирский паром',speed:1.52,radius:.56,patience:56,reward:110},
};
export const STAGES=[{name:'Утренняя вахта',ships:6,interval:10.5,weather:'clear',bonus:200},
 {name:'Час прилива',ships:8,interval:8.8,weather:'sunset',bonus:350},
 {name:'Штормовое предупреждение',ships:10,interval:7.4,weather:'storm',bonus:600}] as const;
const base:MapDef={id:0,name:'Бухта Семи огней',subtitle:'Тёплый берег · три гавани',islands:[
 {x:-10,z:-6,r:4.5,rz:3.7,type:'lighthouse'},
 {x:10,z:-6,r:3.3,rz:3.3,type:'village'},
 {x:9,z:8,r:3.1,rz:2.9,type:'forest'},
 {x:-1.5,z:3,r:1.45,rz:1.5,type:'rock'},
 {x:-11,z:9,r:2.0,rz:1.8,type:'forest'},
 {x:1,z:-11,r:1.2,rz:1.1,type:'rock'},
 ],ports:[
 {id:'cargo',name:'Торговый порт',label:'I',color:COLORS.cargo,island:0,x:-4.2,z:-4.3},
 {id:'fishing',name:'Рыбацкая пристань',label:'II',color:COLORS.fishing,island:1,x:5.0,z:-4.8},
 {id:'ferry',name:'Паромный причал',label:'III',color:COLORS.ferry,island:2,x:4.3,z:7.1},
 ],entries:[{x:-17,z:2},{x:1,z:14},{x:17,z:1},{x:-4,z:-14}]};
export const MAPS:MapDef[]=[base,
 {id:1,name:'Пролив Ласточек',subtitle:'Узкие проходы · встречные маршруты',islands:[
 {x:-10,z:-7,r:4,rz:3.3,type:'lighthouse'},{x:10,z:-7,r:3.6,rz:3.1,type:'village'},
 {x:10,z:8,r:3.6,rz:3.1,type:'forest'},{x:0,z:1,r:2.5,rz:3,type:'rock'},
 {x:-10,z:9,r:2.3,rz:2,type:'forest'},{x:1,z:-11,r:1.3,rz:1,type:'rock'}],
 ports:[{...base.ports[0]!,x:-4.7,z:-5},{...base.ports[1]!,x:4.8,z:-5.5},{...base.ports[2]!,x:4.8,z:7.4}],entries:[{x:-17,z:0},{x:0,z:14},{x:17,z:1},{x:-4,z:-14}]},
 {id:2,name:'Архипелаг Маяков',subtitle:'Открытая вода · быстрая навигация',islands:[
 {x:-11,z:-6,r:3.6,rz:3.4,type:'lighthouse'},{x:10,z:-7,r:3.1,rz:2.9,type:'village'},
 {x:9,z:9,r:3,rz:2.5,type:'forest'},{x:-3,z:3,r:1.6,rz:1.8,type:'rock'},
 {x:-11,z:9,r:2.5,rz:2,type:'forest'},{x:2,z:-6,r:1.6,rz:1.7,type:'rock'},
 {x:4,z:1,r:1.3,rz:1.2,type:'rock'}],ports:[{...base.ports[0]!,x:-6,z:-4.6},{...base.ports[1]!,x:5.4,z:-6.5},{...base.ports[2]!,x:4.6,z:8.6}],entries:[{x:-17,z:1},{x:0,z:14},{x:17,z:0},{x:-4,z:-14}]},
];
export const UPGRADE_INFO=[
 {key:'speed',title:'Морские двигатели',desc:'+12% к скорости всех судов',icon:'↗'},
 {key:'patience',title:'Надёжная радиосвязь',desc:'+20% времени на доставку',icon:'⌁'},
 {key:'focus',title:'Диспетчерский радар',desc:'Фокус восстанавливается на 7 с быстрее',icon:'◎'},
 {key:'value',title:'Выгодные контракты',desc:'+25% очков за каждую доставку',icon:'✦'},
 {key:'repair',title:'Ремонтная бригада',desc:'Восстановить одну отметку безопасности',icon:'+'},
] as const;
