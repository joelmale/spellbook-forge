import { useEffect, useMemo, useState } from 'react';
import { storage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToastAction } from '@/components/ui/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSpells, useUpdateSpell } from '@/hooks/use-spells';
import { useSpellbooks, useUpdateSpellbook } from '@/hooks/use-spellbooks';
import { SpellCard } from '@/components/SpellCard';
import { CreateSpellbookDialog } from '@/components/CreateSpellbookDialog';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { DroppableSpellbook } from '@/components/DroppableSpellbook';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Download, Upload } from 'lucide-react';
import { Spell } from '@shared/schema';

function Dashboard() {
  const { data: spells = [], isLoading: spellsLoading } = useSpells();
  const { data: spellbooks = [], isLoading: spellbooksLoading } = useSpellbooks();
  const updateSpellbook = useUpdateSpellbook();
  const updateSpell = useUpdateSpell();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [editionFilter, setEditionFilter] = useState<'all' | '2014' | '2024'>('2024');
  const [selectedLevel, setSelectedLevel] = useState<'all' | string>('all');
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [filterRitual, setFilterRitual] = useState(false);
  const [filterConcentration, setFilterConcentration] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [sessionMode, setSessionMode] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(storage.getLastUpdated());
  const isMobile = useIsMobile();

  useEffect(() => {
    const stored = localStorage.getItem('spellbook-session-mode');
    if (stored) {
      setSessionMode(stored === 'true');
    }
  }, []);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      setLastUpdatedAt(detail ?? storage.getLastUpdated());
    };
    window.addEventListener('spellbook-last-updated', handleUpdate);
    return () => window.removeEventListener('spellbook-last-updated', handleUpdate);
  }, []);

  const formatLastUpdated = (timestamp: number | null) => {
    if (!timestamp) {
      return 'Not saved yet';
    }
    const date = new Date(timestamp);
    return `Saved ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const schoolOptions = useMemo(() => {
    const options = Array.from(new Set(spells.map(spell => spell.school.toLowerCase())));
    return options.sort();
  }, [spells]);

  const filteredSpells = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return spells.filter((spell) => {
      if (editionFilter !== 'all' && spell.edition !== editionFilter) {
        return false;
      }
      if (selectedLevel !== 'all' && spell.level !== Number(selectedLevel)) {
        return false;
      }
      if (selectedSchools.length > 0 && !selectedSchools.includes(spell.school.toLowerCase())) {
        return false;
      }
      if (filterRitual && !spell.castingTime.toLowerCase().includes('ritual')) {
        return false;
      }
      if (filterConcentration && !spell.duration.toLowerCase().includes('concentration')) {
        return false;
      }
      if (filterFavorites && !spell.favorite) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = `${spell.name} ${spell.school} ${spell.classes.join(' ')}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [
    spells,
    editionFilter,
    selectedLevel,
    selectedSchools,
    filterRitual,
    filterConcentration,
    filterFavorites,
    searchTerm,
  ]);

  const toggleSchool = (school: string) => {
    setSelectedSchools((prev) => (
      prev.includes(school) ? prev.filter((value) => value !== school) : [...prev, school]
    ));
  };

  const resetFilters = () => {
    setSelectedLevel('all');
    setSelectedSchools([]);
    setFilterRitual(false);
    setFilterConcentration(false);
    setFilterFavorites(false);
  };

  const hasActiveFilters = selectedLevel !== 'all' || selectedSchools.length > 0 || filterRitual || filterConcentration || filterFavorites;

  const addSpellToSpellbook = (spellbookId: string, spellId: string) => {
    const spellbook = spellbooks.find(sb => sb.id === spellbookId);
    if (!spellbook) {
      return;
    }
    if (spellbook.spells.includes(spellId)) {
      toast({ title: 'Spell already in spellbook' });
      return;
    }
    const previous = { ...spellbook, spells: [...spellbook.spells] };
    const updated = { ...spellbook, spells: [...spellbook.spells, spellId] };
    updateSpellbook.mutate(updated);
    const spell = spells.find(item => item.id === spellId);
    if (spell) {
      updateSpell.mutate({ ...spell, lastUsed: Date.now() });
    }
    toast({
      title: 'Spell added to spellbook',
      action: (
        <ToastAction altText="Undo add" onClick={() => updateSpellbook.mutate(previous)}>
          Undo
        </ToastAction>
      ),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      addSpellToSpellbook(over.id as string, active.id as string);
    }
  };

  const handleExport = async () => {
    try {
      const data = await storage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spellbook-data.json';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Data exported successfully' });
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = e.target?.result as string;
          await storage.importData(json);
          toast({ title: 'Data imported successfully' });
        } catch {
          toast({ title: 'Import failed: Invalid file', variant: 'destructive' });
        }
      };
      reader.readAsText(file);
    }
  };

  if (spellsLoading || spellbooksLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse motion-reduce:animate-none" />
        <p className="text-lg font-serif">Loading your magical library...</p>
      </div>
    </div>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Spellbook Forge
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-xs text-muted-foreground">
                  {formatLastUpdated(lastUpdatedAt)}
                </div>
                <Button
                  type="button"
                  variant={sessionMode ? 'secondary' : 'outline'}
                  onClick={() => {
                    const next = !sessionMode;
                    setSessionMode(next);
                    localStorage.setItem('spellbook-session-mode', String(next));
                  }}
                >
                  Session Mode
                </Button>
                <CreateSpellbookDialog />
                <Button variant="outline" onClick={handleExport} className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <Button variant="outline" asChild className="gap-2">
                  <label htmlFor="import-file">
                    <Upload className="w-4 h-4" />
                    Import
                  </label>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {isMobile ? (
            <Tabs defaultValue="library" className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger value="library" className="flex-1">
                  Arcane Library
                </TabsTrigger>
                <TabsTrigger value="spellbooks" className="flex-1">
                  Spellbooks
                </TabsTrigger>
              </TabsList>
              <TabsContent value="library">
                <div className="lg:col-span-2">
                  <Card className="h-full bg-gradient-to-br from-card to-muted/30 border-2">
                    <CardHeader className="border-b border-border">
                      <CardTitle className="flex items-center gap-2 font-serif">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Arcane Library
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Drag spells into your spellbooks below
                      </p>
                      <div className="mt-3 space-y-2">
                        <Input
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="Search by name, school, or class"
                          aria-label="Search spells"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <ToggleGroup
                            type="single"
                            value={editionFilter}
                            onValueChange={(value) => {
                              if (value) {
                                setEditionFilter(value as 'all' | '2014' | '2024');
                              }
                            }}
                            className="justify-start"
                          >
                            <ToggleGroupItem value="all" aria-label="Show all editions">
                              All
                            </ToggleGroupItem>
                            <ToggleGroupItem value="2014" aria-label="Show 2014 spells">
                              2014
                            </ToggleGroupItem>
                            <ToggleGroupItem value="2024" aria-label="Show 2024 spells">
                              2024
                            </ToggleGroupItem>
                          </ToggleGroup>
                          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                            <SelectTrigger className="w-40">
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
                        </div>
                        {!sessionMode && (
                          <div className="flex flex-wrap gap-2">
                            {schoolOptions.map((school) => (
                              <Button
                                key={school}
                                type="button"
                                size="sm"
                                variant={selectedSchools.includes(school) ? 'secondary' : 'outline'}
                                onClick={() => toggleSchool(school)}
                                aria-pressed={selectedSchools.includes(school)}
                              >
                                {school}
                              </Button>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {!sessionMode && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant={filterRitual ? 'secondary' : 'outline'}
                                onClick={() => setFilterRitual((value) => !value)}
                                aria-pressed={filterRitual}
                              >
                                Ritual
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={filterConcentration ? 'secondary' : 'outline'}
                                onClick={() => setFilterConcentration((value) => !value)}
                                aria-pressed={filterConcentration}
                              >
                                Concentration
                              </Button>
                            </>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant={filterFavorites ? 'secondary' : 'outline'}
                            onClick={() => setFilterFavorites((value) => !value)}
                            aria-pressed={filterFavorites}
                          >
                            Favorites
                          </Button>
                          {hasActiveFilters && (
                            <Button type="button" size="sm" variant="ghost" onClick={resetFilters}>
                              Clear filters
                            </Button>
                          )}
                        </div>
                      </div>
                </CardHeader>
                <CardContent className="p-4">
                  {!sessionMode && (
                    <>
                      <FavoriteSpellsSection spells={spells} editionFilter={editionFilter} />
                      <RecentSpellsSection spells={spells} editionFilter={editionFilter} />
                    </>
                  )}
                  {filteredSpells.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No spells match your search.
                        </div>
                      ) : (
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(176px,1fr))] gap-4 max-h-[70vh] overflow-y-auto justify-items-center">
                          {filteredSpells.map(spell => (
                            <SpellCard
                              key={spell.id}
                              spell={spell}
                              spellbooks={spellbooks}
                              onAddToSpellbook={addSpellToSpellbook}
                              onToggleFavorite={(nextFavorite) =>
                                updateSpell.mutate({ ...spell, favorite: nextFavorite })
                              }
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="spellbooks">
                <div className="lg:col-span-1">
                  <div className="space-y-4">
                    {spellbooks.length === 0 ? (
                      <Card className="text-center py-12 bg-gradient-to-br from-card to-muted/30">
                        <CardContent>
                          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-xl font-serif mb-2">No Spellbooks Yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Create your first spellbook to begin collecting spells
                          </p>
                          <CreateSpellbookDialog />
                        </CardContent>
                      </Card>
                    ) : (
                      spellbooks.map(spellbook => (
                        <DroppableSpellbook
                          key={spellbook.id}
                          spellbook={spellbook}
                          allSpells={spells}
                          sessionMode={sessionMode}
                        />
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-120px)]">
              {/* Spell Library */}
              <div className="lg:col-span-2">
                <Card className="h-full bg-gradient-to-br from-card to-muted/30 border-2">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="flex items-center gap-2 font-serif">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Arcane Library
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Drag spells into your spellbooks below
                    </p>
                    <div className="mt-3 space-y-2">
                      <Input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by name, school, or class"
                        aria-label="Search spells"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <ToggleGroup
                          type="single"
                          value={editionFilter}
                          onValueChange={(value) => {
                            if (value) {
                              setEditionFilter(value as 'all' | '2014' | '2024');
                            }
                          }}
                          className="justify-start"
                        >
                          <ToggleGroupItem value="all" aria-label="Show all editions">
                            All
                          </ToggleGroupItem>
                          <ToggleGroupItem value="2014" aria-label="Show 2014 spells">
                            2014
                          </ToggleGroupItem>
                          <ToggleGroupItem value="2024" aria-label="Show 2024 spells">
                            2024
                          </ToggleGroupItem>
                        </ToggleGroup>
                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                          <SelectTrigger className="w-40">
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
                      </div>
                      {!sessionMode && (
                        <div className="flex flex-wrap gap-2">
                          {schoolOptions.map((school) => (
                            <Button
                              key={school}
                              type="button"
                              size="sm"
                              variant={selectedSchools.includes(school) ? 'secondary' : 'outline'}
                              onClick={() => toggleSchool(school)}
                              aria-pressed={selectedSchools.includes(school)}
                            >
                              {school}
                            </Button>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {!sessionMode && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant={filterRitual ? 'secondary' : 'outline'}
                              onClick={() => setFilterRitual((value) => !value)}
                              aria-pressed={filterRitual}
                            >
                              Ritual
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={filterConcentration ? 'secondary' : 'outline'}
                              onClick={() => setFilterConcentration((value) => !value)}
                              aria-pressed={filterConcentration}
                            >
                              Concentration
                            </Button>
                          </>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant={filterFavorites ? 'secondary' : 'outline'}
                          onClick={() => setFilterFavorites((value) => !value)}
                          aria-pressed={filterFavorites}
                        >
                          Favorites
                        </Button>
                        {hasActiveFilters && (
                          <Button type="button" size="sm" variant="ghost" onClick={resetFilters}>
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {!sessionMode && (
                      <>
                        <FavoriteSpellsSection spells={spells} editionFilter={editionFilter} />
                        <RecentSpellsSection spells={spells} editionFilter={editionFilter} />
                      </>
                    )}
                    {filteredSpells.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No spells match your search.
                      </div>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(176px,1fr))] gap-4 max-h-[70vh] overflow-y-auto justify-items-center">
                        {filteredSpells.map(spell => (
                          <SpellCard
                            key={spell.id}
                            spell={spell}
                            spellbooks={spellbooks}
                            onAddToSpellbook={addSpellToSpellbook}
                            onToggleFavorite={(nextFavorite) =>
                              updateSpell.mutate({ ...spell, favorite: nextFavorite })
                            }
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Spellbooks */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  {spellbooks.length === 0 ? (
                    <Card className="text-center py-12 bg-gradient-to-br from-card to-muted/30">
                      <CardContent>
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-serif mb-2">No Spellbooks Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create your first spellbook to begin collecting spells
                        </p>
                        <CreateSpellbookDialog />
                      </CardContent>
                    </Card>
                  ) : (
                    spellbooks.map(spellbook => (
                      <DroppableSpellbook
                        key={spellbook.id}
                        spellbook={spellbook}
                        allSpells={spells}
                        sessionMode={sessionMode}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </DndContext>
  );
}

function FavoriteSpellsSection({
  spells,
  editionFilter,
}: {
  spells: Spell[];
  editionFilter: 'all' | '2014' | '2024';
}) {
  const favoriteSpells = useMemo(() => {
    return spells
      .filter((spell) => (editionFilter === 'all' ? true : spell.edition === editionFilter))
      .filter((spell) => spell.favorite)
      .slice(0, 6);
  }, [spells, editionFilter]);

  if (favoriteSpells.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-md border border-border bg-muted/20 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Favorites
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {favoriteSpells.map((spell) => (
          <span
            key={spell.id}
            className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm"
          >
            {spell.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function RecentSpellsSection({
  spells,
  editionFilter,
}: {
  spells: Spell[];
  editionFilter: 'all' | '2014' | '2024';
}) {
  const recentSpells = useMemo(() => {
    return spells
      .filter((spell) => (editionFilter === 'all' ? true : spell.edition === editionFilter))
      .filter((spell) => (spell.lastUsed ?? 0) > 0)
      .sort((a, b) => (b.lastUsed ?? 0) - (a.lastUsed ?? 0))
      .slice(0, 6);
  }, [spells, editionFilter]);

  if (recentSpells.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-md border border-border bg-muted/20 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Recently used
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {recentSpells.map((spell) => (
          <span
            key={spell.id}
            className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm"
          >
            {spell.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
