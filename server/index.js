// Serveur WebSocket pour monde partagé de créatures
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 3001 });

// --- État du monde partagé ---
const world = {
  creatures: [], // Liste des créatures
  tiles: [],    // Liste des tuiles
  messages: [], // Liste des messages utilisateurs
  fountains: [], // Liste des fontaines
  pinkTrees: [], // Liste des arbres roses
};

// --- Création initiale des tuiles ---
const ISLAND_RADIUS = 20;
for (let x = -ISLAND_RADIUS; x <= ISLAND_RADIUS; x++) {
  for (let y = -ISLAND_RADIUS; y <= ISLAND_RADIUS; y++) {
    const distance = Math.sqrt(x * x + y * y);
    if (distance <= ISLAND_RADIUS) {
      world.tiles.push({
        x,
        y,
        type: 'grass',
        height: Math.random() * 0.5
      });
    }
  }
}

// --- Création initiale des créatures ---
const CREATURE_COUNT = 5;

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function generateRandomColor() {
  const colors = [
    '#ff9f43', // Orange
    '#ff6b6b', // Rouge
    '#48dbfb', // Bleu clair
    '#1dd1a1', // Vert
    '#f368e0', // Rose
    '#54a0ff', // Bleu
    '#5f27cd', // Violet
    '#ff9ff3', // Rose clair
    '#00d2d3', // Turquoise
    '#c8d6e5'  // Gris clair
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createCreature() {
  const angle = Math.random() * Math.PI * 2;
  const distance = randomInRange(2, ISLAND_RADIUS - 2);
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  const patterns = ['default', 'striped'];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  
  // Générer des pixels aléatoires pour le corps
  const pixels = [];
  const numPixels = Math.floor(Math.random() * 5) + 3; // Entre 3 et 7 pixels
  for (let i = 0; i < numPixels; i++) {
    pixels.push({
      x: Math.floor(Math.random() * 8), // 8 positions possibles en x
      y: Math.floor(Math.random() * 8), // 8 positions possibles en y
      color: generateRandomColor() // Couleur aléatoire pour chaque pixel
    });
  }

  return {
    id: uuidv4(),
    x,
    y,
    targetX: x,
    targetY: y,
    state: 0, // Idle
    direction: Math.floor(Math.random() * 8),
    animation: {},
    bubble: '',
    color: generateRandomColor(),
    pattern,
    pixels // Ajouter les pixels au corps de la créature
  };
}

for (let i = 0; i < CREATURE_COUNT; i++) {
  world.creatures.push(createCreature());
}

// --- Boucle d'update (comportement autonome) ---
setInterval(() => {
  for (const creature of world.creatures) {
    // Si Idle, choisir une nouvelle cible aléatoire de temps en temps
    if (creature.state === 0 && Math.random() < 0.01) { // Idle
      const angle = Math.random() * Math.PI * 2;
      const distance = randomInRange(2, ISLAND_RADIUS - 2);
      creature.targetX = Math.cos(angle) * distance;
      creature.targetY = Math.sin(angle) * distance;
      creature.state = 1; // Walking
    }
    // Mouvement vers la cible
    if (creature.state === 1) { // Walking
      const dx = creature.targetX - creature.x;
      const dy = creature.targetY - creature.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.1) {
        const speed = 0.05;
        creature.x += (dx / dist) * speed;
        creature.y += (dy / dist) * speed;
        // Direction
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const normalizedAngle = (angle + 360) % 360;
        if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) creature.direction = 2;
        else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) creature.direction = 1;
        else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) creature.direction = 0;
        else if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) creature.direction = 7;
        else if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) creature.direction = 6;
        else if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) creature.direction = 5;
        else if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) creature.direction = 4;
        else creature.direction = 3;
      } else {
        creature.state = 0; // Idle
      }
    }
    // TODO : interactions sociales, animations expressives, etc.
  }
  // Diffuser l'état à tous les clients
  broadcastWorld();
}, 100);

// --- Gestion des connexions WebSocket ---
function broadcastWorld() {
  const payload = JSON.stringify({ 
    type: 'worldUpdate', 
    payload: { 
      creatures: world.creatures, 
      tiles: world.tiles, 
      messages: world.messages,
      fountains: world.fountains,
      pinkTrees: world.pinkTrees
    } 
  });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', ws => {
  // Envoyer l'état initial
  console.log("world envoyé au client :", { 
    creatures: world.creatures, 
    tiles: world.tiles,
    fountains: world.fountains,
    pinkTrees: world.pinkTrees
  });
  ws.send(JSON.stringify({ 
    type: 'worldUpdate', 
    payload: { 
      creatures: world.creatures, 
      tiles: world.tiles,
      fountains: world.fountains,
      pinkTrees: world.pinkTrees
    } 
  }));

  ws.on('message', msg => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'command') {
        handleCommand(data.payload);
      }
    } catch (e) {
      console.error('Erreur message reçu:', e);
    }
  });
});

// --- Gestion des commandes admin ---
function handleCommand(cmd) {
  switch (cmd.action) {
    case 'addFountain':
      world.fountains.push({ x: cmd.x, y: cmd.y, state: 1 });
      broadcastWorld();
      break;
    case 'removeFountain':
      world.fountains = world.fountains.filter((_, index) => index !== cmd.fountainIndex);
      broadcastWorld();
      break;
    case 'changeFountainState':
      const fountain = world.fountains[cmd.fountainIndex];
      if (fountain) {
        fountain.state = Math.min(4, fountain.state + 1);
        broadcastWorld();
      }
      break;
    case 'addPinkTree':
      world.pinkTrees.push({ x: cmd.x, y: cmd.y });
      broadcastWorld();
      break;
    case 'removePinkTree':
      world.pinkTrees = world.pinkTrees.filter((_, index) => index !== cmd.treeIndex);
      broadcastWorld();
      break;
    case 'mintCreature':
      const newCreature = createCreature();
      world.creatures.push(newCreature);
      broadcastWorld();
      break;
    default:
      const creature = world.creatures.find(c => c.id === cmd.creatureId);
      if (!creature) return;
      switch (cmd.action) {
        case 'moveTo':
          creature.targetX = cmd.x;
          creature.targetY = cmd.y;
          creature.state = 1; // Walking
          break;
        case 'jump':
          creature.animation.jump = true;
          setTimeout(() => { creature.animation.jump = false; }, 500);
          break;
        case 'salute':
          creature.state = 2; // Saluting
          setTimeout(() => { creature.state = 0; }, 1000); // Back to Idle
          break;
        case 'dance':
          creature.state = 3; // Dancing
          setTimeout(() => { creature.state = 0; }, 2000); // Back to Idle
          break;
        case 'sleep':
          creature.state = 4; // Sleeping
          setTimeout(() => { creature.state = 0; }, 5000); // Back to Idle
          break;
        case 'changeColor':
          creature.color = cmd.color || '#ff9f43';
          break;
        case 'setDirection':
          if (cmd.direction >= 0 && cmd.direction <= 7) {
            creature.direction = cmd.direction;
          }
          break;
        case 'setBubble':
          creature.bubble = cmd.text || '';
          setTimeout(() => { creature.bubble = ''; }, 3000);
          break;
      }
  }
}

console.log('Serveur WebSocket démarré sur ws://localhost:3001'); 