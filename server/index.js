// Previous imports remain the same...

// Add fence types
const FENCE_TYPES = ['wooden', 'floral', 'crystal', 'rainbow'];

// Update handleCommand function to handle fence placement
function handleCommand(cmd) {
  switch (cmd.action) {
    // Previous cases remain the same...
    
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
          gardenTiles.push({ 
            x, 
            y,
            hasFence: isGardenBorder(x, y, cmd.startX, cmd.startY, cmd.width, cmd.height)
          });
        }
      }

      world.privateGardens.push({
        ownerId: cmd.ownerId,
        tiles: gardenTiles,
        createdAt: Date.now(),
        fenceType: cmd.fenceType || 'wooden'
      });
      break;

    case 'updateFence':
      const garden = world.privateGardens.find(g => g.ownerId === cmd.ownerId);
      if (garden && FENCE_TYPES.includes(cmd.fenceType)) {
        garden.fenceType = cmd.fenceType;
      }
      break;

    // Previous cases remain the same...
  }
  
  broadcastWorld();
}

// Helper function to determine if a tile is on the garden border
function isGardenBorder(x, y, startX, startY, width, height) {
  return x === startX || x === startX + width - 1 || 
         y === startY || y === startY + height - 1;
}

// Update creature movement to respect fences
function canCreatureMove(creature, targetX, targetY) {
  // Check if target position crosses any garden fences
  const crossesFence = world.privateGardens.some(garden => {
    const gardenBounds = {
      minX: Math.min(...garden.tiles.map(t => t.x)),
      maxX: Math.max(...garden.tiles.map(t => t.x)),
      minY: Math.min(...garden.tiles.map(t => t.y)),
      maxY: Math.max(...garden.tiles.map(t => t.y))
    };

    // Check if movement path crosses garden boundary
    const currentlyInside = isPointInGarden(creature.x, creature.y, gardenBounds);
    const targetInside = isPointInGarden(targetX, targetY, gardenBounds);

    return currentlyInside !== targetInside;
  });

  return !crossesFence;
}

function isPointInGarden(x, y, bounds) {
  return x >= bounds.minX && x <= bounds.maxX && 
         y >= bounds.minY && y <= bounds.maxY;
}

// Update the movement logic in the update loop
setInterval(() => {
  for (const creature of world.creatures) {
    if (creature.state === 1) { // Walking
      const dx = creature.targetX - creature.x;
      const dy = creature.targetY - creature.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.1) {
        // Check if movement is allowed
        if (canCreatureMove(creature, creature.targetX, creature.targetY)) {
          const speed = 0.05;
          creature.x += (dx / dist) * speed;
          creature.y += (dy / dist) * speed;
          // Direction update remains the same...
        } else {
          // If movement is blocked, stop at current position
          creature.targetX = creature.x;
          creature.targetY = creature.y;
          creature.state = 0; // Idle
        }
      } else {
        creature.state = 0; // Idle
      }
    }
  }
  broadcastWorld();
}, 100);

// Rest of the server code remains unchanged...