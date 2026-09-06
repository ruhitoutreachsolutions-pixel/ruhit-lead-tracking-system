import { describe, it, expect } from 'vitest';
import { generateMailMergeTSV } from '../lib/mailMerge';
import { Lead } from '../types';

describe('Google Mail Merge Dispatcher (Requirements 25-30)', () => {
  it('Outputs exactly the 4 required tab-separated columns: Email, First Name, Last Name, Company Name', () => {
    const leads: Lead[] = [
      {
        id: '1',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Smith',
        company_name: 'ABC Ltd',
        priority: 'Medium',
        is_interested: false,
        is_meeting_scheduled: false,
        is_meeting_done: false,
        meeting_count_type: null,
        is_pending: false,
        created_at: '',
        updated_at: '',
      },
      {
        id: '2',
        email: 'mary@example.com',
        first_name: 'Mary',
        last_name: 'Jones',
        company_name: 'XYZ Corp',
        priority: 'High',
        is_interested: false,
        is_meeting_scheduled: false,
        is_meeting_done: false,
        meeting_count_type: null,
        is_pending: false,
        created_at: '',
        updated_at: '',
      },
    ];

    const tsv = generateMailMergeTSV(leads, true);
    const lines = tsv.split('\r\n');

    expect(lines.length).toBe(3); // Header + 2 rows
    expect(lines[0]).toBe('Email\tFirst Name\tLast Name\tCompany Name');
    expect(lines[1]).toBe('john@example.com\tJohn\tSmith\tABC Ltd');
    expect(lines[2]).toBe('mary@example.com\tMary\tJones\tXYZ Corp');
  });

  it('Sanitizes tabs and carriage returns from text values', () => {
    const leads: Lead[] = [
      {
        id: '1',
        email: 'john@example.com',
        first_name: 'John\t',
        last_name: 'Smith\n',
        company_name: 'ABC\rLtd',
        priority: 'Medium',
        is_interested: false,
        is_meeting_scheduled: false,
        is_meeting_done: false,
        meeting_count_type: null,
        is_pending: false,
        created_at: '',
        updated_at: '',
      },
    ];

    const tsv = generateMailMergeTSV(leads, false);
    const cols = tsv.split('\t');
    expect(cols.length).toBe(4);
    expect(cols[0]).toBe('john@example.com');
    expect(cols[1]).toBe('John');
    expect(cols[2]).toBe('Smith');
    expect(cols[3]).toBe('ABC Ltd');
  });
});
