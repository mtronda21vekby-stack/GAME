import type { ScheduleBlock, ScheduleId } from "./model";
export const DAY_MINUTES=1440;
export const SCHEDULE:readonly ScheduleBlock[]=[
{id:"wake",label:"Подъём",startMinute:420,endMinute:450,requiredZone:"cell"},
{id:"roll-call",label:"Перекличка",startMinute:450,endMinute:480,requiredZone:"roll-call"},
{id:"breakfast",label:"Завтрак",startMinute:480,endMinute:540,requiredZone:"canteen"},
{id:"work",label:"Рабочая смена",startMinute:540,endMinute:720,requiredZone:"workshop"},
{id:"free-time",label:"Свободное время",startMinute:720,endMinute:1080},
{id:"dinner",label:"Ужин",startMinute:1080,endMinute:1140,requiredZone:"canteen"},
{id:"free-time",label:"Вечер",startMinute:1140,endMinute:1320},
{id:"lights-out",label:"Отбой",startMinute:1320,endMinute:1440,requiredZone:"cell"},
{id:"lights-out",label:"Отбой",startMinute:0,endMinute:420,requiredZone:"cell"},
];
export function scheduleAt(minuteOfDay:number){const m=((minuteOfDay%DAY_MINUTES)+DAY_MINUTES)%DAY_MINUTES;return SCHEDULE.find(b=>m>=b.startMinute&&m<b.endMinute)??SCHEDULE[0];}
export function minutesUntilScheduleChange(minuteOfDay:number){const b=scheduleAt(minuteOfDay),m=((minuteOfDay%DAY_MINUTES)+DAY_MINUTES)%DAY_MINUTES;return b.endMinute>m?b.endMinute-m:DAY_MINUTES-m;}
export function formatClock(minuteOfDay:number){const m=((Math.floor(minuteOfDay)%DAY_MINUTES)+DAY_MINUTES)%DAY_MINUTES;return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;}
export function isSchedule(id:ScheduleId,minuteOfDay:number){return scheduleAt(minuteOfDay).id===id;}
