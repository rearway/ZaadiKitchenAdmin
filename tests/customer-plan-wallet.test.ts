import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CustomerDetailSchema,
  CustomerSchema,
  formatDaysLeft,
  formatMealsLeft,
  formatWalletSar,
  resolveSubscriptionStatus,
} from '../src/features/customers/model/customers.schema.ts';

const liveDetail = {
  id: 'user-1',
  fullName: 'Sara Al-Mutairi',
  phone: '+966500000111',
  email: 'sara@example.com',
  isActive: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  subscription: {
    id: 'sub-1',
    planName: 'Month',
    mealType: 'executive',
    status: 'active',
    startDate: '2026-10-01',
    endDate: '2026-11-02',
    daysRemaining: 31,
    deliveredCount: 4,
    skippedCount: 1,
    totalMealDays: 22,
    skipDaysUsed: 1,
    skipDaysAllowed: 4,
    pauseDaysUsed: 0,
    pauseDaysAllowed: 4,
  },
  walletBalanceSar: 1000,
  primaryAddress: {
    buildingName: 'Al Nakheel Tower',
    floor: '7',
    areaName: 'Al Olaya',
  },
  openIssueCount: 1,
};

describe('admin customer wallet, status, days, and meals', () => {
  it('reads the live walletBalanceSar field and the address object on detail', () => {
    const detail = CustomerDetailSchema.parse(liveDetail);
    assert.equal(detail.walletBalance, 1000);
    assert.equal(formatWalletSar(detail.walletBalance), 'SAR 1,000.00');
    assert.equal(detail.primaryAddress, 'Al Nakheel Tower, Floor 7, Al Olaya');
    assert.equal(detail.plan, 'Month');
    assert.equal(detail.openIssueCount, 1);
    assert.equal(detail.subscriptionStatus, 'active');
  });

  it('uses remaining meal days, not the calendar daysRemaining field', () => {
    const detail = CustomerDetailSchema.parse(liveDetail);
    assert.equal(detail.daysLeft, 17);
    assert.equal(detail.mealsLeft, 17);
    assert.equal(formatDaysLeft(detail.daysLeft), '17 days left');
    assert.equal(formatMealsLeft(detail.mealsLeft), '17 meals left');
  });

  it('keeps an explicit meals left value distinct from days left', () => {
    const customer = CustomerSchema.parse({
      id: 'user-2',
      fullName: 'Ahmed',
      subscriptionStatus: 'active',
      planName: 'Week',
      totalMealDays: 5,
      deliveredCount: 1,
      skippedCount: 0,
      mealsLeft: 3,
      wallet_balance_sar: '1000.00',
    });
    assert.equal(customer.daysLeft, 4);
    assert.equal(customer.mealsLeft, 3);
    assert.equal(customer.walletBalance, 1000);
    assert.equal(customer.subscriptionStatus, 'active');
  });

  it('does not treat admin calendar daysRemaining as mobile days left', () => {
    const detail = CustomerDetailSchema.parse({
      id: 'user-calendar',
      fullName: 'Nora',
      subscription: {
        status: 'active',
        planName: 'Month',
        endDate: '2099-01-01',
        daysRemaining: 31,
        deliveredCount: 4,
        skippedCount: 1,
      },
      walletBalanceSar: 1000,
      primaryAddress: null,
      openIssueCount: 0,
    });
    assert.equal(detail.walletBalance, 1000);
    assert.equal(detail.subscriptionStatus, 'active');
    assert.equal(detail.daysLeft, null);
    assert.equal(detail.mealsLeft, null);
  });

  it('does not invent a zero wallet or calendar days when the list omits them', () => {
    const customer = CustomerSchema.parse({
      id: 'user-3',
      fullName: 'Nora',
      subscriptionStatus: 'active',
      planName: 'Month',
      endDate: '2026-12-01',
    });
    assert.equal(customer.walletBalance, null);
    assert.equal(customer.daysLeft, null);
    assert.equal(customer.mealsLeft, null);
    assert.equal(formatWalletSar(customer.walletBalance), '—');
    assert.equal(formatDaysLeft(null), '— days left');
    assert.equal(formatMealsLeft(null), '— meals left');
  });

  it('keeps Active when the stored status is active, even if the end date is past', () => {
    const customer = CustomerSchema.parse({
      id: 'user-4',
      fullName: 'Lina',
      subscriptionStatus: 'active',
      endDate: '2000-01-01',
    });
    assert.equal(customer.subscriptionStatus, 'active');
  });

  it('shows Active when an in-service end date contradicts a stale expired flag', () => {
    assert.equal(resolveSubscriptionStatus(['expired'], '2099-01-01', '2026-10-26'), 'active');
    const customer = CustomerSchema.parse({
      id: 'user-5',
      fullName: 'Omar',
      subscriptionStatus: 'expired',
      status: 'expired',
      endDate: '2099-06-01',
    });
    assert.equal(customer.subscriptionStatus, 'active');
  });

  it('shows Expired only when the plan status is expired and the window has closed', () => {
    const customer = CustomerSchema.parse({
      id: 'user-6',
      fullName: 'Huda',
      subscription: { status: 'expired', endDate: '2000-04-28', planName: 'Week' },
    });
    assert.equal(customer.subscriptionStatus, 'expired');
  });

  it('prefers an active subscription status over a second expired field', () => {
    const customer = CustomerSchema.parse({
      id: 'user-7',
      fullName: 'Faisal',
      subscriptionStatus: 'active',
      status: 'expired',
      endDate: '2000-01-01',
    });
    assert.equal(customer.subscriptionStatus, 'active');
  });

  it('does not label a cancelled in-service plan as Expired', () => {
    const customer = CustomerDetailSchema.parse({
      id: 'user-8',
      fullName: 'Maya',
      subscription: { status: 'cancelled', planName: 'Month', endDate: '2099-01-01' },
      walletBalanceSar: 0,
      primaryAddress: null,
      openIssueCount: 0,
    });
    assert.equal(customer.subscriptionStatus, 'cancelled');
    assert.equal(customer.walletBalance, 0);
  });
});
