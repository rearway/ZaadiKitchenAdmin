import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CustomerHistorySchema,
  issueHistoryOutcome,
  issueHistorySectionTitle,
  issueHistoryStatusLabel,
  issueHistoryTypeLabel,
  formatHistoryCreatedAt,
  formatHistoryDeliveryDate,
} from '../src/features/customers/model/customers.schema.ts';
import {
  IssuesQueueSchema,
  creditPrefillSar,
  formatOpsDeliveryDate,
  formatOpsSubmittedAt,
  mealTypeLabel,
} from '../src/features/daily-ops/model/daily-ops.schema.ts';

const liveHistoryIssue = {
  id: 'issue-1',
  issueType: 'wrong_order',
  deliveryDate: '2026-10-20',
  creditedAmountSar: null,
  rejectionReason: null,
  status: 'open',
  createdAt: '2026-10-21T08:15:00.000Z',
};

describe('CustomerHistorySchema issue records', () => {
  it('keeps live history issue fields instead of dropping them', () => {
    const parsed = CustomerHistorySchema.parse({
      issues: [
        liveHistoryIssue,
        {
          issueType: 'quality_issue',
          deliveryDate: '2026-10-18',
          creditedAmountSar: 28,
          status: 'credited',
          createdAt: '2026-10-19T05:00:00.000Z',
        },
        {
          issueType: 'not_delivered',
          deliveryDate: '2026-10-17',
          creditedAmountSar: null,
          rejectionReason: 'Outside policy',
          status: 'rejected',
          createdAt: '2026-10-17T12:00:00.000Z',
        },
      ],
    });

    assert.equal(parsed.issues[0]?.issueType, 'wrong_order');
    assert.equal(parsed.issues[0]?.deliveryDate, '2026-10-20');
    assert.equal(parsed.issues[0]?.creditedAmountSar, null);
    assert.equal(parsed.issues[0]?.rejectionReason, null);
    assert.equal(parsed.issues[0]?.status, 'open');
    assert.equal(parsed.issues[0]?.createdAt, '2026-10-21T08:15:00.000Z');
    assert.equal(parsed.issues[1]?.creditedAmountSar, 28);
    assert.equal(parsed.issues[2]?.rejectionReason, 'Outside policy');
  });

  it('accepts snake_case aliases and optional description, notes, and resolvedAt', () => {
    const parsed = CustomerHistorySchema.parse({
      issues: [
        {
          issue_type: 'damaged',
          delivery_date: '2026-10-16',
          credited_amount_sar: '15.5',
          rejection_reason: '',
          rejection_notes: 'Bag was torn',
          description: 'Container arrived crushed',
          status: 'credited',
          created_at: '2026-10-16T09:00:00.000Z',
          resolved_at: '2026-10-16T11:30:00.000Z',
        },
      ],
    });

    const issue = parsed.issues[0];
    assert.equal(issue?.issueType, 'damaged');
    assert.equal(issue?.deliveryDate, '2026-10-16');
    assert.equal(issue?.creditedAmountSar, 15.5);
    assert.equal(issue?.rejectionReason, null);
    assert.equal(issue?.rejectionNotes, 'Bag was torn');
    assert.equal(issue?.description, 'Container arrived crushed');
    assert.equal(issue?.resolvedAt, '2026-10-16T11:30:00.000Z');
  });

  it('still accepts the legacy type key', () => {
    const parsed = CustomerHistorySchema.parse({
      issues: [{ type: 'wrong_order', status: 'open', createdAt: '2026-10-21T08:15:00.000Z' }],
    });
    assert.equal(parsed.issues[0]?.issueType, 'wrong_order');
  });
});

