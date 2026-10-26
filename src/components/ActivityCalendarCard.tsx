"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ActivityInfo {
  count: number;
  types: string[]; // "BOOK", "VIDEO", "PODCAST"
}

interface ActivityCalendarCardProps {
  dailyActivity?: Record<string, ActivityInfo>;
}

export default function ActivityCalendarCard({
  dailyActivity = {},
}: ActivityCalendarCardProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, [today]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("en-US", { month: "short" });

  // Days in selected month (cappeable to 30 or full days)
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  // Display 30 days (or all days of the month)
  const displayDaysCount = useMemo(() => {
    return daysInMonth;
  }, [daysInMonth]);

  // Total reflections logged in current month
  const totalCount = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= displayDaysCount; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      count += dailyActivity[dateStr]?.count || 0;
    }
    return count;
  }, [displayDaysCount, year, month, dailyActivity]);

  // Soft background & border helper based on media type logged
  const getActivityStyle = (activity?: ActivityInfo) => {
    if (!activity || activity.count === 0 || activity.types.length === 0) {
      return "bg-black/[0.03] dark:bg-white/[0.04] text-muted-theme/60 border border-black/[0.04] dark:border-white/[0.05]";
    }

    const { types } = activity;
    if (types.length > 1) {
      // Mixed media (more than 1 type) -> Amber
      return "bg-amber-500/90 text-white font-normal border border-amber-600/50 shadow-2xs";
    }

    const singleType = types[0];
    if (singleType === "VIDEO") {
      // Video only -> Red
      return "bg-red-500/90 text-white font-normal border border-red-600/50 shadow-2xs";
    }
    if (singleType === "PODCAST") {
      // Podcast only -> Purple
      return "bg-purple-500/90 text-white font-normal border border-purple-600/50 shadow-2xs";
    }
    // Book only -> Blue
    return "bg-blue-500/90 text-white font-normal border border-blue-600/50 shadow-2xs";
  };

  const getActivityTooltip = (dateStr: string, activity?: ActivityInfo) => {
    if (!activity || activity.count === 0) {
      return `${dateStr}: No reflections`;
    }
    const typeList = activity.types.map((t) => (t === "PODCAST" ? "Audio" : t.toLowerCase())).join(" & ");
    return `${dateStr}: ${activity.count} ${activity.count === 1 ? "reflection" : "reflections"} (${typeList})`;
  };

  return (
    <div className="apple-card p-3.5 flex flex-col gap-2.5 w-full select-none">
      {/* Header: Month Navigator & Reflection Count */}
      <div className="flex items-center justify-between pb-2 border-b border-subtle-theme">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-md text-muted-theme hover:text-main hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors apple-press cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-main select-none px-1">
            {monthName} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-md text-muted-theme hover:text-main hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors apple-press cursor-pointer"
            title="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-[11px] text-muted-theme font-normal">
          {totalCount} {totalCount === 1 ? "reflection" : "reflections"}
        </span>
      </div>

      {/* 30-Day Activity Matrix: Vertical Boxes, 10 per row */}
      <div className="grid grid-cols-10 gap-1.5 w-full">
        {Array.from({ length: displayDaysCount }, (_, i) => {
          const dayNum = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const activity = dailyActivity[dateStr];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={`activity-day-${dayNum}`}
              title={getActivityTooltip(dateStr, activity)}
              className={`h-7 rounded-[5px] flex items-center justify-center text-[10px] font-normal leading-none transition-all cursor-default ${
                isToday
                  ? "ring-1.5 ring-accent-theme ring-offset-1 ring-offset-surface"
                  : ""
              } ${getActivityStyle(activity)}`}
            >
              <span>{dayNum}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
