import { describe, it, expect } from 'vitest';
import {
  calculateLifetimeMetrics,
  calculateDateScopedMetrics,
  getDayBounds
} from '../lib/countingLogic';
import { Lead } from '../types';

describe('Cumulative Milestone Counting Logic (Requirements 8-12 & 82)', () => {
  it('Step 1: When lead is marked Interested, only Interested increments', () => {
    const leads: Lead[] = [
      {
        id: 'lead-test-1',
        email: 'test1@example.com',
        first_name: 'Solomon',
        last_name: 'Test',
        company_name: 'Test Co',
        priority: 'Medium',
        is_interested: true,
        interested_at: new Date().toISOString(),
        is_meeting_scheduled: false,
        is_meeting_done: false,
        meeting_count_type: null,
        is_pending: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const metrics = calculateLifetimeMetrics(leads);
    expect(metrics.totalInterested).toBe(1);
    expect(metrics.totalMeetingScheduled).toBe(0);
    expect(metrics.totalMeetingDone).toBe(0);
    expect(metrics.totalMeetingCount).toBe(0);
  });

  it('Step 2: When meeting is scheduled, Interested remains 1, Meeting Scheduled becomes 1', () => {
    const leads: Lead[] = [
      {
        id: 'lead-test-1',
        email: 'test1@example.com',
        first_name: 'Solomon',
        last_name: 'Test',
        company_name: 'Test Co',
        priority: 'Medium',
        is_interested: true,
        interested_at: new Date().toISOString(),
        is_meeting_scheduled: true,
        meeting_scheduled_at: new Date().toISOString(),
        is_meeting_done: false,
        meeting_count_type: null,
        is_pending: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const metrics = calculateLifetimeMetrics(leads);
    expect(metrics.totalInterested).toBe(1);
    expect(metrics.totalMeetingScheduled).toBe(1);
    expect(metrics.totalMeetingDone).toBe(0);
    expect(metrics.totalMeetingCount).toBe(0);
  });

  it('Step 3: When meeting is marked Done, earlier milestones remain counted, Meeting Done becomes 1', () => {
    const leads: Lead[] = [
      {
        id: 'lead-test-1',
        email: 'test1@example.com',
        first_name: 'Solomon',
        last_name: 'Test',
        company_name: 'Test Co',
        priority: 'Medium',
        is_interested: true,
        interested_at: new Date().toISOString(),
        is_meeting_scheduled: true,
        meeting_scheduled_at: new Date().toISOString(),
        is_meeting_done: true,
        meeting_done_at: new Date().toISOString(),
        meeting_count_type: null,
        is_pending: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const metrics = calculateLifetimeMetrics(leads);
    expect(metrics.totalInterested).toBe(1);
    expect(metrics.totalMeetingScheduled).toBe(1);
    expect(metrics.totalMeetingDone).toBe(1);
    expect(metrics.totalMeetingCount).toBe(0);
  });

  it('Step 4A: Setting Meeting Count = YES increments Total Meeting Count to 1', () => {
    const leads: Lead[] = [
      {
        id: 'lead-test-1',
        email: 'test1@example.com',
        first_name: 'Solomon',
        last_name: 'Test',
        company_name: 'Test Co',
        priority: 'Medium',
        is_interested: true,
        interested_at: new Date().toISOString(),
        is_meeting_scheduled: true,
        meeting_scheduled_at: new Date().toISOString(),
        is_meeting_done: true,
        meeting_done_at: new Date().toISOString(),
        meeting_count_type: 'YES',
        meeting_count_at: new Date().toISOString(),
        is_pending: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const metrics = calculateLifetimeMetrics(leads);
    expect(metrics.totalInterested).toBe(1);
    expect(metrics.totalMeetingScheduled).toBe(1);
    expect(metrics.totalMeetingDone).toBe(1);
    expect(metrics.totalMeetingCount).toBe(1);
    expect(metrics.meetingCountYes).toBe(1);
    expect(metrics.meetingCountNo).toBe(0);
  });

  it('Step 4B: Testing separately with another lead: Meeting Count = NO counts as Meeting Done, but Total Meeting Count remains 0', () => {
    const leads: Lead[] = [
      {
        id: 'lead-test-2',
        email: 'test2@example.com',
        first_name: 'Simon',
        last_name: 'Test',
        company_name: 'Test Co 2',
        priority: 'Medium',
        is_interested: true,
        interested_at: new Date().toISOString(),
        is_meeting_scheduled: true,
        meeting_scheduled_at: new Date().toISOString(),
        is_meeting_done: true,
        meeting_done_at: new Date().toISOString(),
        meeting_count_type: 'NO',
        meeting_count_at: new Date().toISOString(),
        is_pending: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const metrics = calculateLifetimeMetrics(leads);
    expect(metrics.totalInterested).toBe(1);
    expect(metrics.totalMeetingScheduled).toBe(1);
    expect(metrics.totalMeetingDone).toBe(1); // MUST count as Meeting Done!
    expect(metrics.totalMeetingCount).toBe(0); // MUST NOT increase Total Meeting Count!
    expect(metrics.meetingCountNo).toBe(1);
    expect(metrics.meetingCountYes).toBe(0);
  });

  it('Pending YES is independent of Meeting Count', () => {
    const leads: Lead[] = [
      {
        id: 'lead-test-pending',
        email: 'pending@example.com',
        first_name: 'Pending',
        last_name: 'User',
        company_name: 'Pending Co',
        priority: 'Medium',
        is_interested: true,
        is_meeting_scheduled: true,
        is_meeting_done: true,
        meeting_count_type: 'NO',
        is_pending: true,
        pending_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const metrics = calculateLifetimeMetrics(leads);
    expect(metrics.totalMeetingDone).toBe(1);
    expect(metrics.totalMeetingCount).toBe(0);
    expect(metrics.pendingYes).toBe(1);
  });

  it('Date Scoped Metrics: Distinguishes when milestone happened from current state', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const today = new Date();

    const leads: Lead[] = [
      {
        id: 'lead-date-test',
        email: 'date@example.com',
        first_name: 'Date',
        last_name: 'Tester',
        company_name: 'Date Co',
        priority: 'Medium',
        is_interested: true,
        interested_at: yesterday.toISOString(), // happened yesterday
        is_meeting_scheduled: true,
        meeting_scheduled_at: today.toISOString(), // happened today
        is_meeting_done: false,
        meeting_count_type: null,
        is_pending: false,
        created_at: yesterday.toISOString(),
        updated_at: today.toISOString(),
      },
    ];

    const todayBounds = getDayBounds(today);
    const todayMetrics = calculateDateScopedMetrics(leads, [], todayBounds.start, todayBounds.end);

    // In Today's metrics: Interested was yesterday (0), Meeting Scheduled was today (1)
    expect(todayMetrics.totalInterested).toBe(0);
    expect(todayMetrics.totalMeetingScheduled).toBe(1);

    // In Lifetime metrics: both are 1
    const lifetime = calculateLifetimeMetrics(leads);
    expect(lifetime.totalInterested).toBe(1);
    expect(lifetime.totalMeetingScheduled).toBe(1);
  });
});
