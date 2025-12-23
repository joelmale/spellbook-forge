import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAddSpellbook } from '@/hooks/use-spellbooks';
import { useToast } from '@/hooks/use-toast';

export function CreateSpellbookDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const addSpellbook = useAddSpellbook();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSpellbook = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      spells: [],
      preparedSpells: [],
    };

    addSpellbook.mutate(newSpellbook, {
      onSuccess: () => {
        setOpen(false);
        setName('');
        setDescription('');
        toast({ title: 'Spellbook created' });
      },
      onError: () => {
        toast({ title: 'Failed to create spellbook', variant: 'destructive' });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New Spellbook</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Spellbook</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Spellbook name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <Button type="submit" disabled={addSpellbook.isPending}>
            {addSpellbook.isPending ? 'Creating...' : 'Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
