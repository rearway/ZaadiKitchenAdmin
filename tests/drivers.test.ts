import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canAccess } from '../src/shared/config/permissions.ts';
import {
  DriverListSchema,
  DriverResponseSchema,
  DriverSchema,
  DriverWriteSchema,
  driverAreaLabels,
  normalizeDriverPhone,
} from '../src/features/drivers/model/drivers.schema.ts';

const snakeDriver = {
  id: 'drv-1',
  full_name: 'Khalid Al Harbi',
  phone: '+966512345678',
  language_preference: 'AR',
  is_active: true,
  areas: [{ id: 'area-1', name: 'Al Nakheel' }],
  created_at: '2026-10-24T00:00:00.000Z',
};

describe('DriverSchema', () => {
  it('parses the snake_case admin driver payload', () => {
    const driver = DriverSchema.parse(snakeDriver);
    assert.equal(driver.fullName, 'Khalid Al Harbi');
    assert.equal(driver.language, 'AR');
    assert.equal(driver.isActive, true);
    assert.deepEqual(driver.areas, [{ id: 'area-1', name: 'Al Nakheel' }]);
    assert.equal(driver.createdAt, '2026-10-24T00:00:00.000Z');
  });

  it('accepts camelCase user fields and area id lists', () => {
    const driver = DriverSchema.parse({
      id: 'drv-2',
      fullName: 'Sara',
      phone: '+966500000001',
      languagePreference: 'en',
      isActive: false,
      areaIds: ['area-9'],
    });
    assert.equal(driver.fullName, 'Sara');
    assert.equal(driver.language, 'EN');
    assert.equal(driver.isActive, false);
    assert.deepEqual(driver.areas, [{ id: 'area-9', name: null }]);
    assert.equal(driver.createdAt, null);
  });

  it('reads area names from a wrapped driver response', () => {
    const driver = DriverResponseSchema.parse({ driver: snakeDriver });
    assert.equal(driver.id, 'drv-1');
    assert.deepEqual(driverAreaLabels(driver, new Map()), ['Al Nakheel']);
  });

  it('fills missing area names from the areas catalogue', () => {
    const driver = DriverSchema.parse({
      id: 'drv-3',
      full_name: 'Noura',
      phone: '+966511111111',
      area_ids: ['area-2'],
    });
    assert.deepEqual(driverAreaLabels(driver, new Map([['area-2', 'Olaya']])), ['Olaya']);
  });
});

describe('DriverListSchema', () => {
  it('parses a paginated list envelope', () => {
    const list = DriverListSchema.parse({
      drivers: [snakeDriver],
      pagination: { page: 2, per_page: 20, total: 21, total_pages: 2 },
    });
    assert.equal(list.drivers.length, 1);
    assert.equal(list.page, 2);
    assert.equal(list.perPage, 20);
    assert.equal(list.total, 21);
    assert.equal(list.totalPages, 2);
  });

  it('accepts a bare array', () => {
    const list = DriverListSchema.parse([snakeDriver]);
    assert.equal(list.total, 1);
    assert.equal(list.page, 1);
  });

  it('accepts an empty list', () => {
    const list = DriverListSchema.parse({
      drivers: [],
      pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
    });
    assert.deepEqual(list.drivers, []);
    assert.equal(list.totalPages, 0);
  });
});

describe('DriverWriteSchema', () => {
  it('normalizes a local Saudi mobile and keeps every selected area', () => {
    assert.equal(normalizeDriverPhone('055 123 4567'), '+966551234567');
    const parsed = DriverWriteSchema.parse({
      full_name: '  Khalid Al Harbi  ',
      phone: '0551234567',
      language_preference: 'EN',
      is_active: true,
      area_ids: ['area-1', 'area-1', 'area-2'],
    });
    assert.equal(parsed.full_name, 'Khalid Al Harbi');
    assert.equal(parsed.phone, '+966551234567');
    assert.deepEqual(parsed.area_ids, ['area-1', 'area-2']);
  });

  it('rejects a short name and a non-Saudi phone', () => {
    const name = DriverWriteSchema.safeParse({
      full_name: 'K',
      phone: '+966512345678',
      language_preference: 'EN',
      is_active: true,
      area_ids: [],
    });
    assert.equal(name.success, false);

    const phone = DriverWriteSchema.safeParse({
      full_name: 'Khalid',
      phone: '+14155550123',
      language_preference: 'EN',
      is_active: true,
      area_ids: [],
    });
    assert.equal(phone.success, false);
    if (!phone.success) {
      assert.match(phone.error.issues[0]?.message ?? '', /Saudi format/);
    }
  });
});

describe('drivers RBAC', () => {
  it('lets admin open drivers and keeps the screen off the ops nav', () => {
    assert.equal(canAccess('admin', 'drivers'), true);
    assert.equal(canAccess('ops', 'drivers'), false);
  });
});
