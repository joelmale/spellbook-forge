import { useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useUpdateSpell } from '@/hooks/use-spells';
import { useUpdateSpellbook } from '@/hooks/use-spellbooks';
import { Spellbook, Spell } from '@shared/schema';
import { BookOpen, Scroll } from 'lucide-react';

interface DroppableSpellbookProps {
  spellbook: Spellbook;
  allSpells: Spell[];
  sessionMode?: boolean;
}

export function DroppableSpellbook({ spellbook, allSpells, sessionMode = false }: DroppableSpellbookProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: spellbook.id,
  });
  const updateSpellbook = useUpdateSpellbook();
  const updateSpell = useUpdateSpell();
  const [filterLevel, setFilterLevel] = useState<'all' | string>('all');
  const [filterPrepared, setFilterPrepared] = useState<'all' | 'prepared' | 'known'>('all');

  const spellsInBook = allSpells.filter(spell => spellbook.spells.includes(spell.id));
  const preparedSpells = spellbook.preparedSpells ?? [];
  const preparedCount = spellsInBook.filter(spell => preparedSpells.includes(spell.id)).length;
  const emptyMessage = spellsInBook.length === 0
    ? 'Drop spells here to add them to your spellbook'
    : sessionMode
      ? 'No prepared spells yet'
      : 'No spells match these filters';

  const visibleSpells = useMemo(() => {
    const preparedFilter = sessionMode ? 'prepared' : filterPrepared;
    return spellsInBook.filter((spell) => {
      if (filterLevel !== 'all' && spell.level !== Number(filterLevel)) {
        return false;
      }
      if (preparedFilter === 'prepared' && !preparedSpells.includes(spell.id)) {
        return false;
      }
      if (preparedFilter === 'known' && preparedSpells.includes(spell.id)) {
        return false;
      }
      return true;
    });
  }, [spellsInBook, preparedSpells, filterLevel, filterPrepared, sessionMode]);

  const togglePrepared = (spellId: string) => {
    const nextPrepared = preparedSpells.includes(spellId)
      ? preparedSpells.filter(id => id !== spellId)
      : [...preparedSpells, spellId];
    updateSpellbook.mutate({ ...spellbook, preparedSpells: nextPrepared });
    const spell = allSpells.find(item => item.id === spellId);
    if (spell) {
      updateSpell.mutate({ ...spell, lastUsed: Date.now() });
    }
  };

  const prepareLevel = () => {
    if (filterLevel === 'all') {
      return;
    }
    const levelIds = spellsInBook.filter(spell => spell.level === Number(filterLevel)).map(spell => spell.id);
    const nextPrepared = Array.from(new Set([...preparedSpells, ...levelIds]));
    updateSpellbook.mutate({ ...spellbook, preparedSpells: nextPrepared });
  };

  const removeLevel = () => {
    if (filterLevel === 'all') {
      return;
    }
    const levelIds = new Set(spellsInBook.filter(spell => spell.level === Number(filterLevel)).map(spell => spell.id));
    const nextSpells = spellbook.spells.filter(id => !levelIds.has(id));
    const nextPrepared = preparedSpells.filter(id => !levelIds.has(id));
    updateSpellbook.mutate({ ...spellbook, spells: nextSpells, preparedSpells: nextPrepared });
  };

  return (
    <Card
      ref={setNodeRef}
      className={`relative transition-all duration-300 hover:shadow-xl border-2 ${
        isOver
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 shadow-amber-200 dark:from-amber-950 dark:to-orange-950 dark:border-amber-600'
          : 'bg-gradient-to-br from-card to-muted/50'
      }`}
    >
      {isOver && (
        <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-amber-400 bg-amber-200/30 flex items-center justify-center text-sm font-medium text-amber-900 dark:text-amber-100">
          Release to add spell
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <CardTitle className="font-serif text-lg">{spellbook.name}</CardTitle>
        </div>
        {spellbook.description && (
          <p className="text-sm text-muted-foreground italic">{spellbook.description}</p>
        )}
        <Badge variant="secondary" className="w-fit">
          <Scroll className="w-3 h-3 mr-1" />
          {preparedCount} prepared / {spellsInBook.length} known
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="0">Cantrip</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                <SelectItem key={level} value={String(level)}>
                  Level {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!sessionMode && (
            <ToggleGroup
              type="single"
              value={filterPrepared}
              onValueChange={(value) => {
                if (value) {
                  setFilterPrepared(value as 'all' | 'prepared' | 'known');
                }
              }}
            >
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="prepared">Prepared</ToggleGroupItem>
              <ToggleGroupItem value="known">Known</ToggleGroupItem>
            </ToggleGroup>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={prepareLevel}
            disabled={filterLevel === 'all'}
          >
            Prepare level
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={removeLevel}
            disabled={filterLevel === 'all'}
          >
            Remove level
          </Button>
        </div>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {visibleSpells.map(spell => (
            <div key={spell.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md border border-muted">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">{spell.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • {spell.school}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={preparedSpells.includes(spell.id) ? 'secondary' : 'outline'}
                  onClick={() => togglePrepared(spell.id)}
                >
                  {preparedSpells.includes(spell.id) ? 'Prepared' : 'Prepare'}
                </Button>
                <Badge variant="outline" className="text-xs">
                  {spell.edition}
                </Badge>
              </div>
            </div>
          ))}
          {visibleSpells.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{emptyMessage}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
