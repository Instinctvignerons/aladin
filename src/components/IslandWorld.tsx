import React, { useRef, useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { cartesianToIsometric, isometricToCartesian } from '../utils/isometric';
import { renderTile, renderCreature } from '../utils/renderer';
import { Creature, Tile, CreatureState, FoodType, CreatureInteraction, WorldState, Food } from '../types';
import { FoodMenu } from './FoodMenu';

const foods: Food[] = [
  {
    type: 'apple',
    name: 'Pomme',
    image: '/images/food/apple.png',
    effect: {
      happiness: 20
    }
  },
  {
    type: 'yellowflower',
    name: 'Fleur Jaune',
    image: '/images/food/yellowflower.png',
    effect: {
      happiness: 15
    }
  },
  {
    type: 'pinkflower',
    name: 'Fleur Rose',
    image: '/images/food/pinkflower.png',
    effect: {
      happiness: 25
    }
  },
  {
    type: 'rainbowflower',
    name: 'Fleur Arc-en-ciel',
    image: '/images/food/rainbowflower.png',
    effect: {
      happiness: 40
    }
  }
];

interface RenderableElement {
  type: 'tile' | 'fountain' | 'pinkTree' | 'creature';
  element: any;
  y: number;
}

// Fonction pour dessiner la fontaine
function drawFountain(ctx: CanvasRenderingContext2D, tileX: number, tileY: number, offsetX: number, offsetY: number, state: number = 1) {
  const { isoX, isoY } = cartesianToIsometric(tileX, tileY);
  const x = offsetX + isoX;
  const y = offsetY + isoY - 20; // Décalage vers le haut

  const img = new Image();
  img.src = '/images/fountain.png';

  if (!(drawFountain as any).cachedImage) {
    (drawFountain as any).cachedImage = img;
  }

  const image = (drawFountain as any).cachedImage;

  if (image.complete) {
    ctx.drawImage(image, x - 33, y - 33, 66, 66);
  } else {
    image.onload = () => {
      ctx.drawImage(image, x - 33, y - 33, 66, 66);
    };
  }

  // Initialiser les particules si elles n'existent pas
  if (!(drawFountain as any).particles) {
    (drawFountain as any).particles = [];
  }

  // Initialiser les pièces si elles n'existent pas
  if (!(drawFountain as any).coins) {
    (drawFountain as any).coins = [];
  }

  // Créer de nouvelles particules en fonction de l'état
  const particleCount = state * 2;
  const particleSpeed = state * 0.5;
  const particleSize = state * 1.5;

  for (let i = 0; i < particleCount; i++) {
    if (Math.random() < 0.3) {
      (drawFountain as any).particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y - 20,
        speedY: -2 - Math.random() * particleSpeed,
        speedX: (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * particleSize,
        alpha: 0.8
      });
    }
  }

  // Mettre à jour et dessiner les particules
  for (let i = (drawFountain as any).particles.length - 1; i >= 0; i--) {
    const particle = (drawFountain as any).particles[i];
    particle.y += particle.speedY;
    particle.x += particle.speedX;
    particle.alpha -= 0.02;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(136, 204, 255, ${particle.alpha})`;
    ctx.fill();

    if (particle.alpha <= 0 || particle.y < y - 40) {
      (drawFountain as any).particles.splice(i, 1);
    }
  }

  // Mettre à jour et dessiner les pièces
  for (let i = (drawFountain as any).coins.length - 1; i >= 0; i--) {
    const coin = (drawFountain as any).coins[i];
    coin.y += coin.speedY;
    coin.rotation += coin.rotationSpeed;
    coin.alpha -= 0.01;

    ctx.save();
    ctx.translate(coin.x, coin.y);
    ctx.rotate(coin.rotation);
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 215, 0, ${coin.alpha})`;
    ctx.fill();
    ctx.restore();

    if (coin.alpha <= 0 || coin.y > y + 20) {
      (drawFountain as any).coins.splice(i, 1);
    }
  }

  // Dessiner l'eau qui déborde pour l'état 4
  if (state === 4) {
    ctx.beginPath();
    ctx.arc(x, y + 20, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(136, 204, 255, 0.3)';
    ctx.fill();
  }
}

// Ajoute des propriétés statiques pour le cache
(drawFountain as any).cachedImage = null;
(drawFountain as any).particles = [];
(drawFountain as any).coins = [];

// Fonction pour dessiner un arbre rose
function drawPinkTree(ctx: CanvasRenderingContext2D, tileX: number, tileY: number, offsetX: number, offsetY: number) {
  const { isoX, isoY } = cartesianToIsometric(tileX, tileY);
  const x = offsetX + isoX;
  const y = offsetY + isoY - 20; // Décalage vers le haut

  const img = new Image();
  img.src = '/images/pinktree.png';

  // Pour éviter de charger à chaque frame, on garde une image unique
  if (!(drawPinkTree as any).cachedImage) {
    (drawPinkTree as any).cachedImage = img;
  }

  const image = (drawPinkTree as any).cachedImage;

  // Vérifie si l'image est déjà chargée
  if (image.complete) {
    ctx.drawImage(image, x - 50, y - 50, 100, 100); // Augmentation de la taille de 66x66 à 100x100
  } else {
    image.onload = () => {
      ctx.drawImage(image, x - 50, y - 50, 100, 100); // Augmentation de la taille de 66x66 à 100x100
    };
  }
}

// Ajoute des propriétés statiques pour le cache
(drawPinkTree as any).cachedImage = null;

export const IslandWorld: React.FC = () => {
  console.log("IslandWorld: Initialisation du composant");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { world, sendCommand, setWorld } = useSocket();
  const { isWalletConnected, walletAddress, setIsWalletConnected, setWalletAddress } = useGame();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [earAnimation, setEarAnimation] = useState(0);
  const [showSpecialEars, setShowSpecialEars] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ 
    x: number; 
    y: number; 
    tileX: number; 
    tileY: number;
    isFountain?: boolean;
    fountainIndex?: number;
    isTree?: boolean;
    treeIndex?: number;
  } | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [showFoodMenu, setShowFoodMenu] = useState(false);

  // Log de l'état de connexion
  useEffect(() => {
    console.log('État de connexion du wallet:', { isWalletConnected, walletAddress });
  }, [isWalletConnected, walletAddress]);

  console.log('world in client:', world);

  // Handle window resize
  useEffect(() => {
    console.log("IslandWorld: Effet de redimensionnement");
    const handleResize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      console.log("IslandWorld: Nouvelle taille", newSize);
      setCanvasSize(newSize);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle zoom with mouse wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.3), 2));
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel);
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Animation frame loop
  useEffect(() => {
    console.log("IslandWorld: Effet d'animation");
    let animationFrame: number;
    let lastTime = 0;
    let walletConnectionTime = 0;
    let animationTime = 0;

    const animate = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error("Canvas non trouvé !");
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error("Pas de contexte 2D !");
        return;
      }

      console.log("Rendu du monde", world.tiles?.length || 0, world.creatures?.length || 0);

      const deltaTime = Math.min(timestamp - lastTime, 32);
      lastTime = timestamp;
      animationTime += deltaTime * 0.001;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set the center offset to position the island in the middle
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Apply zoom
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(zoom, zoom);
      ctx.translate(-centerX, -centerY);

      // Draw background (static stars)
      drawBackground(ctx, canvas.width, canvas.height);

      // Draw island shadow
      drawIslandShadow(ctx, centerX, centerY);

      // Sort all renderable elements by their y position for correct rendering order
      const renderableElements: RenderableElement[] = [];

      // Add tiles
      if (world.tiles) {
        world.tiles.forEach(tile => {
          const { isoY } = cartesianToIsometric(tile.x, tile.y);
          renderableElements.push({
            type: 'tile',
            element: tile,
            y: isoY
          });
        });
      }

      // Add fountains
      world.fountains?.forEach(fountain => {
        const { isoY } = cartesianToIsometric(fountain.x, fountain.y);
        renderableElements.push({
          type: 'fountain',
          element: fountain,
          y: isoY
        });
      });

      // Add pink trees
      world.pinkTrees?.forEach(tree => {
        const { isoY } = cartesianToIsometric(tree.x, tree.y);
        renderableElements.push({
          type: 'pinkTree',
          element: tree,
          y: isoY
        });
      });

      // Update creature positions and behaviors
      if (world.creatures) {
        const updatedCreatures = world.creatures.map((creature) => {
          // Move creature towards target
          const dx = creature.targetX - creature.x;
          const dy = creature.targetY - creature.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0.1) {
            const speed = 0.05;
            const moveAmount = speed * (deltaTime / 16);
            const newX = creature.x + (dx / distance) * moveAmount;
            const newY = creature.y + (dy / distance) * moveAmount;

            // Determine direction based on movement (8 directions)
            let direction = creature.direction;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const normalizedAngle = (angle + 360) % 360;
            
            // Convert angle to 8 directions
            if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) {
              direction = 2; // East
            } else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) {
              direction = 1; // North-East
            } else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) {
              direction = 0; // North
            } else if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) {
              direction = 7; // North-West
            } else if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) {
              direction = 6; // West
            } else if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) {
              direction = 5; // South-West
            } else if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) {
              direction = 4; // South
            } else {
              direction = 3; // South-East
            }

            return {
              ...creature,
              x: newX,
              y: newY,
              direction,
              frame: animationTime * 2,
              state: CreatureState.Walking,
            };
          }

          // Check for nearby creatures when idle
          const nearbyCreature = world.creatures.find(c => {
            if (c.id === creature.id) return false;
            const dx = c.x - creature.x;
            const dy = c.y - creature.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < 2;
          });

          if (nearbyCreature) {
            // Look at nearby creature (8 directions)
            const dx = nearbyCreature.x - creature.x;
            const dy = nearbyCreature.y - creature.y;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const normalizedAngle = (angle + 360) % 360;
            
            // Convert angle to 8 directions
            let direction = creature.direction;
            if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) {
              direction = 2; // East
            } else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) {
              direction = 1; // North-East
            } else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) {
              direction = 0; // North
            } else if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) {
              direction = 7; // North-West
            } else if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) {
              direction = 6; // West
            } else if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) {
              direction = 5; // South-West
            } else if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) {
              direction = 4; // South
            } else {
              direction = 3; // South-East
            }

            return {
              ...creature,
              direction,
              frame: animationTime * 2,
              state: CreatureState.Idle,
            };
          }

          return {
            ...creature,
            frame: animationTime * 2,
            state: CreatureState.Idle,
          };
        });

        // Sort creatures by their y position for correct rendering order
        const sortedCreatures = [...updatedCreatures].sort((a, b) => {
          const aIso = cartesianToIsometric(a.x, a.y);
          const bIso = cartesianToIsometric(b.x, b.y);
          return aIso.isoY - bIso.isoY;
        });

        // Update ear animation
        if (world.isWalletConnected) {
          walletConnectionTime = timestamp;
        }
        const timeSinceWalletConnection = timestamp - walletConnectionTime;
        const showSpecialEars = timeSinceWalletConnection < 3000; // 3 seconds

        // Add creatures
        sortedCreatures.forEach(creature => {
          const { isoY } = cartesianToIsometric(creature.x, creature.y);
          renderableElements.push({
            type: 'creature',
            element: creature,
            y: isoY
          });
        });
      }

      // Sort all elements by their y position
      renderableElements.sort((a, b) => a.y - b.y);

      // Render all elements in the correct order
      renderableElements.forEach(item => {
        switch (item.type) {
          case 'tile':
            renderTile(ctx, item.element, offset.x + centerX, offset.y + centerY);
            break;
          case 'fountain':
            drawFountain(ctx, item.element.x, item.element.y, offset.x + centerX, offset.y + centerY, item.element.state);
            break;
          case 'pinkTree':
            drawPinkTree(ctx, item.element.x, item.element.y, offset.x + centerX, offset.y + centerY);
            break;
          case 'creature':
            renderCreature(
              ctx,
              item.element,
              offset.x + centerX,
              offset.y + centerY,
              false,
              animationTime * 2,
              showSpecialEars
            );
            break;
        }
      });

      ctx.restore();
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [world, offset, zoom]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvas.width / 2) / zoom + canvas.width / 2;
    const y = (e.clientY - rect.top - canvas.height / 2) / zoom + canvas.height / 2;

    // Adjust for offset and center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const adjustedX = x - offset.x - centerX;
    const adjustedY = y - offset.y - centerY;

    // Convert to cartesian
    const cartesian = isometricToCartesian(adjustedX, adjustedY);

    // Vérifier si on a cliqué sur une fontaine existante
    const clickedFountainIndex = world.fountains?.findIndex(fountain => {
      const fountainIso = cartesianToIsometric(fountain.x, fountain.y);
      const dx = Math.abs(adjustedX - fountainIso.isoX);
      const dy = Math.abs(adjustedY - fountainIso.isoY);
      return dx < 20 && dy < 20; // Hitbox de la fontaine
    }) ?? -1;

    // Vérifier si on a cliqué sur un arbre rose existant
    const clickedTreeIndex = world.pinkTrees?.findIndex(tree => {
      const treeIso = cartesianToIsometric(tree.x, tree.y);
      const dx = Math.abs(adjustedX - treeIso.isoX);
      const dy = Math.abs(adjustedY - treeIso.isoY);
      return dx < 20 && dy < 20; // Hitbox de l'arbre
    }) ?? -1;

    if (clickedFountainIndex !== -1) {
      // Afficher le menu pour la fontaine existante
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        tileX: cartesian.x,
        tileY: cartesian.y,
        isFountain: true,
        fountainIndex: clickedFountainIndex
      });
    } else if (clickedTreeIndex !== -1) {
      // Afficher le menu pour l'arbre rose existant
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        tileX: cartesian.x,
        tileY: cartesian.y,
        isTree: true,
        treeIndex: clickedTreeIndex
      });
    } else {
      // Afficher le menu pour une nouvelle fontaine ou arbre
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        tileX: cartesian.x,
        tileY: cartesian.y,
        isFountain: false,
        isTree: false
      });
    }
  };

  const handleAddFountain = () => {
    console.log('Tentative d\'ajout de fontaine:', { isWalletConnected, walletAddress });
    if (!contextMenu || !isWalletConnected) {
      console.log('Impossible d\'ajouter la fontaine:', { isWalletConnected, contextMenu });
      return;
    }
    
    sendCommand({
      action: 'addFountain',
      x: contextMenu.tileX,
      y: contextMenu.tileY
    });
    
    setContextMenu(null);
  };

  const handleRemoveFountain = () => {
    console.log('Tentative de suppression de fontaine:', { isWalletConnected, walletAddress });
    if (!contextMenu || contextMenu.fountainIndex === undefined || !isWalletConnected) {
      console.log('Impossible de supprimer la fontaine:', { isWalletConnected, contextMenu });
      return;
    }
    
    sendCommand({
      action: 'removeFountain',
      fountainIndex: contextMenu.fountainIndex
    });
    
    setContextMenu(null);
  };

  const handleAddPinkTree = () => {
    if (!contextMenu || !isWalletConnected) return;
    
    sendCommand({
      action: 'addPinkTree',
      x: contextMenu.tileX,
      y: contextMenu.tileY
    });
    
    setContextMenu(null);
  };

  const handleRemovePinkTree = () => {
    if (!contextMenu || contextMenu.treeIndex === undefined || !isWalletConnected) return;
    
    sendCommand({
      action: 'removePinkTree',
      treeIndex: contextMenu.treeIndex
    });
    
    setContextMenu(null);
  };

  const handleChangeFountainState = () => {
    if (!contextMenu || contextMenu.fountainIndex === undefined || !isWalletConnected) return;
    
    sendCommand({
      action: 'changeFountainState',
      fountainIndex: contextMenu.fountainIndex
    });
    
    setContextMenu(null);
  };

  const handleThrowCoin = () => {
    if (!contextMenu || contextMenu.fountainIndex === undefined || !isWalletConnected) return;
    
    // Trouver la fontaine correspondante
    const fountain = world.fountains?.[contextMenu.fountainIndex];
    if (!fountain) return;

    // Ajouter une nouvelle pièce à la fontaine
    const { isoX, isoY } = cartesianToIsometric(fountain.x, fountain.y);
    const x = offset.x + canvasSize.width / 2 + isoX;
    const y = offset.y + canvasSize.height / 2 + isoY - 40;

    (drawFountain as any).coins.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y - 20,
      speedY: 2 + Math.random() * 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      alpha: 1
    });
    
    sendCommand({
      action: 'throwCoin',
      fountainIndex: contextMenu.fountainIndex
    });
    
    setContextMenu(null);
  };

  // Draw background with static color
  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
  };

  // Draw the shadow beneath the island
  const drawIslandShadow = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    ctx.save();
    ctx.translate(centerX + offset.x, centerY + offset.y + 50);
    ctx.scale(1, 0.5); // Flatten to create ellipse
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();
    ctx.restore();
  };

  // Callback à passer à WalletConnector pour déclencher l'animation locale des oreilles
  const handleWalletEarAnimation = () => {
    setShowSpecialEars(true);
    setTimeout(() => setShowSpecialEars(false), 3000);
  };

  const handleHello = () => {
    if (isWalletConnected && walletAddress) {
      sendCommand({ action: 'helloFollicon', wallet: walletAddress });
    }
  };

  // Handle canvas mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Handle canvas mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const dx = (currentX - dragStart.x) / zoom;
    const dy = (currentY - dragStart.y) / zoom;

    setOffset(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));

    setDragStart({
      x: currentX,
      y: currentY
    });
  };

  // Handle canvas mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle canvas mouse leave
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleCreatureClick = (creature: Creature) => {
    setSelectedCreature(creature);
    setShowFoodMenu(true);
  };

  const handleFeedCreature = (foodType: FoodType) => {
    if (!selectedCreature) return;

    const interaction: CreatureInteraction = {
      type: 'feed',
      food: foodType,
      timestamp: Date.now()
    };

    // Trouver la nourriture correspondante
    const food = foods.find(f => f.type === foodType);
    if (!food) return;

    // Mettre à jour la créature avec la nouvelle interaction et le bonheur
    const updatedCreature = {
      ...selectedCreature,
      interactions: [...(selectedCreature.interactions || []), interaction],
      greetingType: selectedCreature.greetingType || 'none',
      width: selectedCreature.width || 32,
      height: selectedCreature.height || 32,
      happiness: Math.min(100, (selectedCreature.happiness || 0) + food.effect.happiness)
    };

    // Mettre à jour la créature dans le monde
    const updatedCreatures = world.creatures.map(c => 
      c.id === selectedCreature.id ? updatedCreature : c
    );

    // Mettre à jour le monde
    setWorld(prev => ({
      ...prev,
      creatures: updatedCreatures,
      evolutionLevel: prev.evolutionLevel,
      connections: prev.connections
    }));

    setShowFoodMenu(false);
    setSelectedCreature(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ width: '100vw', height: '100vh' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={(e) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;

          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Vérifier si on a cliqué sur une créature
          const clickedCreature = world.creatures.find(creature => {
            const { isoX, isoY } = cartesianToIsometric(creature.x, creature.y);
            const creatureX = offset.x + canvasSize.width / 2 + isoX;
            const creatureY = offset.y + canvasSize.height / 2 + isoY;
            
            const dx = x - creatureX;
            const dy = y - creatureY;
            return Math.sqrt(dx * dx + dy * dy) < 20;
          });

          if (clickedCreature) {
            handleCreatureClick(clickedCreature);
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} border border-red-500`}
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Menu contextuel */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg p-2 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          {!isWalletConnected ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              Connectez votre wallet pour gérer les fontaines et arbres
            </div>
          ) : contextMenu.isFountain ? (
            <>
              <button
                onClick={handleThrowCoin}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded w-full text-left"
              >
                Jeter une pièce
              </button>
              <button
                onClick={handleChangeFountainState}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded w-full text-left"
              >
                Changer l'état
              </button>
              <button
                onClick={handleRemoveFountain}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded w-full text-left"
              >
                Supprimer la fontaine
              </button>
            </>
          ) : contextMenu.isTree ? (
            <button
              onClick={handleRemovePinkTree}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded w-full text-left"
            >
              Supprimer l'arbre rose
            </button>
          ) : (
            <>
              <button
                onClick={handleAddFountain}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded w-full text-left"
              >
                Ajouter une fontaine
              </button>
              <button
                onClick={handleAddPinkTree}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded w-full text-left"
              >
                Ajouter un arbre rose
              </button>
            </>
          )}
        </div>
      )}

      {showFoodMenu && selectedCreature && (
        <FoodMenu
          onSelectFood={handleFeedCreature}
          onClose={() => {
            setShowFoodMenu(false);
            setSelectedCreature(null);
          }}
        />
      )}

      <button onClick={handleHello} style={{ position: 'absolute', bottom: 24, right: 24, zIndex: 20, padding: '10px 18px', borderRadius: 8, background: '#fff', color: '#222', fontWeight: 700, fontSize: 18 }}>
        Hello Follicon
      </button>
      <button 
        onClick={() => sendCommand({ action: 'mintCreature' })} 
        style={{ 
          position: 'absolute', 
          bottom: 24, 
          right: 200, 
          zIndex: 20, 
          padding: '10px 18px', 
          borderRadius: 8, 
          background: '#fff', 
          color: '#222', 
          fontWeight: 700, 
          fontSize: 18 
        }}
      >
        Mint a Follicon
      </button>
    </div>
  );
};