const PRICE=10000;
const form=document.getElementById('bookingForm');
const checkin=document.getElementById('checkin');
const checkout=document.getElementById('checkout');
const total=document.getElementById('total');
const nightsLabel=document.getElementById('nights');
const house=document.getElementById('house');
const statusEl=document.getElementById('formStatus');
const today=new Date(); today.setHours(0,0,0,0);
const iso=d=>d.toISOString().split('T')[0]; checkin.min=iso(today); checkout.min=iso(new Date(today.getTime()+86400000));
function nights(){if(!checkin.value||!checkout.value)return 1;const a=new Date(checkin.value+'T00:00:00'),b=new Date(checkout.value+'T00:00:00');return Math.max(1,Math.round((b-a)/86400000));}
function recalc(){if(checkin.value){const d=new Date(checkin.value+'T00:00:00');d.setDate(d.getDate()+1);checkout.min=iso(d);if(checkout.value<checkout.min)checkout.value=checkout.min;}const n=nights();total.textContent=(n*PRICE).toLocaleString('ru-RU')+' ₽';nightsLabel.textContent=n+' '+(n===1?'сутки':n<5?'суток':'суток');}
checkin.addEventListener('change',recalc);checkout.addEventListener('change',recalc);
document.querySelectorAll('.choose').forEach(btn=>btn.addEventListener('click',()=>{house.value=btn.dataset.house;document.getElementById('booking').scrollIntoView({behavior:'smooth'});}));
document.querySelector('.menu').addEventListener('click',()=>document.querySelector('.topbar nav').classList.toggle('open'));
form.addEventListener('submit',async e=>{e.preventDefault();recalc();const payload={house:house.value,checkin:checkin.value,checkout:checkout.value,nights:nights(),guests:document.getElementById('guests').value,name:document.getElementById('name').value.trim(),phone:document.getElementById('phone').value.trim(),comment:document.getElementById('comment').value.trim(),total:nights()*PRICE};const endpoint=window.SITE_CONFIG?.bookingEndpoint;if(!endpoint){statusEl.textContent='Форма готова. Осталось подключить Telegram-бота. Пока можно позвонить: +7 920 054-03-03.';return;}try{statusEl.textContent='Отправляем…';const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error();form.reset();recalc();statusEl.textContent='Заявка отправлена. Мы свяжемся с вами.';}catch{statusEl.textContent='Не удалось отправить заявку. Позвоните: +7 920 054-03-03.';}});
