import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import { getAppSettingsMealTypes } from './app-settings.api';
import {
  DEFAULT_MEAL_TYPES,
  mealTypeText,
  type MealTypeDisplay,
  type MealTypeLabelVariant,
} from '../model/meal-types';

export function useMealTypeDisplays() {
  const query = useQuery({
    queryKey: queryKeys.appSettings,
    queryFn: getAppSettingsMealTypes,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

  const displays: readonly MealTypeDisplay[] = query.data ?? DEFAULT_MEAL_TYPES;

  return {
    displays,
    label: (mealType: string | null | undefined, variant: MealTypeLabelVariant = 'name') =>
      mealTypeText(mealType, variant, displays),
  };
}
