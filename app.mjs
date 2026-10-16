import {ar, MODES, Game} from './math.mjs';
import {mathMarkup,textMarkup} from './notation.mjs';

const $ = s => document.querySelector(s);
const main=$('#main'), KEY='hadiqat-aljam-progress-v1';
const fresh=()=>({sessions:0,total:0,completed:{},best:{},sound:false});
let storageOK=true;
function readProgress(){
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'null');
    if(!raw||typeof raw!=='object')return fresh();
    const p=fresh();
    const valid=n=>Number.isSafeInteger(n)&&n>=0;
    p.sessions=valid(raw.sessions)?raw.sessions:0;p.total=valid(raw.total)?raw.total:0;p.sound=raw.sound===true;
    for(const mode of Object.keys(MODES)){
      p.completed[mode]=valid(raw.completed?.[mode])?raw.completed[mode]:0;
      p.best[mode]=valid(raw.best?.[mode])&&raw.best[mode]<=100?raw.best[mode]:0;
    }
    return p;
  }catch{storageOK=false;return fresh();}
}
let progress=readProgress(), game=null, view='home', viewHint=false, pending=null, audioContext=null, activeGroup='place';
const GROUPS={place:{title:'الفصل الأول: القيمة المنزلية',note:'الأنماط، المنازل، المقارنة، الترتيب والتقريب'},'chapter-addition':{title:'الفصل الثاني: الجمع',note:'الخصائص، التقدير، حل المسائل وجمع الأعداد'},practice:{title:'مغامرات الجمع',note:'تدريبات الجمع والتعويض وإعادة التجميع'}};
const icon=(name)=>{
  const paths={
    seed:'<path d="M24 41V20M24 30C8 32 6 19 9 10c13-2 19 7 15 20ZM25 23C24 9 34 5 42 8c2 12-4 18-17 15Z"/>',
    bridge:'<path d="M5 35h38M9 35V21m30 14V21M7 24c10-14 24-14 34 0M15 18v17m9-20v20m9-17v17"/>',
    flower:'<path d="M24 44V26M24 37c-9 0-13-5-13-9 9-2 13 3 13 9Zm1-6c9 0 13-5 13-9-9-2-13 3-13 9Z"/><path d="M24 7c7-10 17 2 9 8 13-2 13 14 1 13 4 11-13 14-15 3-8 10-19-3-9-10C-2 15 8 4 17 12c-2-9 5-12 7-5Z" fill="currentColor" fill-opacity=".22"/><circle cx="24" cy="20" r="6" fill="#edc963" stroke="none"/>',
    sound:'<path d="m11 18 10-8v28l-10-8H5V18Zm17-3c6 5 6 13 0 18m6-24c10 8 10 22 0 30"/>',
    mute:'<path d="m11 18 10-8v28l-10-8H5V18Zm18 0 13 13m0-13L29 31"/>'
  };
  return `<svg class="${name==='sound'||name==='mute'?'icon':''}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.seed}</svg>`;
};
function flower(x,y,scale=1,color='#b7a6d5'){
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 0v85M0 55c-23 0-35-14-32-27C-12 27 0 40 0 55Zm0-17c23 0 35-14 32-27C12 10 0 24 0 38Z" fill="#7fa37b" stroke="#316f57" stroke-width="3"/><g fill="${color}" stroke="#6b608a" stroke-width="2"><ellipse cy="-18" rx="13" ry="20"/><ellipse cy="18" rx="13" ry="20"/><ellipse cx="-18" rx="20" ry="13"/><ellipse cx="18" rx="20" ry="13"/></g><circle r="13" fill="#f0cf67" stroke="#bb983c" stroke-width="2"/><path d="m-5 1 3 3 7-7" fill="none" stroke="#745e20" stroke-width="2" stroke-linecap="round"/></g>`;
}
function gardenSVG(mini=false,level=3){
  if(mini)return `<svg viewBox="0 0 240 160" role="img" aria-label="نبتة تنمو مع تقدّمك"><ellipse cx="120" cy="145" rx="76" ry="8" fill="#d4dec9"/><path d="M120 125V78m0 33c-29-1-44-18-39-33 24 0 40 14 39 33Zm0-22c24-1 39-16 35-30-22 0-36 14-35 30Z" stroke="#316f57" stroke-width="3" fill="#8eaf80"/>${level>1?flower(120,48,.65,level>3?'#dca28b':'#baabd5'):''}<path d="M88 118h64l-9 32H97Z" fill="#dba487" stroke="#9f6c51" stroke-width="2.5"/><rect x="83" y="114" width="74" height="10" rx="4" fill="#e8b799" stroke="#9f6c51" stroke-width="2.5"/><path d="m176 44 5-10 5 10 11 3-9 7 1 11-8-6-10 5 2-11-8-7Z" fill="#f2d46b"/><circle cx="61" cy="57" r="4" fill="#b5a2ce"/></svg>`;
  return `<svg viewBox="0 0 500 330" role="img" aria-label="حديقة مرسومة فيها زهور وأحواض نبات وبطاقات جمع"><path d="M76 202C35 163 48 72 112 58c49-66 133-32 173-10 80-39 156 21 149 84 65 58 4 133-65 146H140C65 273 39 230 76 202Z" fill="#edf0df"/><circle cx="395" cy="70" r="28" fill="#f2d46b"/><g stroke="#d1b657" stroke-width="2.5" stroke-linecap="round"><path d="M395 29V20m0 92v10m-41-52h-10m101 0h-10m-69-29-7-7m64 64 7 7m-7-64 7-7"/></g><path d="M65 266c108-38 259-18 375 0" fill="none" stroke="#a7bd94" stroke-width="2"/><ellipse cx="252" cy="283" rx="190" ry="17" fill="#dbe4cd"/>
  <g transform="rotate(-4 135 226)"><path d="M92 210h88l-11 66h-66Z" fill="#dfab8b" stroke="#a37458" stroke-width="2.5"/><rect x="85" y="204" width="101" height="16" rx="5" fill="#e9bb9b" stroke="#a37458" stroke-width="2.5"/><path d="M135 203v-63m0 40c-39-3-50-25-40-44 31 3 43 23 40 44Zm0-25c1-36 25-52 47-43-3 31-23 46-47 43Z" fill="#92b083" stroke="#386b50" stroke-width="3"/><path d="m114 238 12 0m-6-6v12m26-6h11" fill="none" stroke="#f9edda" stroke-width="3" stroke-linecap="round"/></g>
  <path d="M229 226h151l-14 60H243Z" fill="#6a9275" stroke="#35684d" stroke-width="2.5"/><rect x="221" y="218" width="167" height="16" rx="5" fill="#8ba58a" stroke="#35684d" stroke-width="2.5"/>${flower(266,132,.96,'#b7a6d5')}${flower(341,158,.67,'#e4a68d')}
  <g transform="rotate(9 205 104)"><rect x="165" y="68" width="70" height="53" rx="13" fill="#fffdf5" stroke="#bcc9b0" stroke-width="2"/><text x="200" y="103" text-anchor="middle" fill="#35684d" font-family="Tahoma,Arial" font-size="26" font-weight="bold">١٠</text></g><g stroke="#6d8c61" stroke-width="2.5" stroke-linecap="round"><path d="m420 196 0-12m-6 6h12M74 98v-12m-6 6h12"/></g><circle cx="407" cy="229" r="4" fill="#b6a3cd"/><circle cx="207" cy="179" r="4" fill="#dfb184"/>
  <g transform="translate(82 64) rotate(-15)"><path d="M0 0q11-19 21 0Q10 15 0 0m21 0q11-19 21 0Q31 15 21 0" fill="#d6c8e6" stroke="#8c7a9c" stroke-width="2"/><path d="M21-4v17" stroke="#6f6876" stroke-width="2" stroke-linecap="round"/></g></svg>`;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(progress));}catch{storageOK=false;}}
function setSoundButton(){const b=$('#sound');b.innerHTML=icon(progress.sound?'sound':'mute');b.setAttribute('aria-pressed',String(progress.sound));b.setAttribute('aria-label',progress.sound?'كتم الأصوات':'تشغيل الأصوات');}
function tone(success=true){
  if(!progress.sound)return;
  try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});const t=audioContext.currentTime;
    (success?[523,659,784]:[330,294]).forEach((frequency,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(0,t+i*.1);g.gain.linearRampToValueAtTime(.07,t+i*.1+.015);g.gain.exponentialRampToValueAtTime(.001,t+i*.1+.18);o.connect(g);g.connect(audioContext.destination);o.start(t+i*.1);o.stop(t+i*.1+.2);});
  }catch{/* Audio is optional. */}
}
function announce(text){$('#announcer').textContent=text;}
function focusMain(){main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
function storageWarning(){return storageOK?'':'<p class="local-warning">الحفظ غير متاح في هذا المتصفح. يمكنك اللعب الآن، وقد لا يبقى التقدّم بعد إغلاق الصفحة.</p>';}
function renderHome(){
  view='home';
  const completed=Object.keys(MODES).filter(key=>progress.completed[key]>0).length;
  const active=game&&game.status!=='finished', group=GROUPS[activeGroup];
  const modes=Object.entries(MODES).filter(([,m])=>(m.group||'practice')===activeGroup);
  const first=modes[0][0];
  main.innerHTML=`${storageWarning()}<section class="hero"><div class="hero-copy"><span class="eyebrow">مغامرة صغيرة، تعلّم كبير</span><h1>كل مسألة تحلّينها،<br>تجعل حديقتك <em>تزهر.</em></h1><p>أهلًا بكِ يا بطلة! اكتشفي الأنماط ومنازل الأعداد، وجرّبي المقارنة والتقريب والجمع… خطوة بخطوة.</p><div class="hero-actions"><button class="primary" data-action="${active?'resume':'start'}" ${active?'':`data-mode="${first}"`}>${active?'تابعي جولتك':'ابدئي المغامرة'} <span aria-hidden="true">←</span></button><button class="text-button" data-action="help">كيف ألعب؟ <span aria-hidden="true">↗</span></button></div></div><div class="garden-picture">${gardenSVG()}<span class="floating-tag tag-one">${mathMarkup('٢٧ + ١٥ = ٤٢')}</span><span class="floating-tag tag-two">${mathMarkup('٣٠ + ١٥ = ٤٥')}</span></div></section>
  <section class="stats-strip" aria-label="إنجازك في الحديقة"><div class="stat"><span class="stat-symbol" aria-hidden="true">✦</span><div><strong>${ar(progress.total)}</strong><small>نقاطك المزهرة</small></div></div><div class="stat"><span class="stat-symbol" aria-hidden="true">✓</span><div><strong>${ar(progress.sessions)}</strong><small>جولات أكملتِها</small></div></div><div class="stat"><span class="stat-symbol" aria-hidden="true">❀</span><div><strong>${ar(completed)} <span style="font-size:13px;font-weight:normal">من ${ar(Object.keys(MODES).length)}</span></strong><small>مهارات تدرّبتِ عليها</small></div></div></section>
  <section aria-labelledby="paths-title"><div class="section-heading"><h2 id="paths-title">اختاري طريقك في الحديقة</h2><p>${ar(Object.keys(MODES).length)} محطة تعلّم • ٦ مسائل في كل جولة • على مهلكِ</p></div>
  <div class="lesson-tabs" role="group" aria-label="أقسام اللعبة">${Object.entries(GROUPS).map(([key,g])=>`<button class="lesson-tab ${key===activeGroup?'selected':''}" data-action="category" data-group="${key}" aria-pressed="${key===activeGroup}">${g.title}</button>`).join('')}</div>
  <div class="chapter-heading"><h3>${group.title}</h3><p>${group.note}</p></div><div class="path-cards">${modes.map(([key,m],i)=>`<article class="path-card ${m.color} ${m.group?'lesson-card':''}"><div class="card-top"><span class="card-art">${icon(m.icon)}</span><span class="level">المحطة ${ar(i+1)}</span></div><h3>${m.name}</h3><p>${m.subtitle}</p><div class="card-equation ${m.group?'lesson-example':''}">${textMarkup(m.example)}</div><div class="card-bottom"><span>${progress.completed[key]?`أفضل إتقان: ${ar(progress.best[key])}٪`:m.label}</span><button class="card-start" data-action="start" data-mode="${key}">هيا نلعب <span aria-hidden="true">←</span></button></div></article>`).join('')}</div></section>
  <section class="bottom-note" aria-label="رسالة تشجيع"><div><strong>هنا، كل محاولة تُنبت فكرة جديدة.</strong><p>التلميح صديقتكِ، والخطأ فرصة لتفهمي أكثر. جرّبي من جديد بلا قلق.</p></div>${progress.sessions?'<button class="text-button" data-action="reset">حذف التقدّم</button>':'<span aria-hidden="true" style="font-size:25px;color:#7d9c61">❧</span>'}</section>`;
}
function renderLessonDisplay(q,complete){
  let visual='';
  if(q.expression)visual=`<div class="big-equation">${mathMarkup(complete?q.expression.replace('؟',ar(q.steps.at(-1).correct)):q.expression)}</div>`;
  else if(q.pattern){const values=[...q.pattern];if(complete)values[values.length-1]=q.steps.at(-1).correct;visual=`<div class="pattern-display">${mathMarkup(values.map(ar).join(' ← '))}</div>`;}
  else if(q.number!==undefined)visual=`<div class="big-number"><bdi dir="ltr">${ar(q.number)}</bdi></div>${q.roundUnit?`<p class="display-caption">نقرّب إلى أقرب ${q.roundUnit===10?'عشرة':q.roundUnit===100?'مئة':'ألف'}</p>`:''}`;
  else if(q.comparison)visual=`<div class="comparison-visual">${q.comparison.map((n,i)=>`<div class="number-basket"><bdi dir="ltr">${ar(n)}</bdi><small>العدد ${i?'الثاني':'الأول'}</small></div>`).join('')}</div>`;
  else if(q.numbers)visual=`<div class="number-collection">${q.numbers.map(n=>`<bdi dir="ltr">${ar(n)}</bdi>`).join('')}</div>`;
  if(q.placeBoard&&(game.stepIndex>0||game.status==='correct')){
    const labels=['الآحاد','العشرات','المئات','الألوف','عشرات الألوف'];
    visual+=`<div class="explore-places">${String(q.number).split('').reverse().map((n,i)=>`<div class="explore-cell ${i===q.power?'target':''}"><small>${labels[i]}</small><bdi dir="ltr">${ar(n)}</bdi></div>`).join('')}</div>`;
  }
  if(q.path)visual+=`<div class="learning-path">${q.path.map((name,i)=>`<span class="${i===game.stepIndex?'current':i<game.stepIndex?'complete':''}">${name}</span>`).join('')}</div>`;
  return `${q.story?`<p class="story-card">${textMarkup(q.story)}</p>`:''}${visual}`;
}
function renderVisual(q){
  if(q.mode==='addition'){
    const labels=['آحاد','عشرات','مئات'];return `<div class="place-chips" aria-label="تفكيك العدد الأول حسب المنازل">${[Math.floor(q.a/100),Math.floor(q.a/10)%10,q.a%10].map((v,i)=>`<span class="place-chip">${ar(v)} ${labels[2-i]}</span>`).join('')}</div>`;
  }
  if(q.mode==='compensation'){
    const moved=game.stepIndex>0||game.status==='correct';
    const restKnown=game.stepIndex>1||game.stepIndex===1&&game.status==='correct';
    const second=moved?(restKnown?ar(q.rest):'؟'):ar(q.b);
    return `<div class="compensation-visual" dir="rtl" aria-label="${moved?`نقلنا ${ar(q.delta)} إلى العدد الأول فأصبح ${ar(q.round)}. ${restKnown?`العدد الثاني ${ar(q.rest)}.`:'احسبي الباقي من العدد الثاني.'}`:'ننقل وحدات من العدد الثاني إلى الأول'}"><div class="number-basket">${ar(moved?q.round:q.a)}<small>العدد الأول</small></div><div class="transfer-arrow" aria-hidden="true"><small>${moved?ar(q.delta):'؟'}</small>→</div><div class="number-basket">${second}<small>العدد الثاني</small></div></div>`;
  }
  const knownUnits=game.stepIndex>=2,knownTens=game.stepIndex===3||game.stepIndex===2&&game.status==='correct';
  const finished=game.stepIndex===3&&game.status==='correct';
  const hundreds=knownTens?ar(q.hundreds+q.hc):'؟';
  const digit=(n,p)=>ar(Math.floor(n/10**p)%10);
  return `<div class="place-board" role="img" aria-label="جمع رأسي للعددين ${ar(q.a)} و${ar(q.b)}. ${knownUnits?`أعدنا تجميع عشرة، وكتبنا ${ar(q.units%10)} في الآحاد.`:''}">
    <span></span><span class="place-label">مئات</span><span class="place-label">عشرات</span><span class="place-label">آحاد</span>
    <span></span><span class="carry ${knownTens&&q.hc?'':'empty'}">${knownTens?ar(q.hc):'٠'}</span><span class="carry ${knownUnits?'':'empty'}">${ar(q.carry)}</span><span></span>
    <span></span><span>${q.a>=100?digit(q.a,2):''}</span><span>${digit(q.a,1)}</span><span>${digit(q.a,0)}</span>
    <span>+</span><span>${q.b>=100?digit(q.b,2):''}</span><span>${digit(q.b,1)}</span><span>${digit(q.b,0)}</span>
    <span class="line"></span><span class="line">${finished?(q.sum>=100?hundreds:''):q.a>=100||q.b>=100||q.hc?hundreds:''}</span><span class="line">${knownTens?ar(q.td%10):'؟'}</span><span class="line">${knownUnits?ar(q.units%10):'؟'}</span></div>`;
}
function renderGame(feedback=null){
  view='game';const q=game.question,m=MODES[game.mode],correct=game.status==='correct',totalSteps=game.maxScore/10;
  const stepProgress=Math.round(game.answered/totalSteps*100);
  const questionComplete=correct&&game.stepIndex===q.steps.length-1;
  const last=questionComplete&&game.index===game.questions.length-1;
  const buttonText=last?'شاهدي إنجازك':questionComplete?'المسألة التالية':'الخطوة التالية';
  const context=q.context||(q.type==='lesson'?'اقرئي المعطيات، ثم اختاري الإجابة المناسبة.':q.mode==='addition'?'اجمعي، ثم اختاري الإجابة الصحيحة.':q.mode==='compensation'?'ننقل وحدات، ويبقى المجموع نفسه.':'ابدئي من الآحاد، وتتبّعي العشرة الجديدة.');
  const words=game.step.options.some(n=>typeof n==='string');
  const display=q.type==='lesson'?renderLessonDisplay(q,questionComplete):`<div class="big-equation" aria-label="${ar(q.a)} زائد ${ar(q.b)} يساوي ${questionComplete?ar(q.sum):'كم'}">${mathMarkup(`${ar(q.a)} + ${ar(q.b)} = ${questionComplete?ar(q.sum):'؟'}`)}</div>${renderVisual(q)}`;
  main.innerHTML=`${storageWarning()}<div class="round-top"><div><span class="eyebrow">${m.skill}</span><h1>${m.name}</h1><p>ازرعي الفهم، واحتفلي بكل خطوة.</p></div><button class="back" data-action="home">الحديقة <span aria-hidden="true">↖</span></button></div>
    <details class="lesson-banner" ${game.index===0&&game.stepIndex===0&&!feedback?'open':''}><summary>تذكّري الفكرة قبل أن تبدئي</summary><p>${textMarkup(m.lesson)}</p><div class="math-line">${textMarkup(m.example)}</div></details>
    <div class="game-layout"><section class="question-card" aria-labelledby="question-title"><div class="q-meta"><span>المسألة ${ar(game.index+1)} من ${ar(game.questions.length)}${q.steps.length>1?` • الخطوة ${ar(game.stepIndex+1)} من ${ar(q.steps.length)}`:''}</span><span class="score-chip"><span aria-hidden="true">✦</span> ${ar(game.score)} نقطة</span></div><div class="progress-track" role="progressbar" aria-label="تقدّم الجولة" aria-valuenow="${stepProgress}" aria-valuemin="0" aria-valuemax="100" aria-valuetext="${ar(stepProgress)} بالمئة"><div class="progress-fill" style="width:${stepProgress}%"></div></div>
    <p class="q-context">${textMarkup(context)}</p>${display}
    ${q.steps.length>1?`<div class="step-dots" aria-hidden="true">${q.steps.map((_,i)=>`<span class="step-dot ${i<game.stepIndex||i===game.stepIndex&&correct?'done':''}"></span>`).join('')}</div>`:''}
    <h2 class="question-title" id="question-title">${textMarkup(game.step.prompt)}</h2><div class="options ${words?'word-options':''}" role="group" aria-labelledby="question-title">${game.step.options.map((n,i)=>{const tried=game.attempted.has(n),right=correct&&n===game.step.correct;return `<button class="answer ${typeof n==='string'?'text-answer ':''}${right?'right':tried?'wrong':''}" data-action="answer" data-value="${i}" ${tried||correct?'disabled':''} aria-label="${ar(n)}${right?'، إجابة صحيحة':tried?'، جرّبي اختيارًا آخر':''}">${textMarkup(n)}${right?'<span class="sr-only">، صحيحة</span>':''}</button>`;}).join('')}</div>
    ${viewHint?`<div class="hint-box" id="hint-text" tabindex="-1"><strong>فكّري معي:</strong> ${textMarkup(game.step.hint)}</div>`:''}
    ${!correct?`<div class="question-tools"><button class="hint-button" data-action="hint" ${viewHint?'disabled':''} aria-expanded="${viewHint}" ${viewHint?'aria-controls="hint-text"':''}><span aria-hidden="true">☀</span> ${viewHint?'التلميح معكِ':'أحتاج تلميحًا'}</button></div>`:''}
    ${correct?`<section class="feedback celebrate" tabindex="-1" id="feedback"><h3>أحسنتِ! فكرة جديدة أزهرت <span aria-hidden="true">✿</span> <span style="white-space:nowrap">${ar(feedback?.points??(game.roundWrong||game.usedHint?5:10))} نقاط إضافية</span></h3><p>${textMarkup(game.step.explanation)}</p><button class="primary" data-action="next">${buttonText} <span aria-hidden="true">←</span></button></section>`:feedback?.correct===false?'<section class="feedback error" tabindex="-1" id="feedback"><h3>محاولة جميلة… لنفكّر مرة أخرى.</h3><p>هذا الاختيار لا يناسب الخطوة. راجعي الفكرة أو استخدمي التلميح، ثم اختاري إجابة أخرى. يمكنكِ المحاولة مجددًا.</p></section>':''}
    </section><aside class="side-panel" aria-label="حديقتك في هذه الجولة"><h2>انظري كيف تنمو حديقتكِ</h2><p>كل مسألة مكتملة تُنبت زهرة.</p><div class="mini-garden">${gardenSVG(true,game.index+1+(questionComplete?1:0))}</div><div class="seeds" aria-label="${ar(game.index+(questionComplete?1:0))} مسائل مكتملة من ${ar(game.questions.length)}">${game.questions.map((_,i)=>`<span class="seed-progress ${i<game.index||i===game.index&&questionComplete?'complete':i===game.index?'current':''}" aria-hidden="true">${i<game.index||i===game.index&&questionComplete?'✿':ar(i+1)}</span>`).join('')}</div><div class="side-divider"></div><div class="tip-label">سرّ هذه المحطة</div><p>${textMarkup(m.lesson)}</p><div class="side-divider"></div><p>خذي وقتكِ. لا مؤقّت، وكل محاولة تساعدكِ على التعلّم.</p></aside></div>`;
}
function accuracy(){return Math.round(game.firstTry/game.answered*100);}
function finish(){
  progress.sessions++;progress.total+=game.score;progress.completed[game.mode]=(progress.completed[game.mode]||0)+1;
  progress.best[game.mode]=Math.max(progress.best[game.mode]||0,accuracy());save();renderResult();tone();
}
function renderResult(){
  view='result';const m=MODES[game.mode],keys=Object.keys(MODES).filter(key=>(MODES[key].group||'practice')===(m.group||'practice')),next=keys[(keys.indexOf(game.mode)+1)%keys.length];
  const note=accuracy()>=85?'فهمكِ ينمو بثبات! يمكنكِ تجربة مهارة أخرى أو جولة جديدة بمسائل متنوّعة.':'أكملتِ الجولة بإصرار! أعيدي التدريب على هذه المهارة، واقرئي تفسير كل خطوة ليصبح الحل أسهل.';
  main.innerHTML=`${storageWarning()}<section class="result"><div class="result-art celebrate">${gardenSVG(true,6)}</div><span class="eyebrow" style="justify-content:center">وسام المثابرة لكِ</span><h1>حديقتكِ أزهرت يا بطلة!</h1><p>أكملتِ ${ar(game.questions.length)} مسائل في «${m.name}». كل محاولة كانت خطوة إلى فهم أفضل.</p><div class="result-stats"><div><strong>${ar(game.score)}</strong><span>نقاط هذه الجولة</span></div><div><strong>${ar(accuracy())}٪</strong><span>إجابات من أول محاولة</span></div><div><strong>${ar(game.questions.length)}</strong><span>زهور نبتت</span></div></div><p class="result-note">${note}</p><details class="result-review"><summary>راجعي مسائل جولتكِ</summary>${game.questions.map((q,i)=>`<div class="review-row"><span>المسألة ${ar(i+1)}</span><span class="review-equation">${textMarkup(q.type==='lesson'?q.steps.at(-1).explanation:`${ar(q.a)} + ${ar(q.b)} = ${ar(q.sum)}`)}</span></div>`).join('')}</details><div class="result-actions"><button class="primary" data-action="start" data-mode="${next}">المحطة التالية <span aria-hidden="true">←</span></button><button class="secondary" data-action="start" data-mode="${game.mode}">جولة جديدة في المهارة نفسها</button><button class="text-button" data-action="home">العودة إلى الحديقة</button></div><p class="result-note">${storageOK?'حُفظ إنجازك على هذا المتصفح. يمكنكِ العودة والتدريب متى شئتِ.':'لم يتوفر الحفظ. يمكنكِ متابعة اللعب في هذه الزيارة.'}</p></section>`;
  focusMain();announce(`أكملتِ الجولة! حصلتِ على ${ar(game.score)} نقطة.`);
}
function confirmAction(title,text,callback){$('#confirm-title').textContent=title;$('#confirm-text').textContent=text;pending=callback;$('#confirm-dialog').showModal();}
function start(mode){
  if(!MODES[mode])return;
  const begin=()=>{activeGroup=MODES[mode].group||'practice';game=new Game(mode);viewHint=false;renderGame();focusMain();announce(`بدأت محطة ${MODES[mode].name}`);};
  if(game&&game.status!=='finished')confirmAction('هل تبدئين جولة جديدة؟','توجد جولة لم تكتمل. بدء جولة جديدة يلغي نقاط الجولة الحالية فقط. يمكنكِ الإلغاء والضغط على «تابعي جولتك».',begin);
  else begin();
}
document.addEventListener('click',e=>{
  const button=e.target.closest('button[data-action]');if(!button||button.disabled)return;
  const action=button.dataset.action;
  if(action==='home'){renderHome();focusMain();}
  else if(action==='start')start(button.dataset.mode);
  else if(action==='category'&&GROUPS[button.dataset.group]){activeGroup=button.dataset.group;renderHome();main.querySelector(`[data-group="${activeGroup}"]`)?.focus({preventScroll:true});}
  else if(action==='resume'&&game){renderGame();focusMain();}
  else if(action==='help')$('#help-dialog').showModal();
  else if(action==='close-help')$('#help-dialog').close();
  else if(action==='cancel'){$('#confirm-dialog').close();pending=null;}
  else if(action==='confirm'){const cb=pending;pending=null;$('#confirm-dialog').close();cb?.();}
  else if(action==='reset')confirmAction('حذف التقدّم من هذا المتصفح؟','سيُحذف رصيد النقاط والجولات المحفوظة على هذا المتصفح، وستبدأ الحديقة من جديد.',()=>{const sound=progress.sound;progress=fresh();progress.sound=sound;game=null;save();renderHome();focusMain();announce('حُذف التقدّم، ويمكنكِ البدء من جديد.');});
  else if(action==='sound'){progress.sound=!progress.sound;save();setSoundButton();if(progress.sound)tone();announce(progress.sound?'الأصوات مفعّلة':'الأصوات مكتومة');}
  else if(action==='answer'&&view==='game'){
    const result=game.answer(game.step.options[Number(button.dataset.value)]);if(!result)return;tone(result.correct);renderGame(result);
    if(result.correct){announce(`صحيحة! ${game.step.explanation}`);main.querySelector('[data-action="next"]').focus({preventScroll:true});}
    else{announce('جرّبي مرة أخرى. يمكنكِ استخدام التلميح.');main.querySelector('.answer:not(:disabled)')?.focus({preventScroll:true});}
    $('#feedback')?.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  else if(action==='hint'&&game){game.hint();viewHint=true;renderGame();announce(game.step.hint);$('#hint-text')?.focus({preventScroll:true});$('#hint-text')?.scrollIntoView({block:'nearest',behavior:'instant'});}
  else if(action==='next'&&game){game.next();viewHint=false;if(game.status==='finished')finish();else{renderGame();main.querySelector('#question-title')?.setAttribute('tabindex','-1');main.querySelector('#question-title')?.focus({preventScroll:true});main.querySelector('.question-card')?.scrollIntoView({block:'start',behavior:'instant'});announce(`المسألة ${ar(game.index+1)}، ${game.step.prompt}`);}}
});
$('#confirm-dialog').addEventListener('close',()=>{pending=null;});
setSoundButton();renderHome();
