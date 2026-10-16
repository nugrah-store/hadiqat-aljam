import {ar} from './math.mjs';
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Logical reading order is right-to-left; each numeral keeps its own digit order.
export function mathMarkup(expression){
  const tokens=ar(expression).trim().split(/\s*([+−=≈←])\s*/).filter(Boolean);
  return `<span class="math-expression" dir="rtl">${tokens.map(t=>`<bdi dir="ltr" class="${/^[+−=≈←]$/.test(t)?'math-symbol':t==='؟'?'math-number unknown':'math-number'}">${escape(t)}</bdi>`).join('')}</span>`;
}
export function textMarkup(text){
  const parts=ar(text).split(/([٠-٩؟]+(?:\s*[+−=≈←]\s*[٠-٩؟]+)+)/g);
  return parts.map((part,i)=>i%2?mathMarkup(part):escape(part)).join('');
}
