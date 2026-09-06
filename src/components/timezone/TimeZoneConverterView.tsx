import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Clock,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Calendar,
  RefreshCw,
  Search,
  MapPin
} from 'lucide-react';
import { formatTo12Hour } from '../../lib/formatTime';

interface TimezoneOption {
  country: string;
  code: string;
  name: string;
  iana: string;
  utcOffsetMinutes: number; // minutes from UTC
}

const COMMON_TIMEZONES: TimezoneOption[] = [
  { country: 'Nigeria', code: 'WAT', name: 'West Africa Time (Nigeria / Lagos)', iana: 'Africa/Lagos', utcOffsetMinutes: 60 },
  { country: 'United Kingdom', code: 'UK', name: 'United Kingdom (London - GMT/BST)', iana: 'Europe/London', utcOffsetMinutes: 60 },
  { country: 'Bangladesh', code: 'BD', name: 'Bangladesh Standard Time (Dhaka)', iana: 'Asia/Dhaka', utcOffsetMinutes: 360 },
  { country: 'United States (East)', code: 'EDT', name: 'US Eastern (New York / Miami)', iana: 'America/New_York', utcOffsetMinutes: -240 },
  { country: 'United States (Central)', code: 'CDT', name: 'US Central (Chicago / Dallas)', iana: 'America/Chicago', utcOffsetMinutes: -300 },
  { country: 'United States (West)', code: 'PDT', name: 'US Pacific (Los Angeles / SF)', iana: 'America/Los_Angeles', utcOffsetMinutes: -420 },
  { country: 'India', code: 'IST', name: 'India Standard Time (Delhi / Mumbai)', iana: 'Asia/Kolkata', utcOffsetMinutes: 330 },
  { country: 'United Arab Emirates', code: 'GST', name: 'Gulf Standard Time (Dubai / Abu Dhabi)', iana: 'Asia/Dubai', utcOffsetMinutes: 240 },
  { country: 'Kenya', code: 'EAT', name: 'East Africa Time (Nairobi)', iana: 'Africa/Nairobi', utcOffsetMinutes: 180 },
  { country: 'South Africa', code: 'SAST', name: 'South Africa Standard Time (Johannesburg)', iana: 'Africa/Johannesburg', utcOffsetMinutes: 120 },
  { country: 'Pakistan', code: 'PKT', name: 'Pakistan Standard Time (Karachi / Lahore)', iana: 'Asia/Karachi', utcOffsetMinutes: 300 },
  { country: 'Singapore / Malaysia', code: 'SGT', name: 'Singapore / Malaysia Time (SGT)', iana: 'Asia/Singapore', utcOffsetMinutes: 480 },
  { country: 'Australia (East)', code: 'AEST', name: 'Australian Eastern (Sydney / Melbourne)', iana: 'Australia/Sydney', utcOffsetMinutes: 600 },
  { country: 'Germany / France', code: 'CEST', name: 'Central European Time (Berlin / Paris)', iana: 'Europe/Paris', utcOffsetMinutes: 120 },
  { country: 'Ghana', code: 'GMT', name: 'Ghana / West Africa (Accra)', iana: 'Africa/Accra', utcOffsetMinutes: 0 },
  { country: 'Philippines', code: 'PHT', name: 'Philippine Standard Time (Manila)', iana: 'Asia/Manila', utcOffsetMinutes: 480 },
  { country: 'Canada (East)', code: 'EDT', name: 'Canada Eastern (Toronto / Montreal)', iana: 'America/Toronto', utcOffsetMinutes: -240 },
  { country: 'Saudi Arabia', code: 'AST', name: 'Arabia Standard Time (Riyadh)', iana: 'Asia/Riyadh', utcOffsetMinutes: 180 },
  { country: 'Qatar', code: 'AST', name: 'Qatar Time (Doha)', iana: 'Asia/Qatar', utcOffsetMinutes: 180 },
  { country: 'Egypt', code: 'EEST', name: 'Eastern European Summer (Cairo)', iana: 'Africa/Cairo', utcOffsetMinutes: 180 },
];

