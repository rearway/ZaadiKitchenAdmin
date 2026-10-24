import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import { ApiError } from '@/shared/types/api';
import {
  getWeekDetailApi,
  getMealsApi,
  getMealDetailApi,
  getMealRatingsApi,
  getAssignableMealsApi,
  assignSlotApi,
  addDaySlotApi,
  setDayDefaultApi,
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
  type GetMealsParams,
  type Meal,
  type MealType,
  type UpdateMealInput,
} from '../model/menu.schema';
import { MEAL_RATINGS_PAGE_SIZE, type GetMealRatingsParams } from '../model/meal-ratings.schema';

function invalidateWeek(qc: QueryClient, weekId: string) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.menu.weekDetail(weekId) }),
    qc.invalidateQueries({ queryKey: queryKeys.menu.weeks }),
  ]);
}

export function useWeekDetail(weekId: string) {
  return useQuery({
    queryKey: queryKeys.menu.weekDetail(weekId),
    queryFn: () => getWeekDetailApi(weekId),
    enabled: !!weekId,
  });
}

export function useMeals(params: GetMealsParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.menu.meals, params],
    queryFn: () => getMealsApi(params),
  });
}

export function useMealDetail(mealId: string) {
  return useQuery({
    queryKey: queryKeys.menu.mealDetail(mealId),
    queryFn: () => getMealDetailApi(mealId),
    enabled: !!mealId,
  });
}

export function useMealRatings(mealId: string, params: GetMealRatingsParams = {}) {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? MEAL_RATINGS_PAGE_SIZE;
  const queryParams = { page, perPage };
  return useQuery({
    queryKey: queryKeys.menu.mealRatings(mealId, queryParams),
    queryFn: () => getMealRatingsApi(mealId, queryParams),
    enabled: !!mealId,
    placeholderData: keepPreviousData,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 401)) {
        return false;
      }
      return failureCount < 2;
    },
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
    onSuccess: () => invalidateWeek(qc, weekId),
    onError: (err) => {
      const { kind } = classifyAssignError(err);
      if (kind === 'slot_not_editable' || kind === 'not_found') {
        invalidateWeek(qc, weekId);
      }
      if (kind === 'meal_is_draft') {
        qc.invalidateQueries({ queryKey: queryKeys.menu.meals });
      }
    },
  });
}

export function useAddDaySlot(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      deliveryDate,
      meal_type,
      meal_id,
    }: {
      deliveryDate: string;
      meal_type: MealType;
      meal_id?: string;
    }) => addDaySlotApi(weekId, deliveryDate, { meal_type, meal_id }),
    onSuccess: () => invalidateWeek(qc, weekId),
  });
}

export function useSetDayDefault(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      deliveryDate,
      meal_type,
      meal_id,
    }: {
      deliveryDate: string;
      meal_type: MealType;
      meal_id: string;
    }) => setDayDefaultApi(weekId, deliveryDate, { meal_type, meal_id }),
    onSuccess: () => invalidateWeek(qc, weekId),
  });
}

export function useClearSlot(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => clearSlotApi(weekId, slotId),
    onSuccess: () => invalidateWeek(qc, weekId),
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
    onSuccess: (_, { id }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.menu.meals }),
        qc.invalidateQueries({ queryKey: queryKeys.menu.mealDetail(id) }),
      ]),
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
    onSuccess: (_, { id }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.menu.meals }),
        qc.invalidateQueries({ queryKey: queryKeys.menu.mealDetail(id) }),
      ]),
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
    onSuccess: (_, { mealId }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.menu.meals }),
        qc.invalidateQueries({ queryKey: queryKeys.menu.mealDetail(mealId) }),
      ]),
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
