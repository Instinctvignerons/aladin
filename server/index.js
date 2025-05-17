// Serveur WebSocket pour monde partagé de créatures
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const ethers = require('ethers');

const wss = new WebSocket.Server({ port: 3001 });

// --- État du monde partagé ---
const world = {
  creatures: [],
  tiles: [],
  messages: [],
  fountains: [],
  pinkTrees: [],
  privateGardens: [],
};

// Constantes
const VITALITY_DECAY_RATE = 1; // Points de vitalité perdus par minute
const VITALITY_CHECK_INTERVAL = 60000; // Vérification toutes les minutes
const MIN_GARDEN_SIZE = 8;
const MAX_GARDEN_SIZE = 26;

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

// Vérification de la signature du wallet
function verifySignature(message, signature, address) {
  try {
    const signerAddr = ethers.verifyMessage(message, signature);
    return signerAddr.toLowerCase() === address.toLowerCase();
  } catch (e) {
    console.error('Erreur de vérification de signature:', e);
    return false;
  }
}

// Mise à jour de la vitalité des créatures
setInterval(() => {
  world.creatures.forEach(creature => {
    // Diminuer la vitalité
    creature.vitality = Math.max(0, creature.vitality - VITALITY_DECAY_RATE);
    
    // Mettre à jour l'état émotionnel
    if (creature.vitality >= 50) {
      creature.emotionalState = 'happy';
    } else if (creature.vitality >= 25) {
      creature.emotionalState = 'sad';
    } else {
      creature.emotionalState = 'sick';
    }
  });
  
  broadcastWorld();
}, VITALITY_CHECK_INTERVAL);

// Vérifier si une zone est disponible pour un jardin
function isAreaAvailable(startX, startY, width, height) {
  // Vérifier les limites de l'île
  const maxDistance = ISLAND_RADIUS - Math.max(width, height) / 2;
  const centerDistance = Math.sqrt(startX * startX + startY * startY);
  if (centerDistance > maxDistance) return false;

  // Vérifier le chevauchement avec d'autres jardins
  return !world.privateGardens.some(garden => {
    const gardenBounds = {
      minX: Math.min(...garden.tiles.map(t => t.x)),
      maxX: Math.max(...garden.tiles.map(t => t.x)),
      minY: Math.min(...garden.tiles.map(t => t.y)),
      maxY: Math.max(...garden.tiles.map(t => t.y))
    };

    return !(startX + width < gardenBounds.minX ||
             startX > gardenBounds.maxX ||
             startY + height < gardenBounds.minY ||
             startY > gardenBounds.maxY);
  });
}

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