export const TimeZoneConverterView: React.FC = () => {
  // Client input state
  const [clientCountryIana, setClientCountryIana] = useState<string>('Africa/Lagos');
  const [clientHour, setClientHour] = useState<string>('10');
  const [clientMinute, setClientMinute] = useState<string>('00');
  const [clientAmPm, setClientAmPm] = useState<'AM' | 'PM'>('AM');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Live clocks state
  const [nowTime, setNowTime] = useState<Date>(new Date());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const selectedClientTz = useMemo(() => {
    return COMMON_TIMEZONES.find((t) => t.iana === clientCountryIana) || COMMON_TIMEZONES[0];
  }, [clientCountryIana]);

  // Convert Client Time to UTC minutes
  const conversionResult = useMemo(() => {
    let hourNum = parseInt(clientHour, 10);
    if (isNaN(hourNum)) hourNum = 10;
    if (clientAmPm === 'PM' && hourNum < 12) hourNum += 12;
    if (clientAmPm === 'AM' && hourNum === 12) hourNum = 0;

    const minuteNum = parseInt(clientMinute, 10) || 0;
    const clientTotalMinutes = hourNum * 60 + minuteNum;

    // Convert to UTC minutes
    const clientOffset = selectedClientTz.utcOffsetMinutes;
    let utcMinutes = clientTotalMinutes - clientOffset;

    // Convert helper for target offset
    const getTargetTime = (targetOffset: number, targetName: string, targetCode: string) => {
      let targetMinutes = utcMinutes + targetOffset;
      let dayDelta = 0;

      while (targetMinutes < 0) {
        targetMinutes += 24 * 60;
        dayDelta -= 1;
      }
      while (targetMinutes >= 24 * 60) {
        targetMinutes -= 24 * 60;
        dayDelta += 1;
      }

      const h24 = Math.floor(targetMinutes / 60);
      const m = targetMinutes % 60;
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 || 12;
      const formattedTime = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;

      // Offset diff relative to client
      const diffMinutes = targetOffset - clientOffset;
      const diffHours = diffMinutes / 60;
      let relativeText = 'Same time';
      if (diffHours > 0) {
        relativeText = `${Math.abs(diffHours)} hr${Math.abs(diffHours) === 1 ? '' : 's'} ahead of ${selectedClientTz.country}`;
      } else if (diffHours < 0) {
        relativeText = `${Math.abs(diffHours)} hr${Math.abs(diffHours) === 1 ? '' : 's'} behind ${selectedClientTz.country}`;
      }

      return {
        formattedTime,
        dayDelta,
        relativeText,
        code: targetCode,
        name: targetName,
      };
    };

    // UK is UTC+1 (BST in September)
    const ukTime = getTargetTime(60, 'United Kingdom (London)', 'UK / BST');
    // Bangladesh is UTC+6
    const bdTime = getTargetTime(360, 'Bangladesh (Dhaka)', 'BST (UTC+6)');

    const inviteString = `Meeting Confirmed: ${clientHour}:${clientMinute} ${clientAmPm} ${selectedClientTz.country} (${selectedClientTz.code}) / ${ukTime.formattedTime} UK / ${bdTime.formattedTime} Bangladesh`;

    return {
      ukTime,
      bdTime,
      inviteString,
    };
  }, [clientHour, clientMinute, clientAmPm, selectedClientTz]);

  // Live clocks formatting
  const formatLiveClock = (timeZone: string) => {
    try {
      return nowTime.toLocaleTimeString('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return nowTime.toLocaleTimeString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#00C2FF]" />
            <span>Global Time Zone Converter</span>
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Instantly convert prospect & client meeting times into United Kingdom and Bangladesh local hours.
          </p>
        </div>

        {/* Quick Date display */}
        <div className="flex items-center space-x-2 text-xs bg-[#111827] border border-[#1E3A5F] px-3 py-1.5 rounded-lg text-[#00C2FF] font-mono">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date().toDateString()}</span>
        </div>
      </div>

      {/* Main Conversion Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Client Time Input (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl p-5 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#1E3A5F]">
            <div className="w-8 h-8 rounded-lg bg-[#00C2FF]/15 border border-[#00C2FF]/30 flex items-center justify-center text-[#00C2FF]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Client's Proposed Time</h3>
              <p className="text-[11px] text-[#94A3B8]">
                Set the meeting time stated by the client
              </p>
            </div>
          </div>

          {/* Client Country / Timezone Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#00C2FF]" />
              <span>Client's Country / Timezone:</span>
            </label>
            <select
              value={clientCountryIana}
              onChange={(e) => setClientCountryIana(e.target.value)}
              className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs focus:border-[#00C2FF] focus:outline-none"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.iana} value={tz.iana}>
                  {tz.name}
                </option>
              ))}
            </select>
          </div>

          {/* 12-Hour Time Selectors */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white">Meeting Time (12-Hour):</label>
            <div className="grid grid-cols-3 gap-2">
              {/* Hour Select */}
              <div>
                <select
                  value={clientHour}
                  onChange={(e) => setClientHour(e.target.value)}
                  className="w-full bg-[#111827] text-white text-center font-mono font-bold text-sm border border-[#1E3A5F] rounded-lg py-2 focus:border-[#00C2FF] focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#7B7B7B] block text-center mt-1">Hour</span>
              </div>

              {/* Minute Select */}
              <div>
                <select
                  value={clientMinute}
                  onChange={(e) => setClientMinute(e.target.value)}
                  className="w-full bg-[#111827] text-white text-center font-mono font-bold text-sm border border-[#1E3A5F] rounded-lg py-2 focus:border-[#00C2FF] focus:outline-none"
                >
                  {['00', '15', '30', '45', '10', '20', '40', '50'].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#7B7B7B] block text-center mt-1">Minute</span>
              </div>

              {/* AM / PM Toggle */}
              <div>
                <div className="grid grid-cols-2 bg-[#111827] border border-[#1E3A5F] rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setClientAmPm('AM')}
                    className={`py-1.5 text-xs font-bold rounded ${
                      clientAmPm === 'AM'
                        ? 'bg-[#00C2FF] text-black shadow-md'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientAmPm('PM')}
                    className={`py-1.5 text-xs font-bold rounded ${
                      clientAmPm === 'PM'
                        ? 'bg-[#00C2FF] text-black shadow-md'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    PM
                  </button>
                </div>
                <span className="text-[10px] text-[#7B7B7B] block text-center mt-1">Period</span>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5 pt-2 border-t border-[#1E3A5F]/40">
            <span className="text-[11px] text-[#7B7B7B]">Quick Client Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '10:00 AM Nigeria', iana: 'Africa/Lagos', h: '10', m: '00', ampm: 'AM' as const },
                { label: '02:00 PM Nigeria', iana: 'Africa/Lagos', h: '02', m: '00', ampm: 'PM' as const },
                { label: '11:00 AM UK', iana: 'Europe/London', h: '11', m: '00', ampm: 'AM' as const },
                { label: '03:00 PM US East', iana: 'America/New_York', h: '03', m: '00', ampm: 'PM' as const },
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setClientCountryIana(p.iana);
                    setClientHour(p.h);
                    setClientMinute(p.m);
                    setClientAmPm(p.ampm);
                  }}
                  className="px-2 py-1 bg-[#111827] hover:bg-[#182234] border border-[#1E3A5F] rounded text-[11px] text-[#00C2FF] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Instant Live Conversion Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Target 1: United Kingdom (London) */}
          <div className="bg-[#0A0A0A] border-2 border-[#00C2FF]/60 rounded-xl p-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">🇬🇧</span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#00C2FF]">
                    United Kingdom Time (London)
                  </h4>
                  <p className="text-[11px] text-[#94A3B8]">{conversionResult.ukTime.relativeText}</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy('uk', `${conversionResult.ukTime.formattedTime} UK time`)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-[#111827] hover:bg-[#182234] border border-[#1E3A5F] rounded text-xs text-white transition-all hover:border-[#00C2FF]"
              >
                {copiedKey === 'uk' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#00E5A0]" />
                    <span className="text-[#00E5A0]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#00C2FF]" />
                    <span>Copy Time</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 flex items-baseline space-x-3">
              <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
                {conversionResult.ukTime.formattedTime}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/40">
                UK / BST
              </span>
            </div>
          </div>

          {/* Target 2: Bangladesh (Dhaka) */}
          <div className="bg-[#0A0A0A] border-2 border-[#00E5A0]/60 rounded-xl p-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">🇧🇩</span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#00E5A0]">
                    Bangladesh Time (Dhaka)
                  </h4>
                  <p className="text-[11px] text-[#94A3B8]">{conversionResult.bdTime.relativeText}</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy('bd', `${conversionResult.bdTime.formattedTime} Bangladesh time`)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-[#111827] hover:bg-[#182234] border border-[#1E3A5F] rounded text-xs text-white transition-all hover:border-[#00E5A0]"
              >
                {copiedKey === 'bd' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#00E5A0]" />
                    <span className="text-[#00E5A0]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#00E5A0]" />
                    <span>Copy Time</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 flex items-baseline space-x-3">
              <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
                {conversionResult.bdTime.formattedTime}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-[#00E5A0]/15 text-[#00E5A0] border border-[#00E5A0]/40">
                BD / BST (UTC+6)
              </span>
            </div>
          </div>

          {/* Formatted Invite Generator */}
          <div className="p-3.5 bg-[#111827] border border-[#1E3A5F] rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-0.5 truncate">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                1-Click Meeting Confirmation Message:
              </span>
              <p className="font-mono text-xs text-white truncate">
                {conversionResult.inviteString}
              </p>
            </div>
            <button
              onClick={() => handleCopy('invite', conversionResult.inviteString)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[#00C2FF] hover:bg-[#00C2FF]/80 text-black font-bold text-xs rounded-lg transition-all shrink-0"
            >
              {copiedKey === 'invite' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Invite</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live World Clocks Bar */}
      <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl p-4 shadow-xl">
        <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-[#00C2FF]" />
          <span>Live Ticking Clocks Right Now</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* London */}
          <div className="p-2.5 bg-[#111827] border border-[#1E3A5F]/60 rounded-lg">
            <span className="text-[#94A3B8] text-[11px] block">🇬🇧 London, UK</span>
            <span className="font-mono font-bold text-white text-sm block mt-0.5">
              {formatLiveClock('Europe/London')}
            </span>
          </div>

          {/* Dhaka */}
          <div className="p-2.5 bg-[#111827] border border-[#1E3A5F]/60 rounded-lg">
            <span className="text-[#94A3B8] text-[11px] block">🇧🇩 Dhaka, Bangladesh</span>
            <span className="font-mono font-bold text-white text-sm block mt-0.5">
              {formatLiveClock('Asia/Dhaka')}
            </span>
          </div>

          {/* Lagos */}
          <div className="p-2.5 bg-[#111827] border border-[#1E3A5F]/60 rounded-lg">
            <span className="text-[#94A3B8] text-[11px] block">🇳🇬 Lagos, Nigeria</span>
            <span className="font-mono font-bold text-white text-sm block mt-0.5">
              {formatLiveClock('Africa/Lagos')}
            </span>
          </div>

          {/* New York */}
          <div className="p-2.5 bg-[#111827] border border-[#1E3A5F]/60 rounded-lg">
            <span className="text-[#94A3B8] text-[11px] block">🇺🇸 New York, US</span>
            <span className="font-mono font-bold text-white text-sm block mt-0.5">
              {formatLiveClock('America/New_York')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
