import { Lead, LeadActivity, MetricsSummary, TeamReportRow, DayReportRow, UserProfile } from '../types';

/**
 * Checks whether an ISO timestamp string falls within a specified date range [startDate, endDate]
 */
export function isTimestampInRange(timestamp: string | null | undefined, startDate: Date, endDate: Date): boolean {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return false;
  return d >= startDate && d <= endDate;
}

/**
 * Normalizes start and end of day in the given date or default
 */
export function getDayBounds(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Calculates start and end of the current running calendar month
 */
export function getRunningMonthBounds(date: Date = new Date()): { start: Date; end: Date; monthName: string; year: number } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const monthName = date.toLocaleString('default', { month: 'long' });
  return { start, end, monthName, year };
}

/**
 * Calculates Lifetime metrics across all leads and activities.
 * Strictly adheres to Rules 8-12:
 * - Cumulative: earlier milestones remain counted.
 * - Meeting Count NO counts as Meeting Done.
 * - ONLY Meeting Count YES increments Total Meeting Count.
 * - Pending YES is independent.
 */
export function calculateLifetimeMetrics(
  leads: Lead[],
  activities: LeadActivity[] = []
): MetricsSummary {
  let totalInterested = 0;
  let totalMeetingScheduled = 0;
  let totalMeetingDone = 0;
  let totalMeetingCount = 0; // ONLY YES
  let meetingCountYes = 0;
  let meetingCountNo = 0;
  let pendingYes = 0;

  for (const lead of leads) {
    if (lead.is_interested || lead.interested_at) {
      totalInterested++;
    }
    if (lead.is_meeting_scheduled || lead.meeting_scheduled_at) {
      totalMeetingScheduled++;
    }
    // Both Meeting Count YES and Meeting Count NO count as Meeting Done
    if (lead.is_meeting_done || lead.meeting_done_at || lead.meeting_count_type === 'YES' || lead.meeting_count_type === 'NO') {
      totalMeetingDone++;
    }
    if (lead.meeting_count_type === 'YES') {
      meetingCountYes++;
      totalMeetingCount++; // ONLY YES counts towards Total Meeting Count
    } else if (lead.meeting_count_type === 'NO') {
      meetingCountNo++;
      // Meeting Count NO does NOT increment totalMeetingCount
    }
    if (lead.is_pending) {
      pendingYes++;
    }
  }

  let whatsappSent = 0;
  let callsDone = 0;
  let missedMeetings = 0;

  for (const act of activities) {
    if (act.activity_type === 'WhatsApp Sent') {
      whatsappSent++;
    } else if (act.activity_type === 'Call Done') {
      callsDone++;
    } else if (act.activity_type === 'Meeting Missed') {
      missedMeetings++;
    }
  }

  return {
    totalInterested,
    totalMeetingScheduled,
    totalMeetingDone,
    totalMeetingCount,
    meetingCountYes,
    meetingCountNo,
    pendingYes,
    whatsappSent,
    callsDone,
    missedMeetings,
  };
}

/**
 * Calculates Date-Scoped metrics (e.g. Today, Yesterday, Date Range).
 * Distinguishes WHEN the milestone happened from current lead status (Section 33, 61).
 */
