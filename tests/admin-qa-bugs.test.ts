import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CUSTOMER_LIST_STATUS_FILTERS,
  CustomerDetailSchema,
  CustomerListResponseSchema,
  CustomerSchema,
  customerPlanPresentation,
  formatDaysLeft,
  formatMealsLeft,
  formatWalletSar,
} from '../src/features/customers/model/customers.schema.ts';
import {
  DailyOpsSchema,
  pipelineAdvanceInput,
} from '../src/features/daily-ops/model/daily-ops.schema.ts';

const liveDetail = {
  id: 'user-1',
  fullName: 'Nora Ali',
  phone: '+966500000001',
  email: 'nora@example.com',
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  subscription: {
    id: 'sub-1',
    planName: 'Month Plan',
    mealType: 'executive',
    status: 'active',
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    daysRemaining: 0,
    deliveredCount: 4,
    skippedCount: 1,
    totalMealDays: 22,
    skipDaysUsed: 1,
    skipDaysAllowed: 66,
    pauseDaysUsed: 0,
    pauseDaysAllowed: 66,
  },
  walletBalanceSar: 1000,
  primaryAddress: { buildingName: 'Tower 4', floor: '3', areaName: 'Al Olaya' },
  openIssueCount: 2,
};

describe('BUG-008 wallet', () => {
  it('reads the live ledger field and formats it like money', () => {
    const detail = CustomerDetailSchema.parse(liveDetail);
    assert.equal(detail.walletBalance, 1000);
    assert.equal(formatWalletSar(detail.walletBalance), 'SAR 1,000.00');
  });

  it('accepts a numeric string and the mobile balance_sar shape', () => {
    const fromString = CustomerDetailSchema.parse({
      ...liveDetail,
      walletBalanceSar: '1000.50',
    });
    assert.equal(fromString.walletBalance, 1000.5);

    const fromWallet = CustomerDetailSchema.parse({
      id: 'user-2',
      fullName: 'Ada',
      wallet: { balance_sar: 1000 },
      primaryAddress: null,
    });
    assert.equal(fromWallet.walletBalance, 1000);
  });

  it('does not invent SAR 0.00 when the list omits the wallet', () => {
    const list = CustomerListResponseSchema.parse({
      customers: [
        {
          id: 'user-1',
          fullName: 'Nora Ali',
          phone: '+966500000001',
          subscriptionStatus: 'active',
          planName: 'Month Plan',
          endDate: '2026-11-01',
        },
      ],
      pagination: { page: 1, perPage: 20, total: 1, totalPages: 1 },
    });
    assert.equal(list.customers[0]?.walletBalance, null);
    assert.equal(formatWalletSar(list.customers[0]?.walletBalance ?? null), '—');
  });

  it('parses an object address instead of dropping the detail payload', () => {
    const detail = CustomerDetailSchema.parse(liveDetail);
    assert.equal(detail.primaryAddress, 'Tower 4, Floor 3, Al Olaya');
    assert.equal(detail.openIssueCount, 2);
  });
});

describe('BUG-009 subscription status', () => {
  it('keeps Active when the stored status is active and endDate is in the past', () => {
    const detail = CustomerDetailSchema.parse(liveDetail);
    assert.equal(detail.subscriptionStatus, 'active');

    const list = CustomerSchema.parse({
      id: 'user-1',
      fullName: 'Nora Ali',
      subscriptionStatus: 'active',
      endDate: '2020-01-01',
    });
    assert.equal(list.subscriptionStatus, 'active');
  });

  it('keeps Paused and does not treat calendar daysRemaining as Expired', () => {
    const detail = CustomerDetailSchema.parse({
      ...liveDetail,
      subscription: { ...liveDetail.subscription, status: 'paused', daysRemaining: 0 },
    });
    assert.equal(detail.subscriptionStatus, 'paused');
  });
});

describe('BUG-010 days left and meals left', () => {
  it('uses meal days, not the calendar span, and puts meals left on the same count', () => {
    const detail = CustomerDetailSchema.parse(liveDetail);
    assert.equal(detail.daysLeft, 17);
    assert.equal(detail.mealsLeft, 17);
    assert.equal(formatDaysLeft(detail.daysLeft), '17 days left');
    assert.equal(formatMealsLeft(detail.mealsLeft), '17 meals left');
  });

  it('prefers an explicit mobile days_remaining over the calendar field', () => {
    const detail = CustomerDetailSchema.parse({
      ...liveDetail,
      subscription: {
        ...liveDetail.subscription,
        daysRemaining: 3,
        days_remaining: 17,
        mealsLeft: 17,
      },
    });
    assert.equal(detail.daysLeft, 17);
    assert.equal(detail.mealsLeft, 17);
  });

  it('does not show a calendar end date as days left when meal counts are missing', () => {
    const customer = CustomerSchema.parse({
      id: 'user-1',
      fullName: 'Nora Ali',
      subscriptionStatus: 'active',
      endDate: '2026-12-01',
    });
    assert.equal(customer.daysLeft, null);
    assert.equal(customer.mealsLeft, null);
    assert.equal(formatDaysLeft(customer.daysLeft), '— days left');
    assert.equal(formatMealsLeft(customer.mealsLeft), '— meals left');
  });
});

const nedStarkList = {
  id: 'user-ned',
  fullName: 'Ned Stark',
  phone: '+966500000099',
  email: 'ned@example.com',
  isActive: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  subscriptionStatus: null,
  planName: null,
  endDate: null,
  walletBalanceSar: 0,
  totalMealDays: null,
  deliveredCount: null,
  skippedCount: null,
  days_remaining: null,
  mealsLeft: null,
  subscription: null,
};

