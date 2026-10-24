import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import { fetchMenuWeeks } from '../api/menu.api';
import {
  resolveWeekAheadAccess,
  weeksWithinHorizon,
  type WeekAheadAccess,
  type WeekAheadSignal,
} from '../model/week-horizon';

function signalFromParts(locked: boolean | null, unlockAt: string | null): WeekAheadSignal | null {
  if (locked === null && unlockAt === null) return null;
  return { locked, unlockAt };
}

/** Re-resolves the horizon when the tab wakes or the unlock instant is reached. */
function useWeekAheadClock(signal: WeekAheadSignal | null): WeekAheadAccess {
  const lockedFlag = signal?.locked ?? null;
  const unlockAtIso = signal?.unlockAt ?? null;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    const access = resolveWeekAheadAccess(new Date(), signalFromParts(lockedFlag, unlockAtIso));
    let timeout = 0;
    if (access.locked) {
      const wait = access.unlockAt.getTime() - Date.now();
      // setTimeout delay must stay inside the signed 32-bit range.
      if (wait > 0 && wait < 2_147_483_647) timeout = window.setTimeout(refresh, wait);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [lockedFlag, unlockAtIso]);

  return resolveWeekAheadAccess(now, signalFromParts(lockedFlag, unlockAtIso));
}

export function useMenuPlannerWeeks() {
  const clientAccess = useWeekAheadClock(null);
  const query = useQuery({
    queryKey: [...queryKeys.menu.weeks, clientAccess.listCount],
    queryFn: () => fetchMenuWeeks(clientAccess.listCount),
    placeholderData: keepPreviousData,
  });
  const access = useWeekAheadClock(query.data?.signal ?? null);
  const weeks = weeksWithinHorizon(query.data?.weeks ?? [], access);

  return {
    weeks,
    access,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/** Week list for surfaces that only need the visible planner weeks. */
export function useWeeks() {
  const planner = useMenuPlannerWeeks();
  return {
    data: planner.weeks,
    isLoading: planner.isLoading,
    isError: planner.isError,
  };
}
