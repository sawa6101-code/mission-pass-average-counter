const $ = id => document.getElementById(id);
const fields = ["goal","dailyLimit","current","days","hours","minutes"];
const DEFAULT_PASSWORD = "free_member";
const PASSWORD_KEY = "mission_password_hash";
const EXPIRES_KEY = "mission_password_expires";
const AUTH_KEY = "mission_authenticated";
const ADMIN_KEY = "mission_admin_authenticated";

async function sha256(text){
  const data=new TextEncoder().encode(text);
  const hash=await crypto.subtle.digest("SHA-256",data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function getPasswordHash(){
  let hash=localStorage.getItem(PASSWORD_KEY);
  if(!hash){hash=await sha256(DEFAULT_PASSWORD);localStorage.setItem(PASSWORD_KEY,hash);}
  return hash;
}
function getExpiry(){return Number(localStorage.getItem(EXPIRES_KEY)||0);}
function isPasswordExpired(){const e=getExpiry();return e>0 && Date.now()>=e;}
async function checkPassword(password){return password===password && (await sha256(password))===await getPasswordHash();}
async function unlock(password){
  if(isPasswordExpired()){$("passwordError").textContent="パスワードの有効期限が切れています。管理者画面から更新してください。";return false;}
  if(await checkPassword(password)){sessionStorage.setItem(AUTH_KEY,"1");showApp();return true;}
  $("passwordError").textContent="パスワードが正しくありません。";$("passwordInput").value="";$("passwordInput").focus();return false;
}
function showApp(){$("lockScreen").classList.add("hidden");$("appContent").classList.remove("hidden");calculate();}
function lock(){sessionStorage.removeItem(AUTH_KEY);$("appContent").classList.add("hidden");$("lockScreen").classList.remove("hidden");$("passwordInput").value="";$("passwordInput").focus();}
function showAdmin(){if(sessionStorage.getItem(ADMIN_KEY)==="1"){$("adminScreen").classList.remove("hidden");renderExpiry();}}
function closeAdmin(){$("adminScreen").classList.add("hidden");$("adminPasswordInput").value="";$("newPassword").value="";$("newPasswordConfirm").value="";$("adminError").textContent="";}
async function adminLogin(){
  const p=$("adminPasswordInput").value;
  if(await checkPassword(p)){sessionStorage.setItem(ADMIN_KEY,"1");$("adminLogin").classList.add("hidden");$("adminPanel").classList.remove("hidden");renderExpiry();}
  else{$("adminError").textContent="現在のパスワードが正しくありません。";}
}
function renderExpiry(){const e=getExpiry();$("expiryStatus").textContent=e?new Date(e).toLocaleString("ja-JP")+" まで":"無期限";}
async function changePassword(){
  const p=$("newPassword").value, c=$("newPasswordConfirm").value, days=Math.max(0,Number($("passwordDays").value)||0);
  if(p.length<4){$("adminError").textContent="新しいパスワードは4文字以上にしてください。";return;}
  if(p!==c){$("adminError").textContent="新しいパスワードが一致しません。";return;}
  localStorage.setItem(PASSWORD_KEY,await sha256(p));
  if(days>0)localStorage.setItem(EXPIRES_KEY,String(Date.now()+days*86400000));else localStorage.removeItem(EXPIRES_KEY);
  sessionStorage.removeItem(ADMIN_KEY);sessionStorage.removeItem(AUTH_KEY);
  $("adminError").textContent="パスワードを変更しました。新しいパスワードで再ログインしてください。";
  setTimeout(()=>{closeAdmin();lock();},800);
}
function n(id){return Math.max(0,Number($(id).value)||0);}
function calculate(){
  const goal=n("goal"),limit=n("dailyLimit"),current=n("current"),days=n("days"),hours=Math.min(23,n("hours")),minutes=Math.min(59,n("minutes"));
  const remaining=Math.max(0,goal-current),capacity=days*limit,requiredPerDay=days>0?remaining/days:Infinity,totalHours=days*24+hours+minutes/60,perHour=totalHours>0?remaining/totalHours:Infinity;
  $("required").textContent=Number.isFinite(requiredPerDay)?requiredPerDay.toFixed(1)+" pt/日":"—";$("remaining").textContent=remaining.toLocaleString()+" pt";$("limitView").textContent=limit.toLocaleString()+" pt/日";$("perHour").textContent=Number.isFinite(perHour)?perHour.toFixed(1)+" pt/時":"—";$("capacity").textContent=capacity.toLocaleString()+" pt";
  const msg=$("message");msg.className="message";
  if(remaining===0){msg.textContent="目標達成済みです。お疲れさまです！";msg.classList.add("ok")}else if(days===0){msg.textContent="残り日数が0日です。残りポイントを獲得できる日数を入力してください。";msg.classList.add("warn")}else if(requiredPerDay>limit){msg.textContent="⚠️ 現在の条件では、1日の上限を超えるため目標達成は困難です。";msg.classList.add("warn")}else{msg.textContent="✓ 1日平均 "+requiredPerDay.toFixed(1)+"ポイントで目標達成可能です。";msg.classList.add("ok")}
  fields.forEach(id=>localStorage.setItem("point_"+id,$(id).value));
}
function reset(){$("goal").value=1500;$('dailyLimit').value=180;$('current').value=0;$('days').value=14;$('hours').value=0;$('minutes').value=0;calculate();}
fields.forEach(id=>{const saved=localStorage.getItem("point_"+id);if(saved!==null)$(id).value=saved;});
$("passwordForm").addEventListener("submit",e=>{e.preventDefault();unlock($("passwordInput").value);});$("lockButton").addEventListener("click",lock);$("adminButton").addEventListener("click",showAdmin);$("adminClose").addEventListener("click",closeAdmin);$("adminLoginButton").addEventListener("click",adminLogin);$("changePasswordButton").addEventListener("click",changePassword);$("calc").addEventListener("click",calculate);$("reset").addEventListener("click",reset);fields.forEach(id=>$(id).addEventListener("input",calculate));
if(sessionStorage.getItem(AUTH_KEY)==="1"&&!isPasswordExpired())showApp();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