const nedStarkDetail = {
  id: 'user-ned',
  fullName: 'Ned Stark',
  phone: '+966500000099',
  email: 'ned@example.com',
  isActive: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  subscription: null,
  walletBalanceSar: 0,
  totalMealDays: null,
  deliveredCount: null,
  skippedCount: null,
  days_remaining: null,
  mealsLeft: null,
  primaryAddress: null,
  openIssueCount: 0,
};

describe('no-plan customers', () => {
  it('does not read account isActive as an active plan on the list', () => {
    const list = CustomerListResponseSchema.parse({
      customers: [nedStarkList],
      pagination: { page: 1, perPage: 20, total: 1, totalPages: 1 },
    });
    const customer = list.customers[0];
    assert.ok(customer);
    assert.equal(customer.subscriptionStatus, 'none');
    const presentation = customerPlanPresentation(customer);
    assert.equal(presentation.statusLabel, 'No plan');
    assert.equal(presentation.planLabel, 'No plan');
    assert.equal(presentation.daysLabel, 'No plan');
    assert.equal(presentation.mealsLabel, 'No plan');
    assert.equal(customer.walletBalance, 0);
  });

  it('shows No plan on detail when subscription is null', () => {
    const detail = CustomerDetailSchema.parse(nedStarkDetail);
    assert.equal(detail.subscriptionStatus, 'none');
    const conflicting = CustomerDetailSchema.parse({
      ...nedStarkDetail,
      isActive: true,
      subscriptionStatus: 'active',
    });
    assert.equal(conflicting.subscriptionStatus, 'none');
    assert.equal(detail.daysLeft, null);
    assert.equal(detail.mealsLeft, null);
    const presentation = customerPlanPresentation({
      subscriptionStatus: detail.subscriptionStatus,
      plan: detail.plan,
      daysLeft: detail.daysLeft,
      mealsLeft: detail.mealsLeft,
    });
    assert.equal(presentation.statusLabel, 'No plan');
    assert.equal(presentation.planLabel, 'No plan');
    assert.equal(presentation.daysLabel, 'No plan');
    assert.equal(presentation.mealsLabel, 'No plan');
  });

  it('keeps meal numbers and plan status for a subscribed customer', () => {
    const detail = CustomerDetailSchema.parse(liveDetail);
    assert.equal(detail.subscriptionStatus, 'active');
    assert.equal(detail.daysLeft, 17);
    assert.equal(detail.mealsLeft, 17);
    const presentation = customerPlanPresentation({
      subscriptionStatus: detail.subscriptionStatus,
      plan: detail.plan,
      daysLeft: detail.daysLeft,
      mealsLeft: detail.mealsLeft,
    });
    assert.equal(presentation.statusLabel, 'Active');
    assert.equal(presentation.planLabel, 'Month Plan');
    assert.equal(presentation.daysLabel, '17 days left');
    assert.equal(presentation.mealsLabel, '17 meals left');

    for (const status of ['paused', 'cancelled', 'expired'] as const) {
      const parsed = CustomerDetailSchema.parse({
        ...liveDetail,
        subscription: { ...liveDetail.subscription, status },
      });
      assert.equal(parsed.subscriptionStatus, status);
      assert.equal(parsed.mealsLeft, 17);
      assert.equal(
        customerPlanPresentation({
          subscriptionStatus: parsed.subscriptionStatus,
          plan: parsed.plan,
          daysLeft: parsed.daysLeft,
          mealsLeft: parsed.mealsLeft,
        }).statusLabel,
        status === 'paused' ? 'Paused' : status === 'cancelled' ? 'Cancelled' : 'Expired'
      );
    }
  });

  it('still uses a dash when a plan exists but meal counts are missing', () => {
    const customer = CustomerSchema.parse({
      id: 'user-1',
      fullName: 'Nora Ali',
      subscriptionStatus: 'active',
      planName: 'Month Plan',
    });
    const presentation = customerPlanPresentation(customer);
    assert.equal(presentation.statusLabel, 'Active');
    assert.equal(presentation.daysLabel, '— days left');
    assert.equal(presentation.mealsLabel, '— meals left');
  });
});

describe('BUG-011 churned filter', () => {
  it('is not one of the users list filters', () => {
    assert.deepEqual(
      CUSTOMER_LIST_STATUS_FILTERS.map((filter) => filter.key),
      ['all', 'active', 'paused', 'expired']
    );
  });
});

describe('BUG-013 dispatch status change', () => {
  it('sends the loaded date when marking the day dispatched', () => {
    assert.deepEqual(pipelineAdvanceInput('2026-10-26', 'locked'), {
      date: '2026-10-26',
      from_stage: 'locked',
      to_stage: 'dispatch',
    });
    assert.deepEqual(pipelineAdvanceInput('2026-10-26', 'dispatch'), {
      date: '2026-10-26',
      from_stage: 'dispatch',
      to_stage: 'delivered',
    });
    assert.equal(pipelineAdvanceInput('2026-10-26', 'pending'), null);
    assert.equal(pipelineAdvanceInput('', 'locked'), null);
  });

  it('still parses a pending day whose advance label is null', () => {
    const ops = DailyOpsSchema.parse({
      date: '2026-10-26',
      pipeline: {
        stage: 'pending',
        stages: [
          { id: 'locked', label: 'Locked', status: 'pending' },
          { id: 'dispatch', label: 'Dispatch', status: 'pending' },
          { id: 'delivered', label: 'Delivered', status: 'pending' },
        ],
        locked_at: null,
        locked_note: null,
        can_advance: false,
        advance_label: null,
      },
      meal_breakdown: { total: 0, rows: [] },
      issues_queue: { open_count: 0, issues: [] },
    });
    assert.equal(ops.pipeline.can_advance, false);
    assert.equal(ops.pipeline.advance_label, null);
  });
});
