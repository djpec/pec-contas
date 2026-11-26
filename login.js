let signedIn=false;
async function enter(session){
 if(session?.user?.id!==householdId){if(session)await database.auth.signOut({scope:'local'});return false;}
 await load();signedIn=true;document.body.classList.remove('locked');return true;
}
const resendButton=document.querySelector('#resendConfirmation');
const resendStatus=document.querySelector('#resendStatus');
let pendingEmail='';
function resetConfirmation(){
 pendingEmail='';resendButton.hidden=true;resendStatus.textContent='';
}
document.querySelector('#loginForm').elements.email.addEventListener('input',resetConfirmation);
resendButton.onclick=async()=>{
 const email=pendingEmail;
 if(!email||resendButton.disabled)return;
 resendButton.disabled=true;
 try{
  const {error}=await database.auth.resend({type:'signup',email,options:{emailRedirectTo:'https://contas.djpec.com/'}});
  if(email!==pendingEmail)return;
  if(error){resendStatus.textContent=error.status===429?'Aguarde alguns minutos antes de pedir outro link.':'Falha no reenvio. Tente novamente em alguns minutos.';return;}
  resendButton.hidden=true;
  resendStatus.textContent='Reenvio solicitado para '+email+'. Abra a mensagem mais recente, confirme o endereço e volte ao Elo.';
 }catch{if(email===pendingEmail)resendStatus.textContent='Falha de conexão. Tente novamente.'}
 finally{resendButton.disabled=false;}
};
document.querySelector('#loginForm').onsubmit=async e=>{
 e.preventDefault();const form=e.target,button=form.querySelector('button');button.disabled=true;
 resetConfirmation();const msg=document.querySelector('#loginError');msg.textContent='';
 try{const {data,error}=await database.auth.signInWithPassword({email:form.email.value.trim(),password:form.password.value});
 if(error){if(error.code==='email_not_confirmed'){pendingEmail=form.email.value.trim();resendButton.hidden=false;}msg.textContent=error.code==='email_not_confirmed'?'Confirme seu e-mail para entrar.':'Confira o e-mail e a senha e tente novamente.';return;}
 if(!await enter(data.session))msg.textContent='Esta conta não tem acesso ao Elo.';
 form.password.value='';
 }catch{msg.textContent='Não foi possível conectar. Tente novamente.'}finally{button.disabled=false}
};
document.querySelector('#logout').onclick=async()=>{await database.auth.signOut({scope:'local'});location.reload()};
database.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'&&signedIn)location.reload()});
database.auth.getSession().then(({data})=>enter(data.session)).catch(()=>document.querySelector('#loginError').textContent='Entre novamente para continuar.');
