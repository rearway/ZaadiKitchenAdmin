import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import {
  getWeeksApi,
  getWeekDetailApi,
  getMealsApi,
  getMealsPickerApi,
  assignSlotApi,
  clearSlotApi,
  publishWeekApi,
  createMealApi,
  updateMealApi,
  updateMealStatusApi,
  getPhotoUploadUrlApi,
  uploadToS3Api,
  importMealsApi,
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

/** Returns active meals with already_used flag for the given week (for the meal picker modal). */
export function useMealsPicker(weekId: string) {
  return useQuery({
    queryKey: queryKeys.menu.mealsPicker(weekId),
    queryFn: () => getMealsPickerApi(weekId),
    enabled: !!weekId,
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
    mutationFn: ({
      id,
      status,
      confirmPublishedEdit,
    }: {
      id: string;
      status: 'active' | 'draft';
      confirmPublishedEdit?: boolean;
    }) => updateMealStatusApi(id, status, confirmPublishedEdit),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menu.meals }),
  });
}

/**
 * 3-step S3 photo upload:
 *  1. GET presigned URL from API
 *  2. PUT file directly to S3
 *  3. PATCH meal with the returned photo_url
 */
export function usePhotoUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mealId, file }: { mealId: string; file: File }) => {
      const contentType = file.type as 'image/jpeg' | 'image/png' | 'image/webp';
      const { upload_url, photo_url } = await getPhotoUploadUrlApi(mealId, contentType);
      await uploadToS3Api(upload_url, file);
      await updateMealApi(mealId, { photo_url });
      return photo_url;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menu.meals }),
  });
}

/** XLSX bulk import. All imported meals are saved as draft. */
export function useImportMeals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importMealsApi(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menu.meals }),
  });
}
