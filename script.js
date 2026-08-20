import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

/* ================= CONFIG ================= */
const EVENTO = {
  nomeBebe: "Matteo",
  endereco: "R Tânia, N°180 jardim Margarida, Mogi das Cruzes",
  mapsQuery: "R Tânia, N°180 jardim Margarida, Mogi das Cruzes",
};
const ADMIN_CODE = "matteo"; // troque este código antes de compartilhar o link do admin

/* ================= FIREBASE ================= */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rsvpCollection = collection(db, "matteo-rsvp");

async function saveRSVP(entry){
  try{
    await addDoc(rsvpCollection, entry);
    return true;
  }catch(e){
    console.error('Erro ao salvar no Firebase', e);
    return false;
  }
}

/* ================= DECOR (floating icons) ================= */
const ICONS = {
  cloud:`<svg width="60" height="36" viewBox="0 0 60 36" fill="none"><path d="M12 30C5 30 0 25 0 19c0-6 5-11 11-11 1 0 2 .1 3 .3C16 3.6 21.5 0 28 0c8 0 14.6 6 15.7 13.7 6.2.6 11 5.9 11 12.3 0 6.8-5.5 12-12.3 12H12Z" fill="#C9D8C2"/></svg>`,
  star:`<svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M13 0l3.2 8.9L26 13l-9.8 4.1L13 26l-3.2-8.9L0 13l9.8-4.1L13 0Z" fill="#D4B483"/></svg>`,
  heart:`<svg width="30" height="26" viewBox="0 0 30 26" fill="none"><path d="M15 26S1 17.4 1 8.7C1 3.9 4.8 0 9.4 0 12 0 14 1.2 15 3 16 1.2 18 0 20.6 0 25.2 0 29 3.9 29 8.7 29 17.4 15 26 15 26Z" fill="#8FA888"/></svg>`,
  balloonHeart:`<svg width="42" height="60" viewBox="0 0 42 60" fill="none"><path d="M21 2C10 2 3 12 3 22c0 12 9 20 18 20s18-8 18-20C39 12 32 2 21 2Z" fill="#C9D8C2"/><path d="M21 42l-3 8h6l-3-8Z" fill="#8FA888"/><line x1="21" y1="50" x2="21" y2="60" stroke="#B0A78E" stroke-width="1"/></svg>`,
};
function renderFloaters(){
  const el = document.getElementById('floaters');
  if(!el) return;
  const spots = [
    {i:'cloud', top:'4%', left:'2%', delay:'0s', size:60},
    {i:'star', top:'2%', left:'34%', delay:'.6s', size:22},
    {i:'balloonHeart', top:'10%', left:'80%', delay:'1.2s', size:44},
    {i:'star', top:'18%', left:'6%', delay:'1.8s', size:18},
    {i:'heart', top:'40%', left:'88%', delay:'.3s', size:24},
    {i:'star', top:'70%', left:'4%', delay:'.9s', size:22},
    {i:'cloud', top:'82%', left:'78%', delay:'1.5s', size:50},
    {i:'heart', top:'92%', left:'12%', delay:'.4s', size:22},
  ];
  el.innerHTML = spots.map(s=>`<div class="floater" style="top:${s.top};left:${s.left};animation-delay:${s.delay};width:${s.size}px;">${ICONS[s.i]}</div>`).join('');
}

/* ================= FORM (index.html) ================= */
function initForm(){
  document.getElementById('nomeBebeLabel').textContent = EVENTO.nomeBebe;
  document.getElementById('nomeBebeLabel2').textContent = EVENTO.nomeBebe;
  //document.getElementById('nomeBebeLabel3').textContent = EVENTO.nomeBebe;

  let selected = null;
  const choices = document.querySelectorAll('.choice');
  choices.forEach(c=>{
    c.addEventListener('click', ()=>{
      choices.forEach(x=>x.classList.remove('selected'));
      c.classList.add('selected');
      selected = c.dataset.val === 'true';
      document.getElementById('errChoice').style.display = 'none';
    });
  });

  document.getElementById('rsvpForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const obs = document.getElementById('obs').value.trim();
    let ok = true;

    if(!nome){ document.getElementById('errNome').style.display='block'; ok=false; }
    else document.getElementById('errNome').style.display='none';

    if(selected === null){ document.getElementById('errChoice').style.display='block'; ok=false; }

    if(!ok) return;

    const btn = e.target.querySelector('button[type=submit]');
    btn.textContent = 'Enviando...';
    btn.disabled = true;

    const okSave = await saveRSVP({ nome, presenca: selected, observacao: obs, data: Date.now() });

    if(okSave){
      sessionStorage.setItem('lastGuestName', nome);
      window.location.href = 'obrigado.html';
    } else {
      btn.textContent = 'Confirmar presença';
      btn.disabled = false;
      alert('Não foi possível enviar sua resposta agora. Verifique sua internet e tente de novo.');
    }
  });
}

/* ================= THANK YOU (obrigado.html) ================= */
function initObrigado(){
  const nome = sessionStorage.getItem('lastGuestName') || '';
  const msgEl = document.getElementById('thanksMsg');
  msgEl.textContent = (nome ? nome + ', s' : 'S') + 'ua resposta foi registrada com muito carinho. Mal podemos esperar para celebrar o ' + EVENTO.nomeBebe + ' com você! 💚';

  document.getElementById('enderecoTxt').textContent = EVENTO.endereco;

  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(EVENTO.mapsQuery);
  document.getElementById('mapCard').addEventListener('click', ()=> window.open(mapsUrl, '_blank'));
}

/* ================= ADMIN (admin.html) ================= */
let lastData = [];
let unsubscribe = null;

function initAdmin(){
  const unlocked = sessionStorage.getItem('matteoAdminUnlocked') === '1';
  if(unlocked){
    showAdminDashboard();
  } else {
    showAdminLock();
  }
}

function showAdminLock(){
  document.getElementById('lockScreen').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');

  const unlockBtn = document.getElementById('unlockBtn');
  const codeInput = document.getElementById('adminCode');

  unlockBtn.addEventListener('click', ()=>{
    if(codeInput.value === ADMIN_CODE){
      sessionStorage.setItem('matteoAdminUnlocked','1');
      showAdminDashboard();
    } else {
      document.getElementById('errCode').style.display='block';
    }
  });
  codeInput.addEventListener('keydown', e=>{
    if(e.key === 'Enter') unlockBtn.click();
  });
}

function showAdminDashboard(){
  document.getElementById('lockScreen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');

  document.getElementById('nomeBebeLabelAdmin').textContent = EVENTO.nomeBebe;
  document.getElementById('exportBtn').addEventListener('click', exportCSV);

  // Listener em tempo real: qualquer novo envio, de qualquer dispositivo,
  // aparece aqui automaticamente, sem precisar recarregar a página.
  const q = query(rsvpCollection, orderBy('data', 'desc'));
  if(unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(q, (snapshot)=>{
    const data = [];
    snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
    lastData = data;
    renderAdminData(data);
  }, (err)=>{
    console.error('Erro no listener do Firebase', err);
    document.getElementById('listArea').innerHTML =
      '<div class="empty-state glass">Erro ao conectar ao Firebase. Confira firebase-config.js e as regras do Firestore.</div>';
  });
}

function renderAdminData(data){
  const yes = data.filter(d=>d.presenca);
  const no = data.filter(d=>!d.presenca);

  document.getElementById('statsRow').innerHTML = `
    <div class="stat glass"><div class="n">${yes.length}</div><div class="l">Vão</div></div>
    <div class="stat glass"><div class="n">${no.length}</div><div class="l">Não vão</div></div>
    <div class="stat glass"><div class="n">${data.length}</div><div class="l">Total</div></div>`;

  document.getElementById('listArea').innerHTML = `
    <div class="list-title">💚 Vão participar (${yes.length})</div>
    ${yes.length ? yes.map(guestRow).join('') : '<div class="empty-state glass">Ninguém confirmou ainda.</div>'}
    <div class="list-title">🤍 Não vão participar (${no.length})</div>
    ${no.length ? no.map(guestRow).join('') : '<div class="empty-state glass">Nenhuma resposta ainda.</div>'}
  `;
}

function guestRow(g){
  const time = new Date(g.data).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  return `<div class="guest glass">
    <div>
      <div class="name">${escapeHtml(g.nome)}</div>
      ${g.observacao ? `<div class="obs">${escapeHtml(g.observacao)}</div>` : ''}
    </div>
    <div class="time">${time}</div>
  </div>`;
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function exportCSV(){
  if(!lastData.length){ alert('Nenhuma resposta para exportar ainda.'); return; }
  const rows = [['Nome','Presença','Observação','Data']];
  lastData.forEach(g=> rows.push([g.nome, g.presenca ? 'Sim':'Não', g.observacao||'', new Date(g.data).toLocaleString('pt-BR')]));
  const csv = rows.map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'confirmacoes-cha-do-matteo.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/* ================= AUTO-INIT POR PÁGINA ================= */
renderFloaters();
if(document.getElementById('rsvpForm')) initForm();
if(document.getElementById('thanksMsg')) initObrigado();
if(document.getElementById('lockScreen')) initAdmin();
