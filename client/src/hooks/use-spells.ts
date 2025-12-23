import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storage } from '@/lib/storage';
import { Spell } from '@shared/schema';

export function useSpells() {
  return useQuery({
    queryKey: ['spells'],
    queryFn: async () => {
      await storage.loadPredefinedSpells();
      return storage.getSpells();
    },
  });
}

export function useAddSpell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (spell: Spell) => storage.addSpell(spell),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spells'] });
    },
  });
}

export function useUpdateSpell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (spell: Spell) => storage.updateSpell(spell),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spells'] });
    },
  });
}

export function useDeleteSpell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storage.deleteSpell(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spells'] });
    },
  });
}
