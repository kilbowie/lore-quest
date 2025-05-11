
import React from 'react';
import { User, EquipmentSlot, InventoryItem, EquippableItem } from '../types';
import { equipItem, unequipItem } from '../utils/xpUtils';
import { Shield, Sword, Wand, Activity, Trash2, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlayerEquipmentProps {
  user: User;
  onUserUpdate: (user: User) => void;
  showInventory?: boolean;
}

const PlayerEquipment: React.FC<PlayerEquipmentProps> = ({ user, onUserUpdate, showInventory = true }) => {
  const handleEquipItem = (itemId: string) => {
    const updatedUser = equipItem(user, itemId);
    onUserUpdate(updatedUser);
  };
  
  const handleUnequipItem = (slot: EquipmentSlot) => {
    const updatedUser = unequipItem(user, slot);
    onUserUpdate(updatedUser);
  };
  
  const getSlotIcon = (slot: EquipmentSlot) => {
    switch (slot) {
      case 'mainWeapon': return user.playerClass === 'Knight' ? <Sword size={18} /> : user.playerClass === 'Wizard' ? <Wand size={18} /> : <Activity size={18} />;
      case 'secondaryWeapon': return <Shield size={18} />;
      case 'head': return '🪖';
      case 'body': return '👕';
      case 'legs': return '👖';
      case 'hands': return '🧤';
      case 'feet': return '👢';
      default: return null;
    }
  };
  
  const getSlotName = (slot: EquipmentSlot) => {
    switch (slot) {
      case 'mainWeapon': return 'Main Weapon';
      case 'secondaryWeapon': return 'Secondary Weapon';
      case 'head': return 'Head';
      case 'body': return 'Body';
      case 'legs': return 'Legs';
      case 'hands': return 'Hands';
      case 'feet': return 'Feet';
      default: return slot;
    }
  };
  
  const renderEquipmentSlot = (slot: EquipmentSlot) => {
    const equipped = user.equipment?.[slot];
    const isSecondaryLocked = slot === 'secondaryWeapon' && user.level < 5;
    
    return (
      <div className="relative">
        <Card className={`bg-lorequest-dark border-lorequest-gold/30 ${isSecondaryLocked ? 'opacity-50' : ''}`}>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm text-lorequest-gold flex items-center gap-1">
              <span>{getSlotIcon(slot)}</span>
              <span>{getSlotName(slot)}</span>
              
              {isSecondaryLocked && (
                <Badge variant="outline" className="ml-auto text-xs">
                  Unlocks at Level 5
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-3 pt-0">
            {equipped ? (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-lorequest-parchment font-medium">
                      {equipped.icon && <span className="mr-1">{equipped.icon}</span>}
                      {equipped.name}
                    </span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-200/10"
                    onClick={() => handleUnequipItem(slot)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                
                {equipped.equipmentStats?.armor && (
                  <div className="text-xs text-lorequest-parchment/70">
                    Armor: +{equipped.equipmentStats.armor}
                  </div>
                )}
                
                {equipped.equipmentStats?.statBonuses?.map((bonus, idx) => (
                  <div key={idx} className="text-xs text-lorequest-gold/80">
                    +{bonus.value} {bonus.attribute.charAt(0).toUpperCase() + bonus.attribute.slice(1)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-lorequest-parchment/50 italic">
                {isSecondaryLocked ? (
                  <div className="flex items-center justify-center h-12">
                    <Lock size={16} className="mr-1" /> Locked
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-12">
                    Empty slot
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderInventoryItems = () => {
    // Filter inventory for equippable items
    const equippableItems = user.inventory.filter(
      item => item.isEquippable === true
    ) as EquippableItem[];
    
    if (equippableItems.length === 0) {
      return (
        <div className="text-center py-6 text-lorequest-parchment/70 italic">
          No equippable items in inventory
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 gap-2 mt-4">
        {equippableItems.map(item => {
          const canEquip = !item.equipmentStats?.requiredClass || 
                          item.equipmentStats.requiredClass === 'any' || 
                          item.equipmentStats.requiredClass === user.playerClass;
          
          const meetsLevelReq = user.level >= (item.equipmentStats?.requiredLevel || 1);
          const isSecondaryWeaponLocked = item.equipmentStats?.slot === 'secondaryWeapon' && user.level < 5;
          
          return (
            <div key={item.id} className="relative">
              <Card className={`bg-lorequest-gold/10 border-lorequest-gold/30 hover:bg-lorequest-gold/20 transition-colors ${(!canEquip || !meetsLevelReq || isSecondaryWeaponLocked) ? 'opacity-50' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-lorequest-gold font-medium">
                          {item.icon && <span className="mr-1">{item.icon}</span>}
                          {item.name}
                        </span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {getSlotName(item.equipmentStats?.slot || 'mainWeapon')}
                        </Badge>
                        <span className="text-xs text-lorequest-parchment/70">
                          x{item.quantity}
                        </span>
                      </div>
                      
                      {item.description && (
                        <div className="text-xs text-lorequest-parchment mb-1">
                          {item.description}
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        {item.equipmentStats?.armor && (
                          <div className="text-xs text-lorequest-parchment/70">
                            Armor: +{item.equipmentStats.armor}
                          </div>
                        )}
                        
                        {item.equipmentStats?.statBonuses?.map((bonus, idx) => (
                          <div key={idx} className="text-xs text-lorequest-gold/80">
                            +{bonus.value} {bonus.attribute.charAt(0).toUpperCase() + bonus.attribute.slice(1)}
                          </div>
                        ))}
                        
                        {item.equipmentStats?.requiredClass && item.equipmentStats.requiredClass !== 'any' && (
                          <div className="text-xs text-lorequest-parchment/70">
                            Required Class: {item.equipmentStats.requiredClass}
                          </div>
                        )}
                        
                        {item.equipmentStats?.requiredLevel && item.equipmentStats.requiredLevel > 1 && (
                          <div className="text-xs text-lorequest-parchment/70">
                            Required Level: {item.equipmentStats.requiredLevel}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              size="sm"
                              disabled={!canEquip || !meetsLevelReq || isSecondaryWeaponLocked}
                              onClick={() => handleEquipItem(item.id)}
                              className="bg-lorequest-gold hover:bg-lorequest-highlight text-lorequest-dark font-medium"
                            >
                              Equip
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {(!canEquip || !meetsLevelReq || isSecondaryWeaponLocked) && (
                          <TooltipContent>
                            {!canEquip 
                              ? `Only ${item.equipmentStats?.requiredClass} can equip this item` 
                              : !meetsLevelReq 
                              ? `Requires Level ${item.equipmentStats?.requiredLevel}` 
                              : `Secondary weapon slot unlocks at Level 5`}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-lorequest-gold mb-3">Equipment</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {renderEquipmentSlot('mainWeapon')}
          {renderEquipmentSlot('secondaryWeapon')}
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {renderEquipmentSlot('head')}
          {renderEquipmentSlot('body')}
          {renderEquipmentSlot('legs')}
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
          {renderEquipmentSlot('hands')}
          {renderEquipmentSlot('feet')}
        </div>
        
        <div className="mt-4 p-3 bg-lorequest-gold/10 rounded-lg">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-lorequest-parchment/70">Armor</div>
              <div className="text-lorequest-gold font-medium">{user.armor || 0}</div>
            </div>
            <div>
              <div className="text-xs text-lorequest-parchment/70">Strength</div>
              <div className="text-lorequest-gold font-medium">{user.stats?.strength || 0}</div>
            </div>
            <div>
              <div className="text-xs text-lorequest-parchment/70">Intelligence</div>
              <div className="text-lorequest-gold font-medium">{user.stats?.intelligence || 0}</div>
            </div>
            <div>
              <div className="text-xs text-lorequest-parchment/70">Dexterity</div>
              <div className="text-lorequest-gold font-medium">{user.stats?.dexterity || 0}</div>
            </div>
            <div>
              <div className="text-xs text-lorequest-parchment/70">Health</div>
              <div className="text-lorequest-gold font-medium">{user.health || 0}/{user.maxHealth || 0}</div>
            </div>
            <div>
              <div className="text-xs text-lorequest-parchment/70">Mana</div>
              <div className="text-lorequest-gold font-medium">{user.mana || 0}/{user.maxMana || 0}</div>
            </div>
          </div>
        </div>
      </div>
      
      {showInventory && (
        <div>
          <h3 className="text-base font-semibold text-lorequest-gold mb-2">Equippable Items</h3>
          {renderInventoryItems()}
        </div>
      )}
    </div>
  );
};

export default PlayerEquipment;