describe('customer history issue display', () => {
  it('maps issue types and statuses to readable labels', () => {
    assert.equal(issueHistoryTypeLabel('wrong_order'), 'Wrong order');
    assert.equal(issueHistoryTypeLabel('quality_issue'), 'Quality issue');
    assert.equal(issueHistoryTypeLabel('not_delivered'), 'Not delivered');
    assert.equal(issueHistoryTypeLabel('damaged'), 'Damaged');
    assert.equal(issueHistoryTypeLabel(''), 'Issue');
    assert.equal(issueHistoryStatusLabel('open'), 'Open');
    assert.equal(issueHistoryStatusLabel('credited'), 'Credited');
    assert.equal(issueHistoryStatusLabel('rejected'), 'Rejected');
  });

  it('does not title the section Resolved Issues when any row is open', () => {
    const open = CustomerHistorySchema.parse({ issues: [liveHistoryIssue] }).issues;
    const resolved = CustomerHistorySchema.parse({
      issues: [
        {
          issueType: 'damaged',
          status: 'credited',
          creditedAmountSar: 10,
          createdAt: '2026-10-01T00:00:00.000Z',
        },
        {
          issueType: 'quality_issue',
          status: 'rejected',
          rejectionReason: 'Duplicate report',
          createdAt: '2026-10-02T00:00:00.000Z',
        },
      ],
    }).issues;

    assert.equal(issueHistorySectionTitle(open), 'Issues');
    assert.equal(issueHistorySectionTitle(resolved), 'Resolved Issues');
  });

  it('shows the credit amount or the rejection reason', () => {
    const history = CustomerHistorySchema.parse({
      issues: [
        {
          issueType: 'quality_issue',
          status: 'credited',
          creditedAmountSar: 28,
          createdAt: '2026-10-19T05:00:00.000Z',
        },
        {
          issueType: 'not_delivered',
          status: 'rejected',
          rejectionReason: 'Outside policy',
          createdAt: '2026-10-17T12:00:00.000Z',
        },
        { issueType: 'wrong_order', status: 'open', createdAt: '2026-10-21T08:15:00.000Z' },
      ],
    });

    assert.equal(issueHistoryOutcome(history.issues[0]!), 'SAR 28');
    assert.equal(issueHistoryOutcome(history.issues[1]!), 'Outside policy');
    assert.equal(issueHistoryOutcome(history.issues[2]!), null);
  });

  it('formats delivery date and created time in Asia/Riyadh', () => {
    assert.equal(formatHistoryDeliveryDate('2026-10-20'), 'Oct 20, 2026');
    assert.equal(formatHistoryDeliveryDate(''), '');
    assert.match(formatHistoryCreatedAt('2026-10-21T08:15:00.000Z'), /Oct 21, 2026, 11:15\sAM/);
    assert.equal(formatHistoryCreatedAt(''), '');
  });
});

describe('daily ops issues queue', () => {
  it('keeps customer, meal, and plan price fields from the issues payload', () => {
    const parsed = IssuesQueueSchema.parse({
      open_count: 1,
      issues: [
        {
          issue_id: 'iss_1',
          customer_name: 'Nora Ali',
          customer_phone: '+966500000001',
          delivery_address: 'Building 4, Al Olaya',
          issue_type: 'wrong_order',
          issue_type_label: 'Wrong order',
          description: 'Received the salad box',
          meal_name: 'Chicken Kabsa',
          meal_type: 'executive',
          delivery_date: '2026-10-20',
          submitted_at: '2026-10-21T08:15:00.000Z',
          plan_price_sar: 28,
        },
      ],
    });

    const issue = parsed.issues[0];
    assert.equal(issue?.customer_phone, '+966500000001');
    assert.equal(issue?.meal_name, 'Chicken Kabsa');
    assert.equal(issue?.meal_type, 'executive');
    assert.equal(issue?.delivery_date, '2026-10-20');
    assert.equal(issue?.submitted_at, '2026-10-21T08:15:00.000Z');
    assert.equal(issue?.plan_price_sar, 28);
  });

  it('prefills credit only when the plan price is between 0 and 30 SAR', () => {
    assert.equal(creditPrefillSar(28), '28');
    assert.equal(creditPrefillSar(0), '0');
    assert.equal(creditPrefillSar(30), '30');
    assert.equal(creditPrefillSar(15.5), '15.5');
    assert.equal(creditPrefillSar(30.01), '');
    assert.equal(creditPrefillSar(-1), '');
    assert.equal(creditPrefillSar(null), '');
    assert.equal(creditPrefillSar(undefined), '');
  });

  it('formats meal type, delivery date, and submitted time for the card', () => {
    assert.equal(mealTypeLabel('executive'), 'Executive');
    assert.equal(mealTypeLabel('salad'), 'Salad');
    assert.equal(mealTypeLabel(null), '');
    assert.equal(formatOpsDeliveryDate('2026-10-20'), 'Oct 20, 2026');
    assert.equal(formatOpsDeliveryDate(undefined), '');
    assert.match(formatOpsSubmittedAt('2026-10-21T08:15:00.000Z'), /Oct 21, 2026, 11:15\sAM/);
  });
});