export function calculateDateScopedMetrics(
  leads: Lead[],
  activities: LeadActivity[] = [],
  startDate: Date,
  endDate: Date
): MetricsSummary {
  let totalInterested = 0;
  let totalMeetingScheduled = 0;
  let totalMeetingDone = 0;
  let totalMeetingCount = 0;
  let meetingCountYes = 0;
  let meetingCountNo = 0;
  let pendingYes = 0;

  for (const lead of leads) {
    // Check interested timestamp (fallback strictly to created_at if milestone is marked without explicit interested_at)
    const interestedTimestamp = lead.interested_at || (lead.is_interested ? lead.created_at : null);
    if (isTimestampInRange(interestedTimestamp, startDate, endDate)) {
      totalInterested++;
    }
    // Check meeting scheduled timestamp
    const scheduledTimestamp = lead.meeting_scheduled_at || (lead.is_meeting_scheduled && lead.meeting_date ? `${lead.meeting_date}T00:00:00` : (lead.is_meeting_scheduled ? lead.created_at : null));
    if (isTimestampInRange(scheduledTimestamp, startDate, endDate)) {
      totalMeetingScheduled++;
    }
    // Check meeting done timestamp
    const doneTimestamp = lead.meeting_done_at || ((lead.is_meeting_done || lead.meeting_count_type) ? (lead.meeting_date ? `${lead.meeting_date}T00:00:00` : lead.created_at) : null);
    if (isTimestampInRange(doneTimestamp, startDate, endDate)) {
      totalMeetingDone++;
    }
    // Check meeting count timestamp
    const countTimestamp = lead.meeting_count_at || (lead.meeting_count_type ? (lead.meeting_date ? `${lead.meeting_date}T00:00:00` : lead.created_at) : null);
    if (isTimestampInRange(countTimestamp, startDate, endDate)) {
      if (lead.meeting_count_type === 'YES') {
        meetingCountYes++;
        totalMeetingCount++;
      } else if (lead.meeting_count_type === 'NO') {
        meetingCountNo++;
      }
    }
    // Check pending timestamp
    const pendingTimestamp = lead.pending_at || (lead.is_pending ? lead.created_at : null);
    if (isTimestampInRange(pendingTimestamp, startDate, endDate) && lead.is_pending) {
      pendingYes++;
    }
  }

  let whatsappSent = 0;
  let callsDone = 0;
  let missedMeetings = 0;

  for (const act of activities) {
    const actDate = new Date(act.created_at);
    if (actDate >= startDate && actDate <= endDate) {
      if (act.activity_type === 'WhatsApp Sent') {
        whatsappSent++;
      } else if (act.activity_type === 'Call Done') {
        callsDone++;
      } else if (act.activity_type === 'Meeting Missed') {
        missedMeetings++;
      }
    }
  }

  return {
    totalInterested,
    totalMeetingScheduled,
    totalMeetingDone,
    totalMeetingCount,
    meetingCountYes,
    meetingCountNo,
    pendingYes,
    whatsappSent,
    callsDone,
    missedMeetings,
  };
}

/**
 * Calculates Team Report rows for designated date range
 */
export function calculateTeamReport(
  users: UserProfile[],
  leads: Lead[],
  activities: LeadActivity[] = [],
  startDate?: Date,
  endDate?: Date
): TeamReportRow[] {
  return users.map((user) => {
    let interested = 0;
    let meetingScheduled = 0;
    let meetingDone = 0;
    let meetingCount = 0;
    let meetingCountYes = 0;
    let meetingCountNo = 0;
    let pending = 0;

    const userLeads = leads.filter(
      (l) => l.assigned_user_id === user.id || l.assigned_user_name?.toLowerCase() === user.full_name.toLowerCase()
    );

    for (const lead of userLeads) {
      const matchDate = (ts?: string | null) => {
        if (!startDate || !endDate) return true;
        return isTimestampInRange(ts, startDate, endDate);
      };

      if ((lead.is_interested || lead.interested_at) && matchDate(lead.interested_at)) {
        interested++;
      }
      if ((lead.is_meeting_scheduled || lead.meeting_scheduled_at) && matchDate(lead.meeting_scheduled_at)) {
        meetingScheduled++;
      }
      if (
        (lead.is_meeting_done || lead.meeting_done_at || lead.meeting_count_type) &&
        matchDate(lead.meeting_done_at || lead.meeting_count_at)
      ) {
        meetingDone++;
      }
      if (lead.meeting_count_type === 'YES' && matchDate(lead.meeting_count_at)) {
        meetingCountYes++;
        meetingCount++; // ONLY YES counts
      } else if (lead.meeting_count_type === 'NO' && matchDate(lead.meeting_count_at)) {
        meetingCountNo++;
      }
      if (lead.is_pending && matchDate(lead.pending_at)) {
        pending++;
      }
    }

    let whatsapp = 0;
    let calls = 0;

    for (const act of activities) {
      const isUser = act.user_id === user.id || act.user_name?.toLowerCase() === user.full_name.toLowerCase();
      if (isUser) {
        const inDate = !startDate || !endDate || isTimestampInRange(act.created_at, startDate, endDate);
        if (inDate) {
          if (act.activity_type === 'WhatsApp Sent') whatsapp++;
          if (act.activity_type === 'Call Done') calls++;
        }
      }
    }

    return {
      userId: user.id,
      name: user.full_name,
      interested,
      meetingScheduled,
      meetingDone,
      meetingCount,
      meetingCountYes,
      meetingCountNo,
      pending,
      whatsapp,
      calls,
    };
  });
}

