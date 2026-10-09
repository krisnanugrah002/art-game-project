'use client';
import { ComponentType } from 'react';
import { GameProps } from './types';
import dynamic from 'next/dynamic';

const FallbackGame = dynamic(() => import('@/components/games/FallbackGame'), { ssr: false });
const DragSortGame = dynamic(() => import('@/components/games/DragSortGame'), { ssr: false });
const SwipeDeckGame = dynamic(() => import('@/components/games/SwipeDeckGame'), { ssr: false });
const TapMatchGame = dynamic(() => import('@/components/games/TapMatchGame'), { ssr: false });
const MemoryMatchGame = dynamic(() => import('@/components/games/MemoryMatchGame'), { ssr: false });
const ColorMixerGame = dynamic(() => import('@/components/games/ColorMixerGame'), { ssr: false });
const CanvasDrawGame = dynamic(() => import('@/components/games/CanvasDrawGame'), { ssr: false });

export const GAME_REGISTRY: Record<string, ComponentType<GameProps<any>>> = {
  'fallback': FallbackGame,
  
  // Phase B Games
  'drag_sort': DragSortGame,
  'gradient_sort': DragSortGame,
  'timeline_sort': DragSortGame,
  'layer_stack': DragSortGame,
  'map_drag': DragSortGame,
  'pattern_complete': DragSortGame,
  
  'swipe_cards': SwipeDeckGame,
  'depth_swipe': SwipeDeckGame,
  
  'memory_match': MemoryMatchGame,
  
  // Phase C Games (Tap & Canvas)
  'tap_match': TapMatchGame,
  'hotspot_find': TapMatchGame,
  'texture_match': TapMatchGame,
  'who_painted': TapMatchGame,
  'palette_pick': TapMatchGame,
  'focal_tap': TapMatchGame,
  'marathon_quiz': TapMatchGame,
  
  'trace_path': CanvasDrawGame,
  'shade_brush': CanvasDrawGame,
  'shadow_tap': CanvasDrawGame,
  'vanishing_lines': CanvasDrawGame,
  'city_builder': CanvasDrawGame,
  'balance_scale': CanvasDrawGame,
  'thirds_placer': CanvasDrawGame,
  
  // Phase D Games (Racik & Editor)
  'color_mixer': ColorMixerGame,
  'shape_builder': TapMatchGame, // Map to TapMatch for part assembly
};

export function getGameComponent(type: string): ComponentType<GameProps<any>> {
  return GAME_REGISTRY[type] || FallbackGame;
}
