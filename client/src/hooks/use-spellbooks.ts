import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storage } from '@/lib/storage';
import { Spellbook } from '@shared/schema';

export function useSpellbooks() {
  return useQuery({
    queryKey: ['spellbooks'],
    queryFn: () => storage.getSpellbooks(),
  });
}

export function useAddSpellbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (spellbook: Spellbook) => storage.addSpellbook(spellbook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spellbooks'] });
    },
  });
}

export function useUpdateSpellbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (spellbook: Spellbook) => storage.updateSpellbook(spellbook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spellbooks'] });
    },
  });
}

export function useDeleteSpellbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storage.deleteSpellbook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spellbooks'] });
    },
  });
}