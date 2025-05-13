import React from 'react';
import { InventoryItem } from '../types';

interface InventoryIconProps {
  item: InventoryItem;
}

const InventoryIcon: React.FC<InventoryIconProps> = ({ item }) => {
  // If item has an icon, display it
  if (item.icon) {
    return <span>{item.icon}</span>;
  }

  // Otherwise, use a default icon based on type
  let iconDisplay = '📦';
  
  switch (item.type) {
    case 'weapon':
      iconDisplay = '⚔️';
      break;
    case 'armor':
      iconDisplay = '🛡️';
      break;
    case 'potion':
      iconDisplay = '🧪';
      break;
    case 'elixir':
      iconDisplay = '✨';
      break;
    case 'rune':
      iconDisplay = '🔮';
      break;
    case 'map':
      iconDisplay = '🗺️';
      break;
    case 'compass':
      iconDisplay = '🧭';
      break;
    case 'gold':
      iconDisplay = '💰';
      break;
    case 'energy':
      iconDisplay = '⚡';
      break;
    default:
      iconDisplay = '📦';
  }
  
  return <span>{iconDisplay}</span>;
};

export default InventoryIcon;
