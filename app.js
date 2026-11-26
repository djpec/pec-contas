const $=s=>document.querySelector(s),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),br=v=>(v/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),today=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'}),thisMonth=today.slice(0,7);
const art={overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',list:'<path d="M5 4h14v17l-3-2-4 2-4-2-3 2zM8 8h8M8 12h6"/>',invest:'<path d="M3 19h18M5 16v-4m5 4V9m5 7v-5m5 5V5M4 8l6-4 5 3 5-5"/>',debt:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',home:'<path d="m2 11 10-8 10 8M5 10v11h14V10m-10 11v-7h6v7"/>',wallet:'<path d="M4 7V5l13-3v5M3 7h18v13H3zM21 12h-6v4h6"/>',up:'<path d="M6 17 18 5M7 5h11v11"/>',down:'<path d="M6 6l12 12M7 18h11V7"/>',user:'<circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/>',couple:'<circle cx="9" cy="8" r="3"/><path d="M2 20v-2a7 7 0 0 1 14 0v2m0-15a3 3 0 0 1 0 6m2 3q4 1 4 6"/>',asset:'<path d="m12 3 10 5-10 5L2 8zm-10 9 10 5 10-5m-20 5 10 5 10-5"/>'};
const icon=k=>'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">'+art[k]+'</svg>',pages={'Visão geral':'overview','Lançamentos':'list','Investimentos':'invest','Dívidas':'debt','Patrimônio':'asset','Nossa casa':'home'},people=['Casal','Pedro','Thaynara'],types=['Receita','Despesa','Investimento','Resgate','Dívida','Pagamento de dívida','Reserva da casa','Retirada da reserva','Bem','Saldo inicial'];
let page='Visão geral',profile='Casal',rows=[],goal=null,demo=false,ready=false,mode='',editing=null,showDemo=sessionStorage.getItem('real')!=='1';
const demoRows=[];const shift=(m,n)=>{const d=new Date(m+'-15T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,7)};
for(let i=0;i<6;i++){let m=shift(thisMonth,i-5);[['Salário de Pedro','Receita','Pedro',360000+i*9000],['Salário de Thaynara','Receita','Thaynara',305000+i*5000],['Contas da casa','Despesa','Casal',221000-i*6500],['Mercado da semana','Despesa','Thaynara',35690+i*100],['Reserva para mudança','Reserva da casa','Casal',280000],['Aporte em renda fixa','Investimento','Pedro',85000]].forEach(([name,type,person,amount],j)=>demoRows.push({id:'d'+i+j,date:m+'-'+String(Math.min(+today.slice(-2),[2,3,5,20,14,12][j])).padStart(2,'0'),name,type,person,amount}));}
const demoGoal={target:4000000,monthly:280000};
const month=()=>$('#month').value||thisMonth,source=()=>demo?demoRows:occurrences(rows,exceptions,month()),sharedGoal=()=>demo?demoGoal:goal,cutoff=()=>month()===thisMonth?today:month()+'-31';
const all=(shared=false)=>source().filter(x=>(shared||profile==='Casal'||x.person===profile)&&x.date<=cutoff()).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
const total=(arr,t)=>arr.reduce((s,x)=>s+(x.paid!==false&&x.type===t?x.amount:0),0);
function stats(arr){const t=n=>total(arr,n),invest=t('Investimento')-t('Resgate'),reserve=t('Reserva da casa')-t('Retirada da reserva'),debt=t('Dívida')-t('Pagamento de dívida'),cash=t('Saldo inicial')+t('Receita')-t('Despesa')-invest-reserve-t('Pagamento de dívida');return {invest,reserve,debt,cash,assets:t('Bem'),net:cash+invest+reserve+t('Bem')-debt};}
const titles={'Visão geral':'O dinheiro de vocês, em um só lugar.','Lançamentos':'Todas as movimentações do mês selecionado.','Investimentos':'Acompanhem os aportes e resgates de cada um.','Dívidas':'Acompanhem os valores devidos e os pagamentos.','Patrimônio':'O que vocês têm, descontando o que devem.','Nossa casa':'Planejem a reserva para a mudança de vocês.'};
function hero(){const g=sharedGoal(),r=stats(all(true)).reserve,pct=g?Math.min(100,Math.max(0,Math.floor(100*r/g.target))):0;return '<section class="hero"><img class="art" alt="" src="/casa.svg"><div class="copy"><div class="goalhead">'+icon('home')+' META DO CASAL</div><h2>Nosso primeiro lar</h2><p>'+ (g?'Cada aporte deixa a mudança mais perto.':'Definam quanto querem guardar para a mudança.')+'</p><div class="progresslabels"><span><b>'+br(r)+'</b>'+(g?' de '+br(g.target):' reservados')+'</span><b>'+pct+'%</b></div><div class="bar"><i style="width:'+pct+'%"></i></div><button class="herobutton" data-act="'+(page==='Nossa casa'?'goal':'house')+'">'+(page==='Nossa casa'?'Configurar meta':'Ver planejamento')+'</button></div></section>'}
const card=(label,v,k,foot)=>'<div class="card"><div class="metrichead"><span class="iconbox">'+icon(k)+'</span>'+label+'</div><span class="money">'+br(v)+'</span><small>'+foot+'</small></div>';
function chart(arr){let vals=Array.from({length:6},(_,i)=>{const m=shift(month(),i-5),a=arr.filter(x=>x.date.startsWith(m));return [new Date(m+'-15T12:00:00Z').toLocaleString('pt-BR',{month:'short'}).replace('.',''),total(a,'Receita'),total(a,'Despesa')]});let max=Math.max(10000,Math.ceil(Math.max(...vals.flatMap(x=>x.slice(1)))/10000)*10000);return '<section class="panel"><div class="panelhead"><h2>Fluxo de caixa</h2><small>Últimos 6 meses</small></div><div class="chart"><div class="axis"><span>'+br(max).replace(',00','')+'</span><span>R$ 0</span></div><div class="bars">'+vals.map(([m,i,o])=>'<div class="pair" title="'+m+' · Receitas '+br(i)+' · Despesas '+br(o)+'"><i style="height:'+i/max*100+'%"></i><i style="height:'+o/max*100+'%"></i><small>'+m+'</small></div>').join('')+'</div></div><div class="legend"><span><b></b>Receitas</span><span><b></b>Despesas</span></div></section>'}
function list(a,full=false){return a.length?a.map(x=>{const incoming=['Receita','Resgate','Retirada da reserva','Saldo inicial'].includes(x.type);return '<div class="row"><span class="iconbox '+(incoming?'':'out')+'">'+icon(incoming?'down':x.type==='Despesa'?'up':x.type==='Reserva da casa'?'home':'list')+'</span><div class="detail"><strong>'+esc(x.name)+(x.seriesLabel?' · '+esc(x.seriesLabel):'')+'</strong><small>'+esc(x.person)+' · '+x.date.slice(8)+'/'+x.date.slice(5,7)+(full?' · '+esc(x.type):'')+(x.paid===false?' · Pendente':'')+(full&&x.account?' · '+esc(x.account):'')+(full&&x.destination?' → '+esc(x.destination):'')+(full&&x.category?' · '+esc(x.category):'')+'</small></div><b class="'+(incoming?'positive':'')+'">'+(incoming?'+ ':['Despesa','Investimento','Reserva da casa','Pagamento de dívida'].includes(x.type)?'− ':'')+br(x.amount)+'</b>'+(full&&!demo?'<div class="actions"><button data-id="'+esc(x.id)+'">Editar</button></div>':'')+'</div>'}).join(''):'<p class="empty">Nenhum lançamento neste período.</p>'}
function render(){demo=ready&&showDemo&&!rows.length&&!goal;$('#crumb').textContent=$('#title').textContent=page;$('#who').textContent=profile;$('#sub').textContent=titles[page];$('#nav').innerHTML=Object.entries(pages).map(([n,k])=>'<button data-page="'+n+'" class="'+(page===n?'on':'')+'">'+icon(k)+n+'</button>').join('');paintProfiles();const arr=all(),a=arr.filter(x=>x.date.startsWith(month())),s=stats(arr);let h='';if(page==='Visão geral'){h=hero()+'<div class="cards">'+card('Saldo disponível',s.cash,'wallet','Acumulado até o período')+card('Receitas',total(a,'Receita'),'down','Entradas no mês')+card('Despesas',total(a,'Despesa'),'up','Saídas no mês')+card('Investimentos',s.invest,'invest','Total aplicado')+'</div><div class="grid">'+chart(arr)+'<section class="panel"><div class="panelhead"><h2>Últimos lançamentos</h2><button class="plain" data-page="Lançamentos">Ver todos</button></div>'+list(a.slice(0,3))+'</section></div>'}
else if(page==='Nossa casa'){const g=sharedGoal(),reserve=stats(all(true)).reserve,left=g?Math.max(0,g.target-reserve):0,months=g&&g.monthly?Math.ceil(left/g.monthly):0;let date=months&&months<1200?new Date(shift(month(),months)+'-15T12:00:00Z').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'';h=hero()+'<section class="panel bigpanel"><div class="panelhead"><h2>Previsão da mudança</h2></div><p>'+(g?left===0?'Vocês alcançaram o valor planejado!':g.monthly?'Com aportes de <b>'+br(g.monthly)+'</b> por mês, faltam <b>'+months+' meses</b>'+(date?' para atingir a meta em '+date:'')+'.':'Definam o aporte mensal para estimar a data da mudança.':'Configurem o custo da mudança e o aporte mensal para calcular a previsão.')+'</p><button class="herobutton" data-act="reserve">Adicionar à reserva</button></section>'}
else {let visible=source().filter(x=>(profile==='Casal'||x.person===profile)&&x.date.startsWith(month())).sort((a,b)=>b.date.localeCompare(a.date));if(page==='Investimentos'){h=card('Total aplicado',s.invest,'invest','Aportes menos resgates');visible=arr.filter(x=>['Investimento','Resgate'].includes(x.type))}if(page==='Dívidas'){h=card('Saldo devedor',s.debt,'debt','Dívidas menos pagamentos');visible=arr.filter(x=>['Dívida','Pagamento de dívida'].includes(x.type))}if(page==='Patrimônio'){h='<div class="cards">'+card('Patrimônio líquido',s.net,'asset','Ativos menos dívidas')+card('Bens',s.assets,'home','Valor cadastrado')+card('Reserva da casa',s.reserve,'wallet','Total reservado')+card('Saldo devedor',s.debt,'debt','Total pendente')+'</div>';visible=arr.filter(x=>['Bem','Saldo inicial'].includes(x.type))}h+='<section class="panel bigpanel"><div class="panelhead"><h2>'+({'Lançamentos':'Movimentações','Investimentos':'Aportes e resgates','Dívidas':'Dívidas e pagamentos','Patrimônio':'Bens e saldos iniciais'}[page])+'</h2></div>'+list(visible,true)+'</section>'}
$('#view').innerHTML=(demo?'<div class="demoline">Painel de exemplo <button class="plain" data-act="real">Começar com meus dados</button></div>':'')+h;}
function field(label,name,value='',attrs=''){return '<label>'+label+'<input name="'+name+'" value="'+esc(value)+'" '+attrs+' required></label>'}
const select=(label,n,opts,v)=>'<label>'+label+'<select name="'+n+'">'+opts.map(k=>'<option '+(k===v?'selected':'')+'>'+k+'</option>').join('')+'</select></label>';
const groups={Despesa:['Despesa','Investimento','Pagamento de dívida','Reserva da casa'],Receita:['Receita','Resgate','Dívida','Retirada da reserva','Bem','Saldo inicial'],Transferência:['Transferência']};
const accountOptions=()=>[...new Set(['Conta principal','Carteira',...rows.flatMap(x=>[x.account,x.destination]).filter(Boolean)])];
const categories=['Alimentação','Casa','Transporte','Saúde','Lazer','Salário','Educação','Investimentos','Outros'];
function inputList(label,key,options,value,placeholder){
 return '<label>'+label+'<input list="op-'+key+'" name="'+key+'" value="'+esc(value||'')+'" placeholder="'+placeholder+'" maxlength="80" '+(key==='category'?'':'required')+'><datalist id="op-'+key+'">'+options.map(v=>'<option value="'+esc(v)+'">').join('')+'</datalist></label>';
}
function changeGroup(group,type=group){
 const form=$('#form'),transfer=group==='Transferência';
 form.querySelectorAll('[data-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===group)));
 form.elements.type.innerHTML=groups[group].map(t=>'<option '+(t===type?'selected':'')+'>'+t+'</option>').join('');
 form.elements.type.closest('label').hidden=transfer;
 $('#classification').textContent=transfer?'Conta de origem':'Conta / Cartão';
 $('#destination').hidden=!transfer; form.elements.destination.disabled=!transfer;
 $('#category').hidden=transfer;form.elements.category.disabled=transfer;
 $('#paidLabel').textContent=group==='Receita'?'Lançamento recebido':transfer?'Transferência realizada':'Lançamento pago';
}
function openForm(kind='save',id=null,preset){
 if(!ready)return;
 mode=kind;editing=id;$('#error').textContent='';
 const x=id?source().find(q=>q.id===id)||{}:{},val=v=>v===undefined?'':moneyNumber.format(v/100);
 $('#formtitle').textContent=kind==='goal'?'Meta da nossa casa':id?'Editar lançamento':'Novo lançamento';
 const warning=demo?'<p class="examplehint">O primeiro registro inicia o painel de vocês.</p>':'';
 if(kind==='goal'){
 $('#fields').innerHTML=field('Meta da mudança (R$)','target',val(goal?.target),'inputmode="decimal"')+field('Aporte mensal planejado (R$)','monthly',val(goal?.monthly),'inputmode="decimal"')+warning;
 $('#formfoot').innerHTML='<button class="primary save">Salvar meta</button>';
 }else{
 const t=x.type||preset||({'Dívidas':'Dívida','Investimentos':'Investimento','Patrimônio':'Bem','Nossa casa':'Reserva da casa'}[page])||'Despesa';
 $('#fields').innerHTML='<div class="kindtabs" aria-label="Tipo de lançamento">'+Object.keys(groups).map(k=>'<button type="button" data-group="'+k+'">'+k+'</button>').join('')+'</div>'+
 field('Descrição','name',x.name||'','maxlength="100" placeholder="Adicione uma descrição para o lançamento"')+
 '<div class="twocol"><label>Valor<span class="cashinput"><span>R$</span><input name="amount" inputmode="decimal" value="'+val(x.amount)+'" required placeholder="0,00"></span></label>'+field('Data','date',x.date||today,'type="date"')+'</div>'+
 '<label class="paid"><input type="checkbox" name="paid" '+(x.paid===false?'':'checked')+'><span id="paidLabel"></span></label>'+
 '<div class="twocol">'+inputList('<span id="classification">Conta / Cartão</span>','account',accountOptions(),x.account||'Conta principal','Nome da conta')+'<div id="category">'+inputList('Categoria','category',categories,x.category,'Buscar categoria')+'</div><div id="destination">'+inputList('Conta de destino','destination',accountOptions(),x.destination,'Escolha a conta')+'</div></div>'+
 '<div class="twocol">'+select('Espaço','person',people,x.person||profile)+select('Movimentação','type',[],t)+'</div>'+
 (!id?'<label>Frequência<select name="schedule" id="schedule"><option value="once">Único</option><option value="parts">Parcelado</option><option value="monthly">Fixo mensal</option><option value="annual">Fixo anual</option></select></label><label id="partCount" hidden>Quantidade de parcelas<input type="number" name="parts" min="2" max="360" value="2"></label><small id="scheduleHint"></small>':x.series?'<small>'+esc(x.seriesLabel)+' · Alterações valem para esta ocorrência.</small><button type="button" class="plain" id="stopSeries">Encerrar daqui em diante</button>':'')+
 '<details '+(x.note?'open':'')+'><summary>Observação</summary><textarea name="note" maxlength="500" placeholder="Escreva uma observação">'+esc(x.note||'')+'</textarea></details>'+warning;
 if(!id)$('#schedule').onchange=e=>{const v=e.target.value;$('#partCount').hidden=v!=='parts';$('#form').elements.parts.disabled=v!=='parts';$('#scheduleHint').textContent=v==='parts'?'Informe o valor total da compra. O Elo divide em parcelas mensais.':v==='once'?'':'O valor se repete em cada vencimento. Os próximos ficam pendentes.'};
 if(x.series)$('#stopSeries').onclick=()=>{if(confirm('Encerrar esta e as próximas ocorrências?'))save({action:'stop',id:x.id,series:x.series,index:x.index})};
 changeGroup(Object.keys(groups).find(k=>groups[k].includes(t))||'Despesa',t);
 $('#formfoot').innerHTML=(id?'<button type="button" class="round" data-act="delete" title="Excluir lançamento" aria-label="Excluir lançamento">⌫</button>':'')+'<button class="round save confirm" title="Salvar lançamento" aria-label="Salvar lançamento"><svg viewBox="0 0 24 24"><path d="m4 13 5 5L20 6"/></svg></button><button class="round" name="another" title="Salvar e lançar outro" aria-label="Salvar e lançar outro">＋</button>';
 }
 if(!$('#modal').open)$('#modal').showModal();$('#form input:not([type=checkbox])')?.focus();
}
const parseMoney=v=>{const n=v.trim();return /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(n)?Math.round(Number(n.replaceAll('.','').replace(',','.'))*100):/^\d+\.\d{1,2}$/.test(n)?Math.round(Number(n)*100):NaN};
const moneyNumber=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
function moneyField(input){return input.matches('input[name="amount"],input[name="target"],input[name="monthly"]')}
function groupMoney(input){
 const raw=input.value, cursor=input.selectionStart;
 const stripped=raw.replace(/^\s*R\$\s*/, '').trim();
 if(!/^[\d.]*,?\d*$/.test(stripped))return;
 const [integer,decimal]=stripped.split(',');
 const digits=integer.replaceAll('.','');
 const grouped=digits.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
 const value=decimal===undefined?grouped:(grouped||'0')+','+decimal;
 if(value===raw)return;
 const remaining=raw.slice(cursor).replace(/[^\d,]/g,'').length;
 let pos=value.length, left=remaining;
 while(left>0&&pos>0){if(/[\d,]/.test(value[--pos]))left--;}
 input.value=value;input.setSelectionRange(pos,pos);
}
$('#form').addEventListener('beforeinput',event=>{
 const el=event.target;if(!moneyField(el))return;
 const start=el.selectionStart,end=el.selectionEnd;
 if(event.inputType==='insertText'&&event.data==='.'){
  event.preventDefault();el.setRangeText(',',start,end,'end');groupMoney(el);
 }else if(start===end&&event.inputType==='deleteContentBackward'&&el.value[start-1]==='.'){
  el.setSelectionRange(Math.max(0,start-2),start);
 }else if(start===end&&event.inputType==='deleteContentForward'&&el.value[start]==='.'){
  el.setSelectionRange(start,start+2);
 }
});
$('#form').addEventListener('paste',event=>{
 const el=event.target;if(!moneyField(el))return;
 const text=event.clipboardData.getData('text').trim().replace(/^R\$\s*/,'');
 if(el.selectionStart===0&&el.selectionEnd===el.value.length&&Number.isSafeInteger(parseMoney(text))){
  event.preventDefault();el.value=moneyNumber.format(parseMoney(text)/100);el.setSelectionRange(el.value.length,el.value.length);
 }
});
$('#form').addEventListener('input',event=>{if(moneyField(event.target)&&!event.isComposing)groupMoney(event.target)});
$('#form').addEventListener('focusout',event=>{
 const el=event.target;if(!moneyField(el))return;
 const cents=parseMoney(el.value.replace(/,$/,''));
 if(Number.isSafeInteger(cents))el.value=moneyNumber.format(cents/100);
});
async function load(){await readHousehold();ready=true;render()}
let busy=false;async function save(payload,another=false){if(busy)return;busy=true;$('#form .save').disabled=true;try{await writeHousehold(payload);showDemo=false;sessionStorage.setItem('real','1');await load();if(another)openForm('save');else $('#modal').close()}catch{$('#error').textContent='Não foi possível salvar. Tente novamente.'}finally{busy=false;$('#form .save').disabled=false}}
$('#form').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));for(const k of ['amount','target','monthly'])if(k in d){d[k]=parseMoney(d[k]);if(!Number.isSafeInteger(d[k])||d[k]<(k==='monthly'?0:1)){ $('#error').textContent='Informe um valor válido em reais.';return}}if(mode==='save'){if(d.schedule==='parts'){d.parts=Number(d.parts);if(!Number.isInteger(d.parts)||d.parts<2||d.parts>360||d.amount<d.parts){$('#error').textContent='Cada parcela precisa ter pelo menos um centavo.';return}}else delete d.parts;d.paid=e.target.elements.paid.checked;if(d.type==='Transferência'&&d.account.trim().toLowerCase()===d.destination.trim().toLowerCase()){$('#error').textContent='Escolha contas diferentes para origem e destino.';return;}}if(mode==='save'&&!editing)editing=crypto.randomUUID();save({...d,action:mode,id:editing},e.submitter?.name==='another')};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.group)return changeGroup(b.dataset.group);if(b.dataset.page)page=b.dataset.page;else if(b.dataset.profile)return switchSpace(b.dataset.profile);else if(b.dataset.id)return openForm('save',b.dataset.id);else switch(b.dataset.act){case 'house':page='Nossa casa';break;case 'real':showDemo=false;sessionStorage.setItem('real','1');break;case 'goal':return openForm('goal');case 'reserve':return openForm('save',null,'Reserva da casa');case 'delete':if(confirm('Excluir este lançamento?'))save({action:'delete',id:editing});return;default:return}render()});
$('#add').onclick=()=>openForm();$('#close').onclick=()=>$('#modal').close();$('#month').value=thisMonth;$('#month').onchange=render;
