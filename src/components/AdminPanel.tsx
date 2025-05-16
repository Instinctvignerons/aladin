import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { Creature } from '../types';

const COMMANDS = [
  { action: 'moveTo', label: 'Déplacer' },
  { action: 'jump', label: 'Sauter' },
  { action: 'salute', label: 'Saluer' },
  { action: 'dance', label: 'Danser' },
  { action: 'sleep', label: 'Dormir' },
  { action: 'changeColor', label: 'Changer couleur' },
  { action: 'setDirection', label: 'Changer direction' },
  { action: 'setBubble', label: 'Bulle de texte' },
  { action: 'teleport', label: 'Téléporter' },
  { action: 'removeCreature', label: 'Supprimer' },
];

export default function AdminPanel() {
  const { world, sendCommand } = useSocket();
  const { creatures, setCreatures } = useGame();
  const [selectedId, setSelectedId] = useState('');
  const [params, setParams] = useState({ x: '', y: '', color: '', direction: '', text: '' });
  const [addParams, setAddParams] = useState({ x: '', y: '' });
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [showAddCreature, setShowAddCreature] = useState(false);
  const [showEditCreature, setShowEditCreature] = useState(false);

  const handleCommand = (action: string) => {
    if (!selectedId && action !== 'addCreature') return;
    let payload: any = { action, creatureId: selectedId };
    if (action === 'moveTo' || action === 'teleport') {
      payload.x = parseFloat(params.x);
      payload.y = parseFloat(params.y);
    }
    if (action === 'changeColor') payload.color = params.color;
    if (action === 'setDirection') payload.direction = parseInt(params.direction);
    if (action === 'setBubble') payload.text = params.text;
    if (action === 'addCreature') {
      payload = { action, x: parseFloat(addParams.x), y: parseFloat(addParams.y) };
    }
    sendCommand(payload);
  };

  const handleMakeAllGreet = (greetingType: 'salutx1' | 'salutx2') => {
    console.log('handleMakeAllGreet appelé avec:', greetingType);
    console.log('Créatures actuelles:', creatures);
    
    if (!creatures || creatures.length === 0) {
      console.log('Pas de créatures à faire saluer');
      return;
    }

    // Envoyer la commande au serveur pour chaque créature
    creatures.forEach(creature => {
      sendCommand({
        action: 'salute',
        creatureId: creature.id,
        greetingType
      });
    });

    // Mettre à jour l'état local immédiatement
    const updatedCreatures = creatures.map(creature => ({
      ...creature,
      greetingType: greetingType as 'salutx1' | 'salutx2' | 'none'
    }));
    console.log('Mise à jour des créatures avec le salut:', updatedCreatures);
    setCreatures(updatedCreatures);

    // Réinitialiser après 2 secondes
    setTimeout(() => {
      console.log('Réinitialisation des saluts');
      const resetCreatures = creatures.map(creature => ({
        ...creature,
        greetingType: 'none' as const
      }));
      setCreatures(resetCreatures);
    }, 2000);
  };

  return (
    <div style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8, maxWidth: 400 }}>
      <h2>Admin Créatures</h2>
      <div>
        <label>Créature : </label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value=''>-- Sélectionner --</option>
          {world.creatures.map(c => (
            <option key={c.id} value={c.id}>{c.id.slice(0, 6)} ({c.state})</option>
          ))}
        </select>
      </div>
      <div style={{ margin: '8px 0' }}>
        <label>X: </label>
        <input type='number' value={params.x} onChange={e => setParams(p => ({ ...p, x: e.target.value }))} style={{ width: 60 }} />
        <label> Y: </label>
        <input type='number' value={params.y} onChange={e => setParams(p => ({ ...p, y: e.target.value }))} style={{ width: 60 }} />
      </div>
      <div style={{ margin: '8px 0' }}>
        <label>Couleur: </label>
        <input type='color' value={params.color} onChange={e => setParams(p => ({ ...p, color: e.target.value }))} />
        <label> Direction: </label>
        <input type='number' min='0' max='7' value={params.direction} onChange={e => setParams(p => ({ ...p, direction: e.target.value }))} style={{ width: 40 }} />
      </div>
      <div style={{ margin: '8px 0' }}>
        <label>Bulle: </label>
        <input type='text' value={params.text} onChange={e => setParams(p => ({ ...p, text: e.target.value }))} style={{ width: 120 }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {COMMANDS.map(cmd => (
          <button key={cmd.action} onClick={() => handleCommand(cmd.action)} style={{ padding: '4px 8px' }}>{cmd.label}</button>
        ))}
      </div>
      <hr />
      <h3>Ajouter une créature</h3>
      <div>
        <label>X: </label>
        <input type='number' value={addParams.x} onChange={e => setAddParams(p => ({ ...p, x: e.target.value }))} style={{ width: 60 }} />
        <label> Y: </label>
        <input type='number' value={addParams.y} onChange={e => setAddParams(p => ({ ...p, y: e.target.value }))} style={{ width: 60 }} />
        <button onClick={() => handleCommand('addCreature')}>Ajouter</button>
      </div>
      <div className="space-y-2 mb-4">
        <button
          onClick={() => handleMakeAllGreet('salutx1')}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Faire saluer (1 bras)
        </button>
        <button
          onClick={() => handleMakeAllGreet('salutx2')}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Faire saluer (2 bras)
        </button>
      </div>
    </div>
  );
} 