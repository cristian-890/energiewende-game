// -------------------- Firebase Setup --------------------
const firebaseConfig = {
  apiKey: "DEIN_API_KEY",
  authDomain: "DEIN_PROJECT.firebaseapp.com",
  databaseURL: "https://DEIN_PROJECT.firebaseio.com",
  projectId: "DEIN_PROJECT",
  storageBucket: "DEIN_PROJECT.appspot.com",
  messagingSenderId: "DEINE_ID",
  appId: "DEIN_APP_ID"
};
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// -------------------- Spielvariablen --------------------
const cards = [
  {word:'Balkonkraftwerk', ok:true},{word:'E-Auto', ok:true},{word:'Haus', ok:true},
  {word:'PV-Anlage', ok:true},{word:'Wärmepumpe', ok:true},{word:'Speicher', ok:true},
  {word:'Energie sparen', ok:true},{word:'Wallbox', ok:true},{word:'Hausbau', ok:true},
  {word:'Etagenheizung', ok:false},{word:'WG-Zimmer', ok:false},{word:'Mietwohnung', ok:false}
];

function shuffle(array){for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]];}return array;}

let deck=[], rightCount=0, wrongCount=0;
let playerName='', team='';
let playerRef=null;

const deckEl = document.getElementById('deck');
const feedbackEl = document.getElementById('feedback');
const rightCountEl = document.getElementById('rightCount');
const wrongCountEl = document.getElementById('wrongCount');
const leaderboardEl = document.getElementById('leaderboard');
const nameForm = document.getElementById('nameForm');
const startBtn = document.getElementById('startBtn');
const teamDisplay = document.getElementById('teamDisplay');

// -------------------- Start Button --------------------
startBtn.addEventListener('click', ()=>{
  const input = document.getElementById('playerName').value.trim();
  if(!input) return;
  playerName = input;
  team = Math.random() < 0.5 ? 'red' : 'blue';
  teamDisplay.textContent = team === 'red' ? 'Du bist im Team Rot!' : 'Du bist im Team Blau!';
  teamDisplay.style.color = team === 'red' ? '#ff1744' : '#00e6ff';
  
  // Firebase Spieler erstellen
  playerRef = db.ref('players/' + playerName);
  playerRef.set({name: playerName, team: team, right: 0, wrong: 0});

  deck = shuffle([...cards]);
  rightCount = 0;
  wrongCount = 0;
  rightCountEl.textContent = '0';
  wrongCountEl.textContent = '0';
  nameForm.style.display = 'none';
  renderDeck();
  setupLeaderboardListener();
});

// -------------------- Deck rendern --------------------
function renderDeck(){
  deckEl.innerHTML = '';
  if(deck.length === 0){
    showGameEnd();
    return;
  }
  for(let i = deck.length-1; i>=0; i--){
    const c = deck[i];
    const el = document.createElement('div');
    el.className = 'card';
    el.textContent = c.word;
    el.dataset.ok = c.ok;
    el.style.zIndex = i+1;
    el.style.transform = `scale(${1-(deck.length-1-i)*0.02}) translateY(${(deck.length-1-i)*8}px)`;
    if(i === deck.length-1) addCardInteraction(el);
    deckEl.appendChild(el);
  }
}

// -------------------- Swipe-Mechanik --------------------
function addCardInteraction(el){
  let startX=0, currentX=0, dragging=false;
  el.addEventListener('pointerdown', e=>{
    startX=e.clientX; dragging=true; el.style.transition='none';
    const moveHandler = e=>{
      if(!dragging) return;
      currentX = e.clientX - startX;
      el.style.transform = `translateX(${currentX}px) rotate(${currentX/18}deg)`;
    };
    const upHandler = e=>{
      dragging=false;
      el.releasePointerCapture(e.pointerId);
      el.style.transition='transform 220ms ease, opacity 220ms ease';
      const threshold=120;
      if(currentX > threshold) swipeCard('right');
      else if(currentX < -threshold) swipeCard('left');
      else el.style.transform='translateX(0) rotate(0)';
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', upHandler);
    };
    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', upHandler);
    el.setPointerCapture(e.pointerId);
  });
}

function swipeCard(dir){
  const top = deck[deck.length-1];
  const correct = (dir==='right' && top.ok) || (dir==='left' && !top.ok);
  if(correct){rightCount++; rightCountEl.textContent=rightCount;}
  else{wrongCount++; wrongCountEl.textContent=wrongCount;}
  showFeedback(correct);
  
  // Firebase Punkte update
  playerRef.update({right:rightCount, wrong:wrongCount});
  
  deck.pop();
  renderDeck();
}

// -------------------- Smiley Feedback --------------------
function showFeedback(correct){
  feedbackEl.textContent = correct ? '😊' : '😢';
  feedbackEl.className = 'feedback ' + (correct ? 'smile show' : 'cry show');
  setTimeout(()=>{feedbackEl.className='feedback'; feedbackEl.textContent='';},1000);
}

// -------------------- Leaderboard --------------------
function setupLeaderboardListener(){
  const leaderboardRef = db.ref('players');
  leaderboardRef.on('value', snapshot=>{
    const players = snapshot.val();
    updateLeaderboardUI(players);
  });
}

function updateLeaderboardUI(players){
  leaderboardEl.innerHTML = '';
  if(!players) return;
  const sorted = Object.values(players).sort((a,b)=> (b.right-b.wrong)-(a.right-a.wrong));
  sorted.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'player ' + p.team;
    div.textContent = `${p.name} - ✅ ${p.right} ❌ ${p.wrong}`;
    leaderboardEl.appendChild(div);
  });
}

// -------------------- Spielende --------------------
function showGameEnd(){
  const endEl = document.createElement('div');
  endEl.className='card';
  endEl.style.fontSize='36px';
  endEl.style.textAlign='center';
  endEl.style.color='#00e676';
  endEl.textContent='🎉 ENDE 🎉';
  deckEl.appendChild(endEl);

  setTimeout(()=>{
    leaderboardEl.style.position='fixed';
    leaderboardEl.style.top='50%';
    leaderboardEl.style.left='50%';
    leaderboardEl.style.transform='translate(-50%,-50%) scale(1.2)';
    leaderboardEl.style.fontSize='20px';
    // Optional: Konfetti, wenn Team gewonnen
  }, 1500);
}
