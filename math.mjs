import {LESSON_MODES,LESSON_BANKS,makeLessonQuestion} from './lessons.mjs';
export const ar = value => String(value).replace(/\d/g, n => '٠١٢٣٤٥٦٧٨٩'[n]);
export const MODES = {
  addition: {name:'بذور الجمع', skill:'الجمع', icon:'seed', color:'mint', subtitle:'اجمعي الآحاد، ثم العشرات والمئات.', lesson:'نجمع كل منزلة مع منزلتها: الآحاد مع الآحاد، والعشرات مع العشرات، والمئات مع المئات.', example:'٢٣ + ١٤ = ٣٧', label:'جمع دون إعادة تجميع'},
  compensation: {name:'جسر التعويض', skill:'الجمع بالتعويض', icon:'bridge', color:'peach', subtitle:'اصنعي عددًا كاملًا ليسهل الجمع.', lesson:'ننقل وحدات من العدد الثاني إلى الأول ليصبح عشرة كاملة أو مئة كاملة. يزيد الأول ويقل الثاني بالمقدار نفسه، فيبقى المجموع كما هو.', example:'٢٩ + ١٦ = ٣٠ + ١٥ = ٤٥', label:'أكملي العشرة أو المئة'},
  regrouping: {name:'زهور التجميع', skill:'إعادة التجميع', icon:'flower', color:'lilac', subtitle:'كل عشرة آحاد تصبح عشرة واحدة.', lesson:'نبدأ بالآحاد. كل ١٠ آحاد نعيد تجميعها في عشرة واحدة. نضيف العشرة الجديدة إلى منزلة العشرات. وكل ١٠ عشرات تصبح مئة واحدة.', example:'٢٧ + ١٥ = ٤٢', label:'رتّبي المنازل واجمعي'},
  ...LESSON_MODES
};
export const BANKS = {
  addition: [[23,14],[42,35],[61,28],[123,214],[342,125],[506,283],[231,146],[413,252],[35,24],[72,16],[215,163],[602,175]],
  compensation: [[29,16],[38,25],[49,23],[58,34],[79,15],[98,27],[199,36],[298,45],[39,24],[68,26],[198,54],[299,62]],
  regrouping: [[27,15],[36,28],[48,37],[56,29],[67,25],[85,38],[168,257],[276,148],[458,176],[387,245],[146,237],[258,165]],
  ...LESSON_BANKS
};
export function shuffle(values, random = Math.random) {
  const list = [...values];
  for (let i=list.length-1; i>0; i--) { const j=Math.floor(random()*(i+1)); [list[i],list[j]]=[list[j],list[i]]; }
  return list;
}
export function optionsFor(correct, preferred = []) {
  const choices = new Set([correct]);
  for (const n of [...preferred,correct+1,correct-1,correct+10,correct+2,correct+20]) {
    if (Number.isInteger(n) && n>=0 && n!==correct) choices.add(n);
    if (choices.size===4) break;
  }
  return shuffle([...choices]);
}
const eq = (a,b) => `${ar(a)} + ${ar(b)}`;
export function makeQuestion(mode, pair) {
  if(LESSON_MODES[mode])return makeLessonQuestion(mode,pair,{ar,optionsFor,shuffle});
  const [a,b]=pair, sum=a+b, units=a%10+b%10, tens=Math.floor(a/10)%10+Math.floor(b/10)%10, hundreds=Math.floor(a/100)+Math.floor(b/100);
  const question={mode,a,b,sum,units,tens,hundreds,steps:[]};
  const step=(prompt,correct,hint,explanation,preferred=[])=>({prompt,correct,hint,explanation,options:optionsFor(correct,preferred)});
  if(mode==='addition') {
    question.steps=[step('ما ناتج الجمع؟',sum,`ابدئي بالآحاد: ${eq(a%10,b%10)}. ثم اجمعي العشرات، وبعدها المئات إن وجدت.`,
      `الآحاد: ${eq(a%10,b%10)} = ${ar(units)}. العشرات: ${eq(Math.floor(a/10)%10,Math.floor(b/10)%10)} = ${ar(tens)}.${a>=100||b>=100?` المئات: ${eq(Math.floor(a/100),Math.floor(b/100))} = ${ar(hundreds)}.`:''} إذن المجموع ${ar(sum)}.`,[sum+10,sum-10,sum+1])];
  } else if(mode==='compensation') {
    const round = a>=90 ? Math.ceil(a/100)*100 : Math.ceil(a/10)*10, delta=round-a, rest=b-delta;
    Object.assign(question,{round,delta,rest});
    question.steps=[
      step(`كم وحدة تنقلين من ${ar(b)} إلى ${ar(a)} ليصبح ${ar(round)}؟`,delta,`عدّي من ${ar(a)} حتى تصلي إلى ${ar(round)}.`, `ننقل ${ar(delta)} من ${ar(b)} إلى ${ar(a)}. يصبح العدد الأول ${ar(round)}.`,[delta+1,10-delta,delta+2]),
      step(`أخذنا ${ar(delta)} من ${ar(b)}. كم تبقّى من العدد الثاني؟`,rest,`اطرحي الوحدات المنقولة: ${ar(b)} − ${ar(delta)}.`, `يزيد العدد الأول ${ar(delta)}، وينقص الثاني ${ar(delta)}: ${ar(b)} − ${ar(delta)} = ${ar(rest)}. المجموع لا يتغيّر.`,[b,b+delta,rest-1]),
      step(`أصبحت المسألة ${eq(round,rest)}. ما المجموع؟`,sum,`أضيفي ${ar(rest)} إلى العدد الكامل ${ar(round)}.`, `${eq(a,b)} = ${eq(round,rest)} = ${ar(sum)}. هذا هو الجمع بالتعويض.`,[sum+delta,sum-delta,sum+10])
    ];
  } else if(mode==='regrouping') {
    const carry=Math.floor(units/10), td=tens+carry, hc=Math.floor(td/10);
    Object.assign(question,{carry,td,hc});
    question.steps=[
      step(`ابدئي بالآحاد: كم يساوي ${eq(a%10,b%10)}؟`,units,'اجمعي آحاد العددين فقط؛ لم ننتقل إلى العشرات بعد.',`مجموع الآحاد ${ar(units)}. نفكّكه إلى ${ar(carry)} عشرة و${ar(units%10)} آحاد.`,[units%10,units+1,units-1]),
      step(`لدينا ${ar(units)} آحاد. كم عشرة نعيد تجميعها؟`,carry,'كل ١٠ آحاد تساوي عشرة واحدة. احتفظي بالآحاد المتبقية في مكانها.',`نكتب ${ar(units%10)} في الآحاد، ونعيد تجميع ${ar(carry)} عشرة في منزلة العشرات.`,[0,2,units%10]),
      step(`اجمعي العشرات مع العشرة الجديدة: ${eq(Math.floor(a/10)%10,Math.floor(b/10)%10)} + ${ar(carry)}.`,td,'أضيفي العشرة الجديدة إلى عشرات العددين؛ لا تنسيها!',`مجموع العشرات ${ar(td)}.${hc?` نكتب ${ar(td%10)} في العشرات، ونعيد تجميع ${ar(hc)} مئة.`:` نكتب ${ar(td)} في العشرات.`}`,[tens,td+1,td-2]),
      step('أكملي الجمع. ما الناتج النهائي؟',sum,`الآحاد ${ar(units%10)}، والعشرات ${ar(td%10)}${a>=100||b>=100||hc?`، والمئات ${ar(hundreds+hc)}`:''}.`, `${eq(a,b)} = ${ar(sum)}.${a>=100||b>=100||hc?` المئات: ${eq(Math.floor(a/100),Math.floor(b/100))} + ${ar(hc)} = ${ar(hundreds+hc)}.`:''} أحسنتِ ترتيب المنازل!`,[sum-10,sum+10,sum-1])
    ];
  } else throw new Error('Unknown mode');
  return question;
}
export class Game {
  constructor(mode, pairs=shuffle(BANKS[mode]).slice(0,6)) {
    this.mode=mode; this.questions=pairs.map(p=>makeQuestion(mode,p)); this.index=0; this.stepIndex=0;
    this.score=0; this.wrong=0; this.firstTry=0; this.answered=0; this.status='playing'; this.usedHint=false; this.attempted=new Set(); this.roundWrong=0;
    this.maxScore=this.questions.reduce((n,q)=>n+q.steps.length*10,0);
  }
  get question(){return this.questions[this.index];}
  get step(){return this.question.steps[this.stepIndex];}
  hint(){if(this.status==='playing')this.usedHint=true;return this.step.hint;}
  answer(value){
    if(this.status!=='playing'||this.attempted.has(value)||!this.step.options.includes(value))return null;
    this.attempted.add(value);
    if(value!==this.step.correct){this.wrong++;this.roundWrong++;return {correct:false};}
    const points=this.roundWrong||this.usedHint?5:10;
    this.score+=points;this.answered++;if(!this.roundWrong)this.firstTry++;
    this.status='correct';return {correct:true,points};
  }
  next(){
    if(this.status!=='correct')return false;
    if(this.stepIndex<this.question.steps.length-1)this.stepIndex++;
    else if(this.index<this.questions.length-1){this.index++;this.stepIndex=0;}
    else{this.status='finished';return true;}
    this.status='playing';this.usedHint=false;this.attempted.clear();this.roundWrong=0;return true;
  }
}
