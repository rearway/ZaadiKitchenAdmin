import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DriverDeliveriesSchema,
  UnassignedAreasSchema,
  areaAssignErrorMessage,
  deliveryReviewView,
  deliveryStatusLabel,
  formatDateKsa,
  formatOpsDayLabel,
  unassignedAreas,
} from '../src/features/drivers/model/driver-deliveries.schema.ts';

const OLAYA = '11111111-1111-4111-8111-111111111111';
const MALAZ = '22222222-2222-4222-8222-222222222222';
const SAHAFA = '33333333-3333-4333-8333-333333333333';

describe('KSA ops day', () => {
  it('formats the calendar date in Asia/Riyadh', () => {
    assert.equal(formatDateKsa(new Date('2026-10-25T21:30:00.000Z')), '2026-10-26');
    assert.equal(formatDateKsa(new Date('2026-10-25T20:30:00.000Z')), '2026-10-25');
  });

  it('labels the selected ops day and marks today', () => {
    assert.equal(formatOpsDayLabel('2026-10-26', '2026-10-26'), 'Mon 26 Oct (today)');
    assert.equal(formatOpsDayLabel('2026-10-27', '2026-10-26'), 'Tue 27 Oct');
  });
});

describe('driver day deliveries', () => {
  it('parses a rider-shaped day, including an empty list', () => {
    const parsed = DriverDeliveriesSchema.parse({
      date: '2026-10-26',
      deliveries: [
        {
          delivery_id: 'del-1',
          customer_name: 'Sara M.',
          customer_phone: '+966500000201',
          meal_name: 'Grilled Chicken Bowl',
          meal_type: 'executive',
          status: 'pending',
        },
      ],
    });
    assert.equal(parsed.date, '2026-10-26');
    assert.equal(parsed.deliveries[0]?.customerName, 'Sara M.');
    assert.equal(parsed.deliveries[0]?.phone, '+966500000201');
    assert.equal(parsed.deliveries[0]?.mealName, 'Grilled Chicken Bowl');
    assert.equal(parsed.deliveries[0]?.mealType, 'executive');
    assert.equal(parsed.deliveries[0]?.status, 'pending');
    assert.equal(parsed.deliveries[0]?.review, null);

    const empty = DriverDeliveriesSchema.parse({ date: '2026-10-28', deliveries: [] });
    assert.deepEqual(empty.deliveries, []);
  });

  it('accepts camelCase rows and maps scheduled to pending', () => {
    const parsed = DriverDeliveriesSchema.parse({
      deliveries: [
        {
          id: 'del-2',
          customerName: 'Omar K.',
          customerPhone: '+966500000202',
          mealName: 'Caesar Salad',
          mealType: 'Salad',
          status: 'scheduled',
        },
      ],
    });
    const row = parsed.deliveries[0];
    assert.equal(row?.status, 'pending');
    assert.equal(deliveryStatusLabel(row?.status ?? 'pending'), 'Pending');
    assert.equal(deliveryReviewView(row!), '—');
  });

  it('shows stars and text only when the meal is delivered', () => {
    const parsed = DriverDeliveriesSchema.parse({
      deliveries: [
        {
          delivery_id: 'del-3',
          customer_name: 'Sara M.',
          customer_phone: '+966500000201',
          meal_name: 'Grilled Chicken Bowl',
          meal_type: 'executive',
          status: 'DELIVERED',
          review: { stars: 5, text: 'On time, hot, perfect.' },
        },
        {
          delivery_id: 'del-4',
          customer_name: 'Ned Stark',
          customer_phone: '+966500000101',
          meal_name: 'Quinoa Bowl',
          meal_type: 'salad',
          status: 'delivered',
          stars: 4,
          review_text: 'Good portion.',
        },
        {
          delivery_id: 'del-5',
          customer_name: 'Layla H.',
          phone: '+966500000203',
          meal_name: 'Beef Steak Plate',
          meal_type: 'executive',
          status: 'delivered',
          rating: { stars: 3, tags: ['Too spicy', 'Small portion'] },
        },
        {
          delivery_id: 'del-6',
          customer_name: 'Nora A.',
          customer_phone: '+966500000204',
          meal_name: 'Chicken Shawarma',
          meal_type: 'executive',
          status: 'paused',
          domain_status: 'paused',
          review: { stars: 5, text: 'Should stay hidden.' },
        },
        {
          delivery_id: 'del-7',
          customer_name: 'Nora A.',
          customer_phone: '+966500000204',
          meal_name: 'Greek Salad',
          meal_type: 'salad',
          status: 'skipped',
        },
        {
          delivery_id: 'del-8',
          customer_name: 'Omar K.',
          customer_phone: '+966500000202',
          meal_name: 'Salmon Teriyaki',
          meal_type: 'executive',
          status: 'delivered',
        },
      ],
    });

    const [withText, withReviewText, withTags, paused, skipped, unrated] = parsed.deliveries;
    assert.equal(withText?.status, 'delivered');
    assert.equal(deliveryReviewView(withText!), '5★ · On time, hot, perfect.');
    assert.equal(deliveryReviewView(withReviewText!), '4★ · Good portion.');
    assert.equal(deliveryReviewView(withTags!), '3★ · Too spicy, Small portion');
    assert.equal(paused?.status, 'paused');
    assert.equal(paused?.domainStatus, 'paused');
    assert.equal(paused?.review, null);
    assert.equal(deliveryStatusLabel('paused'), 'Paused');
    assert.equal(deliveryReviewView(paused!), '—');
    assert.equal(deliveryStatusLabel('skipped'), 'Skipped');
    assert.equal(deliveryReviewView(skipped!), '—');
    assert.equal(deliveryReviewView(unrated!), '(no review yet)');
  });

  it('parses the Backend PR #24 driver-day payload', () => {
    const parsed = DriverDeliveriesSchema.parse({
      driver_id: 'drv-1',
      date: '2026-10-26',
      timezone: 'Asia/Riyadh',
      deliveries: [
        {
          delivery_id: 'del-rated',
          customer_name: 'Sara M.',
          phone: '+966500000201',
          meal_name: 'Grilled Chicken Bowl',
          meal_type: 'executive',
          status: 'delivered',
          domain_status: 'delivered',
          review: { stars: 5, text: 'Great portion', tags: ['Great portion'] },
        },
        {
          delivery_id: 'del-scheduled',
          customer_name: 'Omar K.',
          phone: null,
          meal_name: null,
          meal_type: 'salad',
          status: 'pending',
          domain_status: 'scheduled',
          review: null,
        },
        {
          delivery_id: 'del-cutoff',
          customer_name: 'Layla H.',
          phone: '+966500000203',
          meal_name: 'Beef Steak Plate',
          meal_type: 'executive',
          status: 'past_cutoff',
          domain_status: 'past_cutoff',
          review: { stars: 5, text: 'Must stay hidden', tags: ['Must stay hidden'] },
        },
        {
          delivery_id: 'del-empty',
          customer_name: 'Yousef',
          phone: '+966500000204',
          meal_name: 'Greek Salad',
          meal_type: 'salad',
          status: 'delivered',
          domain_status: 'delivered',
          review: { stars: 4, text: null, tags: [] },
        },
      ],
    });

    const [rated, scheduled, cutoff, starsOnly] = parsed.deliveries;
    assert.equal(parsed.date, '2026-10-26');
    assert.equal(rated?.phone, '+966500000201');
    assert.equal(rated?.domainStatus, 'delivered');
    assert.equal(deliveryReviewView(rated!), '5★ · Great portion');
    assert.equal(scheduled?.status, 'pending');
    assert.equal(scheduled?.domainStatus, 'scheduled');
    assert.equal(scheduled?.phone, '');
    assert.equal(scheduled?.mealName, '');
    assert.equal(scheduled?.review, null);
    assert.equal(deliveryReviewView(scheduled!), '—');
    assert.equal(cutoff?.status, 'pending');
    assert.equal(cutoff?.domainStatus, 'past_cutoff');
    assert.equal(cutoff?.review, null);
    assert.equal(deliveryReviewView(cutoff!), '—');
    assert.equal(deliveryReviewView(starsOnly!), '4★');

    const empty = DriverDeliveriesSchema.parse({
      driver_id: 'drv-1',
      date: '2026-10-28',
      timezone: 'Asia/Riyadh',
      deliveries: [],
    });
    assert.deepEqual(empty.deliveries, []);
  });
});