/**
 * Calculates Day-by-Day Report rows (reproducing screenshot 3)
 */
export function calculateDayByDayReport(
  leads: Lead[],
  activities: LeadActivity[] = [],
  daysBack: number = 14,
  userId?: string
): DayReportRow[] {
  const rowMap = new Map<string, DayReportRow>();

  // Filter leads and activities by userId if specified and not 'all'
  const filteredLeads = userId && userId !== 'all'
    ? leads.filter((l) => l.assigned_user_id === userId)
    : leads;

  const filteredActivities = userId && userId !== 'all'
    ? activities.filter((a) => a.user_id === userId)
    : activities;

  // Initialize dates
  const now = new Date();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    rowMap.set(dateStr, {
      id: `auto_${dateStr}_${userId || 'all'}`,
      date: dateStr,
      userId: userId && userId !== 'all' ? userId : undefined,
      userName: userId && userId !== 'all' ? undefined : 'Team / All Reps',
      meetingScheduled: 0,
      meetingDone: 0,
      meetingCount: 0,
      pendingYes: 0,
      whatsapp: 0,
      calls: 0,
    });
  }

  // Aggregate leads milestones
  for (const lead of filteredLeads) {
    if (lead.meeting_scheduled_at) {
      const dStr = lead.meeting_scheduled_at.split('T')[0];
      const entry = rowMap.get(dStr);
      if (entry) entry.meetingScheduled++;
    }
    if (lead.meeting_done_at) {
      const dStr = lead.meeting_done_at.split('T')[0];
      const entry = rowMap.get(dStr);
      if (entry) entry.meetingDone++;
    }
    if (lead.meeting_count_at && lead.meeting_count_type === 'YES') {
      const dStr = lead.meeting_count_at.split('T')[0];
      const entry = rowMap.get(dStr);
      if (entry) entry.meetingCount++;
    }
    if (lead.pending_at && lead.is_pending) {
      const dStr = lead.pending_at.split('T')[0];
      const entry = rowMap.get(dStr);
      if (entry) entry.pendingYes++;
    }
  }

  // Aggregate activities
  for (const act of filteredActivities) {
    const dStr = act.created_at.split('T')[0];
    const entry = rowMap.get(dStr);
    if (entry) {
      if (act.activity_type === 'WhatsApp Sent') entry.whatsapp++;
      if (act.activity_type === 'Call Done') entry.calls++;
    }
  }

  return Array.from(rowMap.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export interface OutreachEmailMetrics {
  totalEmailSentToday: number;
  totalFollowUpEmailSentToday: number;
  totalEmailSentMonth: number;
  totalFollowUpEmailSentMonth: number;
}

export function calculateOutreachEmailMetrics(leads: Lead[], referenceDate: Date = new Date()): OutreachEmailMetrics {
  const todayBounds = getDayBounds(referenceDate);
  const monthBounds = getRunningMonthBounds(referenceDate);
  const todayStr = referenceDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  let totalEmailSentToday = 0;
  let totalFollowUpEmailSentToday = 0;
  let totalEmailSentMonth = 0;
  let totalFollowUpEmailSentMonth = 0;

  for (const lead of leads) {
    // 1. Email 1, 2, 3 dispatches
    const emailDates = [lead.email_1_date, lead.email_2_date, lead.email_3_date].filter(Boolean) as string[];
    for (const d of emailDates) {
      if (d.startsWith(todayStr)) {
        totalEmailSentToday++;
      }
      const parsedDate = new Date(d);
      if (!isNaN(parsedDate.getTime()) && parsedDate >= monthBounds.start && parsedDate <= monthBounds.end) {
        totalEmailSentMonth++;
      }
    }

    // 2. Interested Email Follow-up (FW1, FW2, FW3)
    if (lead.interested_email_followup_stage) {
      if (isTimestampInRange(lead.updated_at, todayBounds.start, todayBounds.end)) {
        totalFollowUpEmailSentToday++;
      }
      if (isTimestampInRange(lead.updated_at || lead.created_at, monthBounds.start, monthBounds.end)) {
        totalFollowUpEmailSentMonth++;
      }
    }
  }

  return {
    totalEmailSentToday,
    totalFollowUpEmailSentToday,
    totalEmailSentMonth,
    totalFollowUpEmailSentMonth,
  };
}
