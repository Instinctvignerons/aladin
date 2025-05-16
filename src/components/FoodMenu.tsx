import React from 'react';
import { Food, FoodType } from '../types';

interface FoodMenuProps {
  onSelectFood: (food: FoodType) => void;
  onClose: () => void;
}

const foods: Food[] = [
  {
    type: 'apple',
    name: 'Pomme',
    image: '/images/food/apple.png',
    effect: {
      evolution: 1
    }
  },
  {
    type: 'yellowflower',
    name: 'Fleur Jaune',
    image: '/images/food/yellowflower.png',
    effect: {
      color: '#fdcb6e'
    }
  },
  {
    type: 'pinkflower',
    name: 'Fleur Rose',
    image: '/images/food/pinkflower.png',
    effect: {
      color: '#ff9ff3'
    }
  },
  {
    type: 'rainbowflower',
    name: 'Fleur Arc-en-ciel',
    image: '/images/food/rainbowflower.png',
    effect: {
      pattern: 'rainbow'
    }
  }
];

export const FoodMenu: React.FC<FoodMenuProps> = ({ onSelectFood, onClose }) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Nourrir la créature</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {foods.map((food) => (
          <button
            key={food.type}
            onClick={() => onSelectFood(food.type)}
            className="flex flex-col items-center p-2 rounded hover:bg-gray-100"
          >
            <img
              src={food.image}
              alt={food.name}
              className="w-12 h-12 object-contain mb-2"
            />
            <span className="text-sm">{food.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}; 