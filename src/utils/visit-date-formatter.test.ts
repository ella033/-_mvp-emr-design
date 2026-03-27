import { describe, it, expect, vi } from 'vitest';
import type { Encounter } from '@/types/chart/encounter-types';
import {
  formatVisitDates,
  getFirstVisitDate,
  getLastVisitDate,
  getVisitDays,
} from './visit-date-formatter';

// Helper to create a minimal Encounter with only encounterDateTime set
function makeEncounter(dateTime?: string): Encounter {
  return {
    id: '1',
    registrationId: '1',
    patientId: 1,
    encounterDateTime: dateTime,
    startDateTime: null,
    endDateTime: null,
    createId: 1,
    createDateTime: '2025-01-01T00:00:00',
    updateId: null,
    updateDateTime: null,
  } as Encounter;
}

describe('formatVisitDates', () => {
  it('returns empty string for empty array', () => {
    expect(formatVisitDates([])).toBe('');
  });

  it('returns empty string for null/undefined input', () => {
    expect(formatVisitDates(null as unknown as Encounter[])).toBe('');
    expect(formatVisitDates(undefined as unknown as Encounter[])).toBe('');
  });

  it('returns empty string when all encounters lack encounterDateTime', () => {
    expect(formatVisitDates([makeEncounter(undefined)])).toBe('');
  });

  it('formats a single date correctly', () => {
    const encounters = [makeEncounter('2025-03-15T10:00:00')];
    expect(formatVisitDates(encounters)).toBe('<2025년>3월15일');
  });

  it('formats multiple dates in the same month', () => {
    const encounters = [
      makeEncounter('2025-03-06T10:00:00'),
      makeEncounter('2025-03-07T10:00:00'),
      makeEncounter('2025-03-15T10:00:00'),
    ];
    expect(formatVisitDates(encounters)).toBe('<2025년>3월6일, 7일, 15일');
  });

  it('formats dates across multiple months in the same year', () => {
    const encounters = [
      makeEncounter('2025-02-28T10:00:00'),
      makeEncounter('2025-03-06T10:00:00'),
      makeEncounter('2025-03-07T10:00:00'),
      makeEncounter('2025-04-03T10:00:00'),
    ];
    expect(formatVisitDates(encounters)).toBe(
      '<2025년>2월28일, 3월6일, 7일, 4월3일'
    );
  });

  it('formats dates across multiple years', () => {
    const encounters = [
      makeEncounter('2024-12-25T10:00:00'),
      makeEncounter('2025-01-01T10:00:00'),
    ];
    expect(formatVisitDates(encounters)).toBe(
      '<2024년>12월25일\n<2025년>1월1일'
    );
  });

  it('deduplicates dates on the same day (different times)', () => {
    const encounters = [
      makeEncounter('2025-03-15T08:00:00'),
      makeEncounter('2025-03-15T14:00:00'),
    ];
    expect(formatVisitDates(encounters)).toBe('<2025년>3월15일');
  });

  it('sorts unsorted dates correctly', () => {
    const encounters = [
      makeEncounter('2025-04-10T10:00:00'),
      makeEncounter('2025-01-05T10:00:00'),
      makeEncounter('2025-01-02T10:00:00'),
    ];
    expect(formatVisitDates(encounters)).toBe(
      '<2025년>1월2일, 5일, 4월10일'
    );
  });

  it('skips encounters with missing encounterDateTime', () => {
    const encounters = [
      makeEncounter('2025-03-01T10:00:00'),
      makeEncounter(undefined),
      makeEncounter('2025-03-05T10:00:00'),
    ];
    expect(formatVisitDates(encounters)).toBe('<2025년>3월1일, 5일');
  });
});

describe('getFirstVisitDate', () => {
  it('returns null for empty array', () => {
    expect(getFirstVisitDate([])).toBeNull();
  });

  it('returns null for null/undefined input', () => {
    expect(getFirstVisitDate(null as unknown as Encounter[])).toBeNull();
    expect(getFirstVisitDate(undefined as unknown as Encounter[])).toBeNull();
  });

  it('returns null when all encounters lack encounterDateTime', () => {
    expect(getFirstVisitDate([makeEncounter(undefined)])).toBeNull();
  });

  it('returns the earliest date formatted as YYYY-MM-DD', () => {
    const encounters = [
      makeEncounter('2025-03-15T10:00:00'),
      makeEncounter('2025-01-05T08:00:00'),
      makeEncounter('2025-06-20T14:00:00'),
    ];
    expect(getFirstVisitDate(encounters)).toBe('2025-01-05');
  });

  it('pads single-digit month and day with leading zeros', () => {
    const encounters = [makeEncounter('2025-02-03T10:00:00')];
    expect(getFirstVisitDate(encounters)).toBe('2025-02-03');
  });
});

describe('getLastVisitDate', () => {
  it('returns null for empty array', () => {
    expect(getLastVisitDate([])).toBeNull();
  });

  it('returns null for null/undefined input', () => {
    expect(getLastVisitDate(null as unknown as Encounter[])).toBeNull();
    expect(getLastVisitDate(undefined as unknown as Encounter[])).toBeNull();
  });

  it('returns null when all encounters lack encounterDateTime', () => {
    expect(getLastVisitDate([makeEncounter(undefined)])).toBeNull();
  });

  it('returns the latest date formatted as YYYY-MM-DD', () => {
    const encounters = [
      makeEncounter('2025-03-15T10:00:00'),
      makeEncounter('2025-01-05T08:00:00'),
      makeEncounter('2025-06-20T14:00:00'),
    ];
    expect(getLastVisitDate(encounters)).toBe('2025-06-20');
  });

  it('returns the same date when only one encounter', () => {
    const encounters = [makeEncounter('2025-11-09T10:00:00')];
    expect(getLastVisitDate(encounters)).toBe('2025-11-09');
  });
});

describe('getVisitDays', () => {
  it('returns null for empty array', () => {
    expect(getVisitDays([])).toBeNull();
  });

  it('returns null for null/undefined input', () => {
    expect(getVisitDays(null as unknown as Encounter[])).toBeNull();
    expect(getVisitDays(undefined as unknown as Encounter[])).toBeNull();
  });

  it('returns null when all encounters lack encounterDateTime', () => {
    expect(getVisitDays([makeEncounter(undefined)])).toBeNull();
  });

  it('returns "1일" for a single visit date', () => {
    const encounters = [makeEncounter('2025-03-15T10:00:00')];
    expect(getVisitDays(encounters)).toBe('1일');
  });

  it('calculates days inclusive of both start and end', () => {
    const encounters = [
      makeEncounter('2025-03-01T10:00:00'),
      makeEncounter('2025-03-07T10:00:00'),
    ];
    // March 1 to March 7 inclusive = 7 days
    expect(getVisitDays(encounters)).toBe('7일');
  });

  it('deduplicates dates before calculating', () => {
    const encounters = [
      makeEncounter('2025-03-01T08:00:00'),
      makeEncounter('2025-03-01T14:00:00'),
      makeEncounter('2025-03-03T10:00:00'),
    ];
    // March 1 to March 3 inclusive = 3 days
    expect(getVisitDays(encounters)).toBe('3일');
  });

  it('handles unsorted encounters', () => {
    const encounters = [
      makeEncounter('2025-03-10T10:00:00'),
      makeEncounter('2025-03-01T10:00:00'),
      makeEncounter('2025-03-05T10:00:00'),
    ];
    // March 1 to March 10 inclusive = 10 days
    expect(getVisitDays(encounters)).toBe('10일');
  });

  it('handles dates across months', () => {
    const encounters = [
      makeEncounter('2025-01-30T10:00:00'),
      makeEncounter('2025-02-02T10:00:00'),
    ];
    // Jan 30 to Feb 2 inclusive = 4 days
    expect(getVisitDays(encounters)).toBe('4일');
  });
});
