import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import {
  getWeeksApi,
  getWeekDetailApi,
  getMealsApi,
  assignSlotApi,
  clearSlotApi,
  publishWeekApi,
  createMealApi,
  updateMealApi,
  updateMealStatusApi,
} from './menu.api';
import type { CreateMealInput, UpdateMealInput } from '../model/menu.schema';

export function useWeeks() {
  return useQuery({
    queryKey: queryKeys.menu.weeks,
    queryFn: getWeeksApi,
  });
}

export function useWeekDetail(weekId: string) {
  return useQuery({
    queryKey: queryKeys.menu.weekDetail(weekId),
    queryFn: () => getWeekDetailApi(weekId),
    enabled: !!weekId,
  });
}

export function useMeals(status?: string) {
  return useQuery({
    queryKey: [...queryKeys.menu.meals, status],
    queryFn: () => getMealsApi(status),
  });
}

export function useAssignSlot(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, mealId }: { slotId: string; mealId: string }) =>
      assignSlotApi(weekId, slotId, mealId),
    onSuccess: () => qc.refetchQueries({ queryKey: queryKeys.menu.weekDetail(weekId) }),
  });
}

export function useClearSlot(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => clearSlotApi(weekId, slotId),
    onSuccess: () => qc.refetchQueries({ queryKey: queryKeys.menu.weekDetail(weekId) }),
  });
}

export function usePublishWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (weekId: string) => publishWeekApi(weekId),
    onSuccess: (_, weekId) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.menu.weeks }),
        qc.invalidateQueries({ queryKey: queryKeys.menu.weekDetail(weekId) }),
      ]),
  });
}

export function useCreateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMealInput) => createMealApi(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menu.meals }),
  });
}

export function useUpdateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMealInput }) =>
      updateMealApi(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menu.meals }),
  });
}

export function useUpdateMealStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'draft' }) =>
      updateMealStatusApi(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menu.meals }),
  });
}
