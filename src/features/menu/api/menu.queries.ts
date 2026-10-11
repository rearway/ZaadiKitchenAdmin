import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import {
  getWeeksApi,
  getWeekDetailApi,
  getMealsApi,
  getAssignableMealsApi,
  assignSlotApi,
  clearSlotApi,
  publishWeekApi,
  unpublishWeekApi,
  createMealApi,
  updateMealApi,
  updateMealStatusApi,
  getPhotoUploadUrlApi,
  uploadToS3Api,
  importMealsApi,
} from './menu.api';
import {
  classifyAssignError,
  type AssignableMealsParams,
  type CreateMealInput,
  type Meal,
  type UpdateMealInput,
  type WeekDetail,
} from '../model/menu.schema';

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

export function useAssignableMeals(params: AssignableMealsParams) {
  return useQuery({
    queryKey: queryKeys.menu.assignableMeals(params),
    queryFn: () => getAssignableMealsApi(params),
    placeholderData: keepPreviousData,
  });
}

export function useAssignSlot(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, meal }: { slotId: string; meal: Meal }) =>
      assignSlotApi(weekId, slotId, meal.id),
    onSuccess: (res, { meal }) => {
      qc.setQueryData<WeekDetail>(queryKeys.menu.weekDetail(weekId), (prev) => {
        if (!prev) return prev;
        const { filled_slots, total_slots, publish_ready } = res.week_fill_status;
        const remaining = total_slots - filled_slots;
        return {
          ...prev,
          publishReady: publish_ready,
          publishBlockedReason: publish_ready
            ? null
            : remaining > 0
              ? `${remaining} of ${total_slots} slots still empty`
              : prev.publishBlockedReason,
          slots: prev.slots.map((s) =>
            s.id === res.slot_id
              ? {
                  ...s,
                  is_filled: true,
                  meal: {
                    ...meal,
                    name_en: res.meal.name_en || meal.name_en,
                    meal_type: res.meal.meal_type ?? meal.meal_type,
                    kcal: res.meal.kcal ?? meal.kcal,
                    photo_url: res.meal.photo_url ?? meal.photo_url,
                  },
                }
              : s,
          ),
        };
      });
    },
    onError: (err) => {
      const { kind } = classifyAssignError(err);
      if (kind === 'slot_not_editable' || kind === 'not_found') {
        qc.invalidateQueries({ queryKey: queryKeys.menu.weeks });
      }
      if (kind === 'meal_is_draft') {
        qc.invalidateQueries({ queryKey: queryKeys.menu.meals });
      }
    },
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

export function useUnpublishWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (weekId: string) => unpublishWeekApi(weekId),
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
