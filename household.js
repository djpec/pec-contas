const database=supabase.createClient('https://qmhyeotvbktdilrudwys.supabase.co','sb_publishable_Yin9aHOMDRYJ0PsuMloVlQ_q8M7iReT');
const householdId='83aa1cee-9917-4e21-9c37-e80c33f99738';
let profileSettings={},exceptions=[],photoDraft='',photoJob=0;
async function readHousehold(){
 const records=[];
 for(let start=0;;start+=500){
  const {data,error}=await database.from('elo_records').select('id,kind,data').order('id').range(start,start+499);
  if(error)throw error;
  records.push(...data);if(data.length<500)break;
 }
 rows=records.filter(x=>x.kind==='entry').map(x=>({...x.data,id:x.id}));
 exceptions=records.filter(x=>x.kind==='skip').map(x=>x.data);
 goal=records.find(x=>x.kind==='goal')?.data||null;
 profileSettings=Object.fromEntries(records.filter(x=>x.kind==='profile').map(x=>[x.data.person,x.data]));
}
async function writeRecord(id,kind,data){
 const {error}=await database.from('elo_records').upsert({id,kind,data},{onConflict:'user_id,id'});
 if(error)throw error;
}
async function writeHousehold(x){
 if(x.action==='goal')return writeRecord('goal','goal',{target:x.target,monthly:x.monthly});
 if(x.action==='profile')return writeRecord('profile-'+x.person,'profile',{person:x.person,color:x.color,photo:x.photo});
 if(x.action==='stop')return writeRecord('stop-'+x.id,'skip',{series:x.series,index:x.index,stop:true});
 if(x.action==='delete'){
  if(x.id.includes('~'))return writeRecord(x.id,'skip',{id:x.id});
  const {error}=await database.from('elo_records').delete().eq('id',x.id);if(error)throw error;return;
 }
 const {action,...data}=x;
 await writeRecord(x.id,'entry',data);
}
function occurrences(records,skips,period){
 const overrides=new Map(records.filter(x=>x.id.includes('~')).map(x=>[x.id,x]));
 const omitted=new Set(skips.map(x=>x.id));
 const result=[];
 for(const x of records){
  if(x.id.includes('~'))continue;
  if(!x.schedule||x.schedule==='once'){result.push(x);continue;}
  const [year,m,day]=x.date.split('-').map(Number),[ey,em]=period.split('-').map(Number);
  const step=x.schedule==='annual'?12:1;
  // Also resolve edited occurrences that moved into an earlier month.
  const changed=[...overrides.keys()].filter(k=>k.startsWith(x.id+'~')).map(k=>Number(k.split('~')[1]));
  const max=Math.min(x.schedule==='parts'?x.parts-1:Infinity,Math.max(Math.floor(((ey-year)*12+em-m)/step),...changed),...skips.filter(s=>s.stop&&s.series===x.id).map(s=>s.index-1));
  for(let i=0;i<=max;i++){
   const id=x.id+'~'+i;if(omitted.has(id))continue;
   const end=new Date(Date.UTC(year,m-1+i*step+1,0));
   end.setUTCDate(Math.min(day,end.getUTCDate()));
   const amount=x.schedule==='parts'?Math.floor(x.amount/x.parts)+(i<x.amount%x.parts?1:0):x.amount;
   result.push({...x,amount,date:end.toISOString().slice(0,10),paid:i===0&&x.paid!==false,...overrides.get(id),id,series:x.id,index:i,seriesLabel:x.schedule==='parts'?'Parcela '+(i+1)+'/'+x.parts:x.schedule==='annual'?'Fixo anual':'Fixo mensal'});
  }
 }
 return result;
}
function profileColor(name, settings=profileSettings[name]||{}){
 if(/^#[0-9a-f]{6}$/i.test(settings.color))return settings.color;
 return {Pedro:'#65876b',Thaynara:'#b67e69',Casal:'#29573f'}[name];
}
function foreground(color){
 const [r,g,b]=color.slice(1).match(/../g).map(hex=>{
  const c=parseInt(hex,16)/255;
  return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;
 });
 return 0.2126*r+0.7152*g+0.0722*b>0.179?'#000':'#fff';
}
function avatar(name,settings=profileSettings[name]||{}){
 const col=profileColor(name,settings);
 const img=/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(settings.photo||'')?'<img src="'+settings.photo+'" alt="">':'';
 return '<i class="personpic" style="--person:'+col+';--initial:'+foreground(col)+'">'+(img||name[0])+'</i>';
}
function profileBadge(name){
 return name==='Casal'?'<span class="couple-badge">'+avatar('Pedro')+avatar('Thaynara')+'</span>':avatar(name);
}
function paintProfiles(){
 const color=profileColor(profile);
 document.body.dataset.theme=profile;
 document.body.style.setProperty('--profile-accent',color);
 document.body.style.setProperty('--profile-foreground',foreground(color));
 document.querySelectorAll('.avatars').forEach(el=>el.innerHTML=avatar('Pedro')+avatar('Thaynara'));
 $('#spaceBadge').innerHTML=profileBadge(profile);
 $('#spaceName').textContent=profile;
 $('#chooseSpace').setAttribute('aria-label','Trocar perfil. Espaço atual: '+profile);
 $('#profiles').innerHTML=people.map(name=>{
  const selected=name===profile;
  return '<button type="button" data-profile="'+name+'" aria-pressed="'+selected+'" style="--option-color:'+profileColor(name)+'">'+profileBadge(name)+'<strong>'+name+'</strong><span class="choice-check" aria-hidden="true">'+(selected?'✓':'')+'</span></button>';
 }).join('');
}
const spaceDialog=$('#spaceDialog');
$('#chooseSpace').onclick=()=>{
 spaceDialog.showModal();
 spaceDialog.querySelector('[aria-pressed="true"]').focus();
};
$('#closeSpace').onclick=()=>spaceDialog.close();
$('#customProfile').onclick=()=>{
 spaceDialog.close();
 showProfile(profile==='Thaynara'?'Thaynara':'Pedro');
};
function switchSpace(next){
 spaceDialog.close();
 if(!people.includes(next)||next===profile)return;
 profile=next;
 render();
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  $('#view').animate([{opacity:0.35,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'});
 }
}
function showProfile(name){
 if(!ready)return;
 const settings=profileSettings[name]||{},dlg=$('#personal');
 photoDraft=settings.photo||'';photoJob++;
 $('#personName').value=name;$('#color').value=profileColor(name,settings);$('#photo').value='';$('#profileError').textContent='';$('#saveProfile').disabled=false;
 previewPhoto();if(!dlg.open)dlg.showModal();
}
function previewPhoto(){$('#photoPreview').innerHTML=avatar($('#personName').value,{color:$('#color').value,photo:photoDraft});}
$('#personName').onchange=e=>showProfile(e.target.value);
$('#color').oninput=previewPhoto;
$('#removePhoto').onclick=()=>{photoJob++;photoDraft='';$('#photo').value='';$('#saveProfile').disabled=false;previewPhoto()};
$('#photo').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 const ticket=++photoJob;$('#saveProfile').disabled=true;
 try{
 if(file.size>12*1024*1024)throw Error('Escolha uma foto de até 12 MB.');
 const img=await createImageBitmap(file);const c=document.createElement('canvas');c.width=c.height=192;
 const size=Math.min(img.width,img.height);c.getContext('2d').drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,192,192);img.close();
 if(ticket===photoJob){photoDraft=c.toDataURL('image/jpeg',0.85);previewPhoto();$('#profileError').textContent='';}
 }catch{if(ticket===photoJob)$('#profileError').textContent='Escolha uma imagem JPG, PNG ou WebP de até 12 MB.'}
 finally{if(ticket===photoJob)$('#saveProfile').disabled=false;}
};
$('#personalForm').onsubmit=async e=>{e.preventDefault();$('#saveProfile').disabled=true;try{await writeHousehold({action:'profile',person:$('#personName').value,color:$('#color').value,photo:photoDraft});await load();$('#personal').close()}catch{$('#profileError').textContent='Falha ao salvar o perfil. Tente novamente.'}finally{$('#saveProfile').disabled=false}};
