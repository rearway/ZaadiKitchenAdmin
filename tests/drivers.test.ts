import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canAccess } from '../src/shared/config/permissions.ts';
import {
  CreateDriverSchema,
  DriverListSchema,
  DriverResponseSchema,
  UpdateDriverSchema,
  filterDrivers,
  normalizeDriverPhone,
} from '../src/features/drivers/model/drivers.schema.ts';

const AREA_A = '11111111-1111-4111-8111-111111111111';
const AREA_B = '22222222-2222-4222-8222-222222222222';

const documentedDriver = {
  id: 'drv-1',
  fullName: 'Faisal Al-Harbi',
  phone: '+966512345678',
  role: 'DRIVER',
  isActive: true,
  areas: [{ id: AREA_A, name: 'Al Nakheel' }],
  createdAt: '2026-10-24T12:00:00.000Z',
  updatedAt: '2026-10-24T12:00:00.000Z',
};

describe('Backend PR #18 driver payload', () => {
  it('parses the camelCase driver and the list wrapper', () => {
    const driver = DriverResponseSchema.parse(documentedDriver);
    assert.equal(driver.fullName, 'Faisal Al-Harbi');
    assert.equal(driver.phone, '+966512345678');
    assert.equal(driver.isActive, true);
    assert.deepEqual(driver.areas, [{ id: AREA_A, name: 'Al Nakheel' }]);
    assert.equal(driver.createdAt, '2026-10-24T12:00:00.000Z');

    const list = DriverListSchema.parse({ drivers: [documentedDriver] });
    assert.equal(list.drivers.length, 1);
    assert.equal(list.drivers[0]?.id, 'drv-1');
  });

  it('accepts an empty list and a driver with no phone', () => {
    const list = DriverListSchema.parse({ drivers: [] });
    assert.deepEqual(list.drivers, []);

    const driver = DriverResponseSchema.parse({
      id: 'drv-2',
      fullName: 'Sara',
      phone: null,
      isActive: false,
      areas: [],
    });
    assert.equal(driver.phone, '');
    assert.equal(driver.isActive, false);
    assert.deepEqual(driver.areas, []);
  });

  it('filters the full list by name or phone', () => {
    const drivers = DriverListSchema.parse({
      drivers: [
        documentedDriver,
        { id: 'drv-2', fullName: 'Sara Nasser', phone: '+966500000001', isActive: true, areas: [] },
      ],
    }).drivers;
    assert.equal(filterDrivers(drivers, 'faisal').length, 1);
    assert.equal(filterDrivers(drivers, '500000').length, 1);
    assert.equal(filterDrivers(drivers, '  ').length, 2);
  });
});

describe('driver write bodies', () => {
  it('creates with only full_name, phone, and area_ids', () => {
    assert.equal(normalizeDriverPhone('055 123 4567'), '+966551234567');
    const parsed = CreateDriverSchema.parse({
      full_name: '  Faisal Al-Harbi  ',
      phone: '0551234567',
      area_ids: [AREA_A, AREA_A, AREA_B],
    });
    assert.deepEqual(parsed, {
      full_name: 'Faisal Al-Harbi',
      phone: '+966551234567',
      area_ids: [AREA_A, AREA_B],
    });
    assert.equal('is_active' in parsed, false);
    assert.equal('language_preference' in parsed, false);
  });

  it('updates with is_active and allows an empty area list', () => {
    const parsed = UpdateDriverSchema.parse({
      full_name: 'Faisal',
      phone: '+966512345678',
      is_active: false,
      area_ids: [],
    });
    assert.equal(parsed.is_active, false);
    assert.deepEqual(parsed.area_ids, []);
  });

  it('rejects a blank name, a bad phone, and a non-uuid area', () => {
    const name = CreateDriverSchema.safeParse({
      full_name: '   ',
      phone: '+966512345678',
      area_ids: [],
    });
    assert.equal(name.success, false);

    const phone = CreateDriverSchema.safeParse({
      full_name: 'Faisal',
      phone: '+14155550123',
      area_ids: [],
    });
    assert.equal(phone.success, false);

    const area = CreateDriverSchema.safeParse({
      full_name: 'Faisal',
      phone: '+966512345678',
      area_ids: ['north'],
    });
    assert.equal(area.success, false);
  });
});

describe('drivers RBAC', () => {
  it('lets admin open drivers and keeps the screen off the ops nav', () => {
    assert.equal(canAccess('admin', 'drivers'), true);
    assert.equal(canAccess('ops', 'drivers'), false);
  });
});
