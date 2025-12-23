import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Spell, Spellbook } from '@shared/schema';
import { GripVertical, Plus, Shield, Wand2, Eye, Heart, Flame, Sparkles, Skull, Shuffle, Star } from 'lucide-react';

interface SpellCardProps {
  spell: Spell;
  spellbooks?: Spellbook[];
  onAddToSpellbook?: (spellbookId: string, spellId: string) => void;
  onToggleFavorite?: (nextFavorite: boolean) => void;
}

const schoolIcons = {
  abjuration: Shield,
  conjuration: Wand2,
  divination: Eye,
  enchantment: Heart,
  evocation: Flame,
  illusion: Sparkles,
  necromancy: Skull,
  transmutation: Shuffle,
};

const schoolColors = {
  abjuration: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200',
  conjuration: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200',
  divination: 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-200',
  enchantment: 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900 dark:border-pink-700 dark:text-pink-200',
  evocation: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200',
  illusion: 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900 dark:border-indigo-700 dark:text-indigo-200',
  necromancy: 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200',
  transmutation: 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-200',
};

export function SpellCard({ spell, spellbooks, onAddToSpellbook, onToggleFavorite }: SpellCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: spell.id,
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const schoolKey = (spell.school ?? '').toLowerCase() as keyof typeof schoolIcons;
  const Icon = schoolIcons[schoolKey] || Wand2;
  const colorClass = schoolColors[schoolKey] || 'bg-gradient-to-b from-gray-100 to-gray-200 border-gray-400 text-gray-800';
  const durationText = spell.duration ?? '';
  const castingTimeText = spell.castingTime ?? '';
  const isConcentration = durationText.toLowerCase().includes('concentration');
  const isRitual = castingTimeText.toLowerCase().includes('ritual');
  const durationLabel = durationText.replace(/Concentration,\s*/i, 'Conc. ');
  const isPrismaticWall = spell.name === 'Prismatic Wall';
  const prismaticDescription = isPrismaticWall
    ? spell.description?.split('| Order | Effects')[0]?.trim()
    : spell.description;
  const dragHandleProps = { ...listeners, ...attributes };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card
        ref={setNodeRef}
        style={style}
        className={`cursor-grab transition-all duration-200 hover:scale-105 hover:shadow-2xl w-44 h-60 rounded-lg overflow-hidden motion-reduce:transition-none motion-reduce:hover:scale-100 ${isDragging ? 'opacity-50 rotate-3 motion-reduce:rotate-0' : ''} ${colorClass} border-4 shadow-lg bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900`}
        onClick={() => {
          if (!isDragging) {
            setIsOpen(true);
          }
        }}
      >
        <CardContent className="p-3.5 h-full flex flex-col justify-between">
          {/* Top section */}
          <div className="text-center">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label="Drag spell"
                {...dragHandleProps}
              >
                <GripVertical className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {onToggleFavorite ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={spell.favorite ? 'Unfavorite spell' : 'Favorite spell'}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleFavorite(!spell.favorite);
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <Star
                      className={`w-4 h-4 ${spell.favorite ? 'text-amber-500' : 'text-muted-foreground'}`}
                      fill={spell.favorite ? 'currentColor' : 'none'}
                    />
                  </Button>
                ) : null}
                {spellbooks && spellbooks.length > 0 && onAddToSpellbook ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Add to spellbook"
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {spellbooks.map((spellbook) => (
                        <DropdownMenuItem
                          key={spellbook.id}
                          onSelect={() => onAddToSpellbook(spellbook.id, spell.id)}
                        >
                          {spellbook.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="w-6" />
                )}
              </div>
            </div>
            <h3 className="font-serif font-bold text-sm leading-tight text-center mb-1">{spell.name}</h3>
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/20 text-primary border-primary/30">
              {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
            </Badge>
          </div>

          {/* Middle section */}
          <div className="text-center">
            <Badge variant="outline" className="text-xs px-2 py-0.5 border-primary/50 text-primary/80">
              {spell.school || 'Unknown'}
            </Badge>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {isRitual && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  Ritual
                </Badge>
              )}
              {isConcentration && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  Conc.
                </Badge>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
              <span className="truncate">Cast: {castingTimeText || '—'}</span>
              <span className="truncate">Range: {spell.range || '—'}</span>
              <span className="truncate">Dur: {durationLabel || '—'}</span>
              <span className="truncate">Comp: {spell.components || '—'}</span>
            </div>
          </div>

          {/* Bottom section */}
          <div className="text-center">
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted/50">
              {spell.edition}
            </Badge>
          </div>
        </CardContent>
      </Card>
      <DialogContent
        className={`${isPrismaticWall ? 'max-w-4xl' : 'max-w-2xl'} max-h-[80vh] overflow-y-auto`}
      >
        <DialogHeader>
          <DialogTitle className="font-serif">{spell.name}</DialogTitle>
          <DialogDescription>
            {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • {spell.school || 'Unknown'} • {spell.edition}
          </DialogDescription>
        </DialogHeader>
        {spell.name === 'Prismatic Wall' ? (
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm text-muted-foreground">
              <tbody>
                <tr className="border-b border-border">
                  <th className="w-36 bg-muted/40 px-3 py-2 text-left font-medium text-foreground">Casting Time</th>
                  <td className="px-3 py-2">{castingTimeText || '—'}</td>
                </tr>
                <tr className="border-b border-border">
                  <th className="bg-muted/40 px-3 py-2 text-left font-medium text-foreground">Range</th>
                  <td className="px-3 py-2">{spell.range || '—'}</td>
                </tr>
                <tr className="border-b border-border">
                  <th className="bg-muted/40 px-3 py-2 text-left font-medium text-foreground">Components</th>
                  <td className="px-3 py-2">{spell.components || '—'}</td>
                </tr>
                <tr className="border-b border-border">
                  <th className="bg-muted/40 px-3 py-2 text-left font-medium text-foreground">Duration</th>
                  <td className="px-3 py-2">{durationLabel || '—'}</td>
                </tr>
                <tr>
                  <th className="bg-muted/40 px-3 py-2 text-left font-medium text-foreground">Classes</th>
                  <td className="px-3 py-2">{(spell.classes || []).join(', ') || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div><span className="font-medium text-foreground">Casting Time:</span> {castingTimeText || '—'}</div>
            <div><span className="font-medium text-foreground">Range:</span> {spell.range || '—'}</div>
            <div><span className="font-medium text-foreground">Components:</span> {spell.components || '—'}</div>
            <div><span className="font-medium text-foreground">Duration:</span> {durationLabel || '—'}</div>
            <div><span className="font-medium text-foreground">Classes:</span> {(spell.classes || []).join(', ') || '—'}</div>
          </div>
        )}
        {isPrismaticWall ? (
          <div className="space-y-4">
            <div className="text-sm whitespace-pre-wrap text-foreground">
              {prismaticDescription ? prismaticDescription : 'No description provided.'}
            </div>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm text-muted-foreground">
                <thead className="bg-muted/40 text-foreground">
                  <tr>
                    <th className="w-20 px-3 py-2 text-left font-medium">Order</th>
                    <th className="px-3 py-2 text-left font-medium">Effects</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2">1</td>
                    <td className="px-3 py-2"><strong>Red.</strong> Failed Save: 12d6 Fire damage. Successful Save: Half as much damage. Additional Effects: Nonmagical ranged attacks cannot pass through this layer, which is destroyed if it takes at least 25 Cold damage.</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2">2</td>
                    <td className="px-3 py-2"><strong>Orange.</strong> Failed Save: 12d6 Acid damage. Successful Save: Half as much damage. Additional Effects: Magical ranged attacks cannot pass through this layer, which is destroyed by a strong wind (such as the one created by Gust of Wind).</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2">3</td>
                    <td className="px-3 py-2"><strong>Yellow.</strong> Failed Save: 12d6 Lightning damage. Successful Save: Half as much damage. Additional Effects: The layer is destroyed if it takes at least 60 Force damage.</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2">4</td>
                    <td className="px-3 py-2"><strong>Green.</strong> Failed Save: 12d6 Poison damage. Successful Save: Half as much damage. Additional Effects: A Passwall spell, or another spell of equal or greater level that can open a portal on a solid surface, destroys this layer.</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2">5</td>
                    <td className="px-3 py-2"><strong>Blue.</strong> Failed Save: 12d6 Cold damage. Successful Save: Half as much damage. Additional Effects: The layer is destroyed if it takes at least 25 Fire damage.</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2">6</td>
                    <td className="px-3 py-2"><strong>Indigo.</strong> Failed Save: The target has the Restrained condition and makes a Constitution saving throw at the end of each of its turns. If it successfully saves three times, the condition ends. If it fails three times, it has the Petrified condition until it is freed by an effect like the Greater Restoration spell. The successes and failures need not be consecutive; keep track of both until the target collects three of a kind. Additional Effects: Spells cannot be</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap text-foreground">
            {spell.description?.trim() ? spell.description : 'No description provided.'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
