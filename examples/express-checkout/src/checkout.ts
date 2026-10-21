import { flag } from '@flagexit/flags';
export function evaluate(order: {total:number, region:string}) {
  if (flag('express')) { return {total:order.total, delivery:order.region === 'local' ? 1 : 3}; }
  else { return {total:order.total+5, delivery:7}; }
}
