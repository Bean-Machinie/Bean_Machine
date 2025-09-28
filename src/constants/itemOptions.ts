import { ProjectItemType } from '../context/ProjectContext';

export interface ItemTypeDefinition {
  id: ProjectItemType;
  name: string;
  description: string;
  variants: string[];
}

export const ITEM_TYPE_DEFINITIONS: ItemTypeDefinition[] = [
  {
    id: 'board',
    name: 'Board',
    description: 'Design modular boards for your campaign maps or dungeons.',
    variants: ['Small (18 × 18 in)', 'Medium (24 × 24 in)', 'Large (36 × 36 in)', 'Custom size'],
  },
  {
    id: 'cardDeck',
    name: 'Card Deck',
    description: 'Create decks for abilities, encounters, loot, or encounters.',
    variants: ['Poker (2.5 × 3.5 in)', 'Tarot (2.75 × 4.75 in)', 'Mini (1.75 × 2.5 in)', 'Custom size'],
  },
  {
    id: 'questPoster',
    name: 'Quest Poster',
    description: 'Plan quest summaries, lore pages, or narrative beats.',
    variants: ['A4 (210 × 297 mm)', 'A3 (297 × 420 mm)', 'A2 (420 × 594 mm)', 'Custom size'],
  },
  {
    id: 'custom',
    name: 'Custom Item',
    description: 'Anything else you want to keep alongside your project.',
    variants: ['Custom specification'],
  },
];
