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

class EnergyGame {
  constructor() {
    this.correctWords = [
      'Balkonkraftwerk', 'E-Auto', 'Haus', 'PV-Anlage', 'Wärmepumpe', 
      'Speicher', 'Energie sparen', 'Wallbox', 'Hausbau'
    ];
    this.wrongWords = ['Etagenheizung', 'WG-Zimmer', 'Mietwohnung'];
    
    this.allWords = [...this.correctWords, ...this.wrongWords];
    this.shuffledWords = [];
    this.currentWordIndex = 0;
    
    this.players = new Map();
    this.currentPlayer = null;
    this.gameEnded = false;
    
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    
    this.init();
  }
  
  init() {
    this.shuffleWords();
    this.setupEventListeners();
    this.loadPlayersFromStorage();
  }
  
  shuffleWords() {
    this.shuffledWords = [...this.allWords].sort(() => Math.random() - 0.5);
  }
  
  setupEventListeners() {
    // Name input
    const nameInput = document.getElementById('playerName');
    const startBtn = document.getElementById('startGame');
    
    nameInput.addEventListener('input', () => {
      startBtn.disabled = nameInput.value.trim().length === 0;
    });
    
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && nameInput.value.trim()) {
        this.startGame();
      }
    });
    
    startBtn.addEventListener('click', () => this.startGame());
    
    // Card interactions
    const card = document.getElementById('gameCard');
    
    // Mouse events
    card.addEventListener('mousedown', (e) => this.handleStart(e));
    document.addEventListener('mousemove', (e) => this.handleMove(e));
    document.addEventListener('mouseup', (e) => this.handleEnd(e));
    
    // Touch events
    card.addEventListener('touchstart', (e) => this.handleStart(e.touches[0]));
    document.addEventListener('touchmove', (e) => this.handleMove(e.touches[0]));
    document.addEventListener('touchend', (e) => this.handleEnd(e.changedTouches[0]));
    
    // Prevent default touch behaviors
    card.addEventListener('touchstart', (e) => e.preventDefault());
    document.addEventListener('touchmove', (e) => {
      if (this.isDragging) e.preventDefault();
    }, { passive: false });
  }
  
  loadPlayersFromStorage() {
    const stored = localStorage.getItem('energyGamePlayers');
    if (stored) {
      const playersData = JSON.parse(stored);
      playersData.forEach(player => {
        this.players.set(player.name, player);
      });
    }
  }
  
  savePlayersToStorage() {
    const playersArray = Array.from(this.players.values());
    localStorage.setItem('energyGamePlayers', JSON.stringify(playersArray));
  }
  
  startGame() {
    const nameInput = document.getElementById('playerName');
    const playerName = nameInput.value.trim();
    
    if (!playerName) return;
    
    // Create or get player
    if (!this.players.has(playerName)) {
      const team = this.players.size % 2 === 0 ? 'red' : 'blue';
      this.players.set(playerName, {
        name: playerName,
        team: team,
        correct: 0,
        wrong: 0,
        score: 0
      });
    }
    
    this.currentPlayer = this.players.get(playerName);
    this.savePlayersToStorage();
    
    // Update UI
    this.updatePlayerDisplay();
    this.updateCounters();
    this.updateLeaderboard();
    
    // Show first card
    this.showCurrentCard();
    
    // Switch to game screen
    this.switchScreen('gameScreen');
  }
  
  updatePlayerDisplay() {
    const playerDisplay = document.getElementById('playerDisplay');
    playerDisplay.textContent = this.currentPlayer.name;
    playerDisplay.className = `player-name team-${this.currentPlayer.team}`;
  }
  
  updateCounters() {
    document.getElementById('correctCount').textContent = this.currentPlayer.correct;
    document.getElementById('wrongCount').textContent = this.currentPlayer.wrong;
  }
  
  updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    const players = Array.from(this.players.values())
      .sort((a, b) => b.score - a.score);
    
    leaderboardList.innerHTML = players.map(player => `
      <div class="leaderboard-item">
        <span class="leaderboard-name team-${player.team}">${player.name}</span>
        <span class="leaderboard-score">${player.score}</span>
      </div>
    `).join('');
  }
  
  showCurrentCard() {
    if (this.currentWordIndex >= this.shuffledWords.length) {
      this.endGame();
      return;
    }
    
    const cardText = document.getElementById('cardText');
    cardText.textContent = this.shuffledWords[this.currentWordIndex];
    
    const card = document.getElementById('gameCard');
    card.style.transform = 'translateX(0) rotate(0deg)';
    card.style.opacity = '1';
  }
  
  handleStart(e) {
    if (this.gameEnded) return;
    
    this.isDragging = true;
    this.startX = e.clientX || e.pageX;
    this.startY = e.clientY || e.pageY;
    
    const card = document.getElementById('gameCard');
    card.classList.add('swiping');
  }
  
  handleMove(e) {
    if (!this.isDragging || this.gameEnded) return;
    
    this.currentX = (e.clientX || e.pageX) - this.startX;
    this.currentY = (e.clientY || e.pageY) - this.startY;
    
    const card = document.getElementById('gameCard');
    const rotation = this.currentX * 0.1;
    
    card.style.transform = `translateX(${this.currentX}px) translateY(${this.currentY}px) rotate(${rotation}deg)`;
    card.style.opacity = Math.max(0.3, 1 - Math.abs(this.currentX) / 300);
    
    // Highlight fixed symbols
    const leftSymbol = document.querySelector('.fixed-symbol.left');
    const rightSymbol = document.querySelector('.fixed-symbol.right');
    
    leftSymbol.classList.toggle('highlight', this.currentX < -50);
    rightSymbol.classList.toggle('highlight', this.currentX > 50);
  }
  
  handleEnd(e) {
    if (!this.isDragging || this.gameEnded) return;
    
    this.isDragging = false;
    
    const card = document.getElementById('gameCard');
    card.classList.remove('swiping');
    
    // Clear symbol highlights
    document.querySelectorAll('.fixed-symbol').forEach(symbol => {
      symbol.classList.remove('highlight');
    });
    
    const threshold = 100;
    
    if (Math.abs(this.currentX) > threshold) {
      const isSwipeRight = this.currentX > 0;
      this.processSwipe(isSwipeRight);
    } else {
      // Snap back
      card.style.transform = 'translateX(0) translateY(0) rotate(0deg)';
      card.style.opacity = '1';
    }
  }
  
  processSwipe(isSwipeRight) {
    const currentWord = this.shuffledWords[this.currentWordIndex];
    const isCorrectWord = this.correctWords.includes(currentWord);
    const isCorrectAnswer = (isSwipeRight && isCorrectWord) || (!isSwipeRight && !isCorrectWord);
    
    // Update player stats
    if (isCorrectAnswer) {
      this.currentPlayer.correct++;
    } else {
      this.currentPlayer.wrong++;
    }
    
    this.currentPlayer.score = this.currentPlayer.correct - this.currentPlayer.wrong;
    this.savePlayersToStorage();
    
    // Show feedback
    this.showFeedback(isCorrectAnswer);
    
    // Animate card out
    this.animateCardOut(isSwipeRight);
    
    // Update UI
    this.updateCounters();
    this.updateLeaderboard();
    
    // Next card
    this.currentWordIndex++;
    
    setTimeout(() => {
      this.showCurrentCard();
    }, 1000);
  }
  
  showFeedback(isCorrect) {
    const feedback = document.getElementById('feedbackSmiley');
    feedback.textContent = isCorrect ? '😊' : '😢';
    feedback.className = `feedback-smiley ${isCorrect ? 'correct' : 'wrong'} show`;
    
    setTimeout(() => {
      feedback.classList.remove('show');
    }, 1000);
  }
  
  animateCardOut(isSwipeRight) {
    const card = document.getElementById('gameCard');
    const direction = isSwipeRight ? 1 : -1;
    
    card.style.transform = `translateX(${direction * 1000}px) rotate(${direction * 30}deg)`;
    card.style.opacity = '0';
  }
  
  endGame() {
    this.gameEnded = true;
    
    setTimeout(() => {
      this.switchScreen('endScreen');
      this.showFinalResults();
    }, 500);
  }
  
  showFinalResults() {
    const finalLeaderboardList = document.getElementById('finalLeaderboardList');
    const players = Array.from(this.players.values())
      .sort((a, b) => b.score - a.score);
    
    finalLeaderboardList.innerHTML = players.map((player, index) => `
      <div class="leaderboard-item">
        <span class="leaderboard-name team-${player.team}">
          ${index + 1}. ${player.name}
        </span>
        <span class="leaderboard-score">${player.score}</span>
      </div>
    `).join('');
    
    // Determine winning team
    const teamScores = { red: 0, blue: 0 };
    players.forEach(player => {
      teamScores[player.team] += player.score;
    });
    
    const winnerAnnouncement = document.getElementById('winnerAnnouncement');
    const currentPlayerTeam = this.currentPlayer.team;
    
    if (teamScores.red > teamScores.blue) {
      winnerAnnouncement.textContent = 'Team Rot gewinnt!';
      winnerAnnouncement.className = 'winner-announcement team-red';
      if (currentPlayerTeam === 'red') {
        this.startConfetti();
      }
    } else if (teamScores.blue > teamScores.red) {
      winnerAnnouncement.textContent = 'Team Blau gewinnt!';
      winnerAnnouncement.className = 'winner-announcement team-blue';
      if (currentPlayerTeam === 'blue') {
        this.startConfetti();
      }
    } else {
      winnerAnnouncement.textContent = 'Unentschieden!';
      winnerAnnouncement.className = 'winner-announcement';
    }
  }
  
  startConfetti() {
    const canvas = document.getElementById('confetti');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confettiPieces = [];
    const colors = ['#ff0055', '#00aaff', '#00ff88', '#ffaa00', '#ff5500'];
    
    // Create confetti pieces
    for (let i = 0; i < 150; i++) {
      confettiPieces.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }
    
    function animateConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      confettiPieces.forEach((piece, index) => {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.rotationSpeed;
        piece.vy += 0.1; // gravity
        
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation * Math.PI / 180);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.size/2, -piece.size/2, piece.size, piece.size);
        ctx.restore();
        
        // Remove pieces that are off screen
        if (piece.y > canvas.height + 10) {
          confettiPieces.splice(index, 1);
        }
      });
      
      if (confettiPieces.length > 0) {
        requestAnimationFrame(animateConfetti);
      }
    }
    
    animateConfetti();
  }
  
  switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    
    document.getElementById(screenId).classList.add('active');
  }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new EnergyGame();
});
