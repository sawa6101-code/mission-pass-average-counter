const $ = id => document.getElementById(id);
const fields = ["goal","dailyLimit","current","days","hours","minutes"];
function n(id){ return Math.max(0, Number($(id).value) || 0); }
function calculate(){
  const goal=n("goal"), limit=n("dailyLimit"), current=n("current");
  const days=n("days"), hours=Math.min(23,n("hours")), minutes=Math.min(59,n("minutes"));
  const remaining=Math.max(0, goal-current);
  const capacity=days*limit;
  const requiredPerDay=days>0 ? remaining/days : Infinity;
  const totalHours=days*24+hours+minutes/60;
  const perHour=totalHours>0 ? remaining/totalHours : Infinity;
  $("required").textContent = Number.isFinite(requiredPerDay) ? requiredPerDay.toFixed(1)+" pt/日" : "—";
  $("remaining").textContent = remaining.toLocaleString()+" pt";
  $("limitView").textContent = limit.toLocaleString()+" pt/日";
  $("perHour").textContent = Number.isFinite(perHour) ? perHour.toFixed(1)+" pt/時" : "—";
  $("capacity").textContent = capacity.toLocaleString()+" pt";
  const msg=$("message"); msg.className="message";
  if(remaining===0){msg.textContent="目標達成済みです。お疲れさまです！";msg.classList.add("ok")}
  else if(days===0){msg.textContent="残り日数が0日です。残りポイントを獲得できる日数を入力してください。";msg.classList.add("warn")}
  else if(requiredPerDay>limit){msg.textContent="⚠️ 現在の条件では、1日の上限を超えるため目標達成は困難です。";msg.classList.add("warn")}
  else {msg.textContent="✓ 1日平均 "+requiredPerDay.toFixed(1)+"ポイントで目標達成可能です。";msg.classList.add("ok")}
  fields.forEach(id=>localStorage.setItem("point_"+id,$(id).value));
}
function reset(){ $("goal").value=1500;$("dailyLimit").value=180;$("current").value=0;$("days").value=14;$("hours").value=0;$("minutes").value=0;calculate(); }
fields.forEach(id=>{const saved=localStorage.getItem("point_"+id);if(saved!==null)$(id).value=saved;});
$("calc").addEventListener("click",calculate);$("reset").addEventListener("click",reset);fields.forEach(id=>$(id).addEventListener("input",calculate));calculate();
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));}