// Créer une créature avec vitalité initiale
function createCreature(ownerId) {
  const angle = Math.random() * Math.PI * 2;
  const distance = randomInRange(2, ISLAND_RADIUS - 2);
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  
  return {
    id: uuidv4(),
    x,
    y,
    targetX: x,
    targetY: y,
    state: 0,
    direction: Math.floor(Math.random() * 8),
    animation: {},
    bubble: '',
    color: generateRandomColor(),
    pattern: 'default',
    vitality: 100,
    emotionalState: 'happy',
    ownerId,
    lastFed: Date.now(),
    isPlaying: false
  };
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
  }
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
      pinkTrees: world.pinkTrees,
      privateGardens: world.privateGardens
    } 
  });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', ws => {
  console.log("world envoyé au client :", { 
    creatures: world.creatures, 
    tiles: world.tiles,
    fountains: world.fountains,
    pinkTrees: world.pinkTrees,
    privateGardens: world.privateGardens
  });
  ws.send(JSON.stringify({ 
    type: 'worldUpdate', 
    payload: { 
      creatures: world.creatures, 
      tiles: world.tiles,
      fountains: world.fountains,
      pinkTrees: world.pinkTrees,
      privateGardens: world.privateGardens
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

// Gérer les commandes
function handleCommand(cmd) {
  switch (cmd.action) {
    case 'claimGarden':
      if (!verifySignature(cmd.message, cmd.signature, cmd.ownerId)) {
        return;
      }
      
      if (cmd.width < MIN_GARDEN_SIZE || cmd.width > MAX_GARDEN_SIZE ||
          cmd.height < MIN_GARDEN_SIZE || cmd.height > MAX_GARDEN_SIZE) {
        return;
      }

      if (!isAreaAvailable(cmd.startX, cmd.startY, cmd.width, cmd.height)) {
        return;
      }

      const gardenTiles = [];
      for (let x = cmd.startX; x < cmd.startX + cmd.width; x++) {
        for (let y = cmd.startY; y < cmd.startY + cmd.height; y++) {
          gardenTiles.push({ x, y });
        }
      }

      world.privateGardens.push({
        ownerId: cmd.ownerId,
        tiles: gardenTiles,
        createdAt: Date.now()
      });
      break;

    case 'feedCreature':
      const creature = world.creatures.find(c => c.id === cmd.creatureId);
      if (!creature || creature.ownerId !== cmd.ownerId) return;

      const food = {
        apple: 30,
        yellowflower: 20,
        pinkflower: 25,
        rainbowflower: 40
      }[cmd.foodType] || 0;

      creature.vitality = Math.min(100, creature.vitality + food);
      creature.lastFed = Date.now();
      creature.state = 6; // Eating
      setTimeout(() => {
        creature.state = 0; // Back to Idle
      }, 2000);
      break;

    case 'batheCreature':
      const bathingCreature = world.creatures.find(c => c.id === cmd.creatureId);
      if (!bathingCreature || bathingCreature.ownerId !== cmd.ownerId) return;

      // Vérifier si la créature est près d'une fontaine
      const nearbyFountain = world.fountains.find(f => {
        const dx = f.x - bathingCreature.x;
        const dy = f.y - bathingCreature.y;
        return Math.sqrt(dx * dx + dy * dy) < 2;
      });

      if (nearbyFountain) {
        bathingCreature.state = 5; // Bathing
        setTimeout(() => {
          bathingCreature.state = 0; // Back to Idle
        }, 3000);
      }
      break;

    case 'playWithCreature':
      const playingCreature = world.creatures.find(c => c.id === cmd.creatureId);
      const targetCreature = world.creatures.find(c => c.id === cmd.targetCreatureId);
      
      if (!playingCreature || !targetCreature) return;

      const dx = targetCreature.x - playingCreature.x;
      const dy = targetCreature.y - playingCreature.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 3) {
        playingCreature.isPlaying = true;
        playingCreature.playingWith = targetCreature.id;
        playingCreature.state = 4; // Playing
        
        targetCreature.isPlaying = true;
        targetCreature.playingWith = playingCreature.id;
        targetCreature.state = 4;

        // Augmenter légèrement la vitalité pendant le jeu
        playingCreature.vitality = Math.min(100, playingCreature.vitality + 5);
        targetCreature.vitality = Math.min(100, targetCreature.vitality + 5);

        setTimeout(() => {
          playingCreature.isPlaying = false;
          playingCreature.playingWith = undefined;
          playingCreature.state = 0;
          
          targetCreature.isPlaying = false;
          targetCreature.playingWith = undefined;
          targetCreature.state = 0;
        }, 5000);
      }
      break;

    case 'addFountain':
      world.fountains.push({ x: cmd.x, y: cmd.y, state: 1 });
      break;
    case 'removeFountain':
      world.fountains = world.fountains.filter((_, index) => index !== cmd.fountainIndex);
      break;
    case 'changeFountainState':
      const fountain = world.fountains[cmd.fountainIndex];
      if (fountain) {
        fountain.state = Math.min(4, fountain.state + 1);
      }
      break;
    case 'addPinkTree':
      world.pinkTrees.push({ x: cmd.x, y: cmd.y });
      break;
    case 'removePinkTree':
      world.pinkTrees = world.pinkTrees.filter((_, index) => index !== cmd.treeIndex);
      break;
    case 'mintCreature':
      const newCreature = createCreature(cmd.ownerId);
      world.creatures.push(newCreature);
      break;
    default:
      const targetCreature = world.creatures.find(c => c.id === cmd.creatureId);
      if (!targetCreature) return;
      switch (cmd.action) {
        case 'moveTo':
          targetCreature.targetX = cmd.x;
          targetCreature.targetY = cmd.y;
          targetCreature.state = 1; // Walking
          break;
        case 'jump':
          targetCreature.animation.jump = true;
          setTimeout(() => { targetCreature.animation.jump = false; }, 500);
          break;
        case 'salute':
          targetCreature.state = 2; // Saluting
          setTimeout(() => { targetCreature.state = 0; }, 1000);
          break;
        case 'dance':
          targetCreature.state = 3; // Dancing
          setTimeout(() => { targetCreature.state = 0; }, 2000);
          break;
        case 'sleep':
          targetCreature.state = 4; // Sleeping
          setTimeout(() => { targetCreature.state = 0; }, 5000);
          break;
        case 'changeColor':
          targetCreature.color = cmd.color || '#ff9f43';
          break;
        case 'setDirection':
          if (cmd.direction >= 0 && cmd.direction <= 7) {
            targetCreature.direction = cmd.direction;
          }
          break;
        case 'setBubble':
          targetCreature.bubble = cmd.text || '';
          setTimeout(() => { targetCreature.bubble = ''; }, 3000);
          break;
      }
  }
  
  broadcastWorld();
}

console.log('Serveur WebSocket démarré sur ws://localhost:3001');