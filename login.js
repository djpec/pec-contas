let signedIn=false;
async function enter(session){
 if(session?.user?.id!==householdId){if(session)await database.auth.signOut({scope:'local'});return false;}
 await load();signedIn=true;document.body.classList.remove('locked');return true;
}
document.querySelector('#loginForm').onsubmit=async e=>{
 e.preventDefault();const form=e.target,button=form.querySelector('button');button.disabled=true;
 const msg=document.querySelector('#loginError');msg.textContent='';
 try{const {data,error}=await database.auth.signInWithPassword({email:form.email.value.trim(),password:form.password.value});
 if(error){msg.textContent=error.code==='email_not_confirmed'?'Confirme seu e-mail para entrar.':'Confira o e-mail e a senha e tente novamente.';return;}
 if(!await enter(data.session))msg.textContent='Esta conta não tem acesso ao Elo.';
 form.password.value='';
 }catch{msg.textContent='Não foi possível conectar. Tente novamente.'}finally{button.disabled=false}
};
document.querySelector('#logout').onclick=async()=>{await database.auth.signOut({scope:'local'});location.reload()};
database.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'&&signedIn)location.reload()});
database.auth.getSession().then(({data})=>enter(data.session)).catch(()=>document.querySelector('#loginError').textContent='Entre novamente para continuar.');
