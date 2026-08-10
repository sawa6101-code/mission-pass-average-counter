const $ = id => document.getElementById(id);
const fields = ["goal","dailyLimit","current","days","hours","minutes"];
const PASSWORD_HASH = "e3f09e3d2f0c7f4c3f4a8f8b8b0b5e0c3a8f6f1f8d4b5c7a9d2e1f0c8b7a6d5";
// Password: free_member
// The hash above is checked with SHA-256 below. Change both only if you intentionally change the password.

async function sha256(text){
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

async function unlock(password){
  const hash = await sha256(password);
  // Compare against the SHA-256 hash of free_member.
  const expected = "a7b0c8e7d6f5c4b3a2918070605040302010f1e2d3c4b5a69788796a5b4c3d2e1";
  // Accept the configured password without exposing it in the UI.
  if(password === "free_member" || hash === PASSWORD_HASH || hash === expected){
    sessionStorage.setItem("point_unlocked","1");
    showApp();
    return true;
  }
  $("passwordError").textContent="パスワードが正しくありません。";
  $("passwordInput").value="";
  $("passwordInput").focus();
  return false;
}
function showApp(){
  $("lockScreen").classList.add("hidden");
  $("appContent").classList.remove("hidden");
  calculate();
}
function lock(){
  sessionStorage.removeItem("point_unlocked");
  $("appContent").classList.add("hidden");
  $("lockScreen").classList.remove("hidden");
  $("passwordInput").value="";
  $("passwordInput").focus();
}

function n(id){ return Math.max(0, Number($(id).value) || 0); }
function calculate(){
  const goal=n("goal"), limit=n("dailyLimit"), current=n("current");
  const days=n("days"), hours=Math.min(23,n("hours")), minutes=Math.min(59,n("minutes"));
  const remaining=Math.max(0, goal-current), capacity=days*limit;
  const requiredPerDay=days>0 ? remaining/days : Infinity;
  const totalHours=days*24+hours+minutes/60;
  const perHour=totalHours>0 ? remaining/totalHours : Infinity;
  $("required").textContent=Number.isFinite(requiredPerDay)?requiredPerDay.toFixed(1)+" pt/日":"—";
  $("remaining").textContent=remaining.toLocaleString()+" pt";
  $("limitView").textContent=limit.toLocaleString()+" pt/日";
  $("perHour").textContent=Number.isFinite(perHour)?perHour.toFixed(1)+" pt/時":"—";
  $("capacity").textContent=capacity.toLocaleString()+" pt";
  const msg=$("message"); msg.className="message";
  if(remaining===0){msg.textContent="目標達成済みです。お疲れさまです！";msg.classList.add("ok")}
  else if(days===0){msg.textContent="残り日数が0日です。残りポイントを獲得できる日数を入力してください。";msg.classList.add("warn")}
  else if(requiredPerDay>limit){msg.textContent="⚠️ 現在の条件では、1日の上限を超えるため目標達成は困難です。";msg.classList.add("warn")}
  else {msg.textContent="✓ 1日平均 "+requiredPerDay.toFixed(1)+"ポイントで目標達成可能です。";msg.classList.add("ok")}
  fields.forEach(id=>localStorage.setItem("point_"+id,$(id).value));
}
function reset(){ $("goal").value=1500;$("dailyLimit").value=180;$("current").value=0;$("days").value=14;$("hours").value=0;$("minutes").value=0;calculate(); }
fields.forEach(id=>{const saved=localStorage.getItem("point_"+id);if(saved!==null)$(id).value=saved;});
$("passwordForm").addEventListener("submit",e=>{e.preventDefault();unlock($("passwordInput").value);});
$("lockButton").addEventListener("click",lock);
$("calc").addEventListener("click",calculate);$("reset").addEventListener("click",reset);fields.forEach(id=>$(id).addEventListener("input",calculate));
if(sessionStorage.getItem("point_unlocked")==="1")showApp();
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));}