describe('area exclusivity', () => {
  const areas = [
    { id: OLAYA, name: 'Olaya' },
    { id: MALAZ, name: 'Malaz' },
    { id: SAHAFA, name: 'Sahafa' },
  ];
  const drivers = [
    { id: 'd1', areas: [{ id: OLAYA }, { id: MALAZ }] },
    { id: 'd2', areas: [{ id: SAHAFA }] },
  ];

  it('lists only areas with no driver', () => {
    assert.deepEqual(unassignedAreas(areas, drivers), []);
    assert.deepEqual(unassignedAreas([...areas, { id: 'nakheel', name: 'Nakheel' }], drivers), [
      { id: 'nakheel', name: 'Nakheel' },
    ]);
  });

  it('keeps the edited driver’s own areas and hides everyone else’s', () => {
    assert.deepEqual(
      unassignedAreas(areas, drivers, { includeDriverId: 'd1' }).map((area) => area.id),
      [OLAYA, MALAZ]
    );
  });

  it('parses the unassigned-areas payload', () => {
    const parsed = UnassignedAreasSchema.parse({
      areas: [
        { id: OLAYA, name: 'Olaya', status: 'active' },
        { id: MALAZ, name: null, status: 'coming_soon' },
      ],
    });
    assert.deepEqual(parsed, [
      { id: OLAYA, name: 'Olaya' },
      { id: MALAZ, name: null },
    ]);
  });

  it('surfaces the API message from a 409 and ignores other failures', () => {
    const conflict = Object.assign(
      new Error('Area "Olaya" is already assigned to Fahad Al-Otaibi. One area = one driver.'),
      { statusCode: 409, errorCode: 'AREA_ALREADY_ASSIGNED' }
    );
    const badRequest = Object.assign(new Error('Bad area'), { statusCode: 400 });
    assert.equal(
      areaAssignErrorMessage(conflict),
      'Area "Olaya" is already assigned to Fahad Al-Otaibi. One area = one driver.'
    );
    assert.equal(areaAssignErrorMessage(badRequest), null);
    assert.equal(areaAssignErrorMessage(new Error('network')), null);
  });
});
