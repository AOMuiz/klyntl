/**
 * Reusable grouping utilities for organizing data by time periods
 */

export interface GroupedData<T> {
  [key: string]: T[];
}

/**
 * Groups items by date periods (Today, Yesterday, This Month, Previous Months)
 */
export function groupByDatePeriods<T extends { date: string }>(
  items: T[],
  options: {
    todayLabel?: string;
    yesterdayLabel?: string;
    thisMonthLabel?: string;
    monthFormat?: "short" | "long";
    yearFormat?: "numeric" | "2-digit";
  } = {}
): GroupedData<T> {
  const {
    todayLabel = "Today",
    yesterdayLabel = "Yesterday",
    thisMonthLabel = "This Month",
    monthFormat = "short",
    yearFormat = "numeric",
  } = options;

  const now = new Date();
  const sections: GroupedData<T> = {};

  // Sort items by date (newest first)
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sortedItems.forEach((item) => {
    const itemDate = new Date(item.date);
    const itemDateString = itemDate.toDateString();
    const nowDateString = now.toDateString();

    let sectionKey: string;

    if (itemDateString === nowDateString) {
      sectionKey = todayLabel;
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayString = yesterday.toDateString();

      if (itemDateString === yesterdayString) {
        sectionKey = yesterdayLabel;
      } else if (
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getFullYear() === now.getFullYear()
      ) {
        sectionKey = thisMonthLabel;
      } else {
        // Group by month and year
        const monthName = itemDate.toLocaleDateString("en-US", {
          month: monthFormat,
          year: yearFormat,
        });
        sectionKey = monthName;
      }
    }

    if (!sections[sectionKey]) {
      sections[sectionKey] = [];
    }
    sections[sectionKey].push(item);
  });

  return sections;
}

/**
 * Groups items by week periods
 */
export function groupByWeeks<T extends { date: string }>(
  items: T[],
  options: {
    thisWeekLabel?: string;
    lastWeekLabel?: string;
    weekFormat?: "short" | "long";
  } = {}
): GroupedData<T> {
  const {
    thisWeekLabel = "This Week",
    lastWeekLabel = "Last Week",
    weekFormat = "short",
  } = options;

  const now = new Date();
  const sections: GroupedData<T> = {};

  // Sort items by date (newest first)
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sortedItems.forEach((item) => {
    const itemDate = new Date(item.date);
    const nowWeekStart = new Date(now);
    nowWeekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)

    const lastWeekStart = new Date(nowWeekStart);
    lastWeekStart.setDate(nowWeekStart.getDate() - 7);

    let sectionKey: string;

    if (itemDate >= nowWeekStart) {
      sectionKey = thisWeekLabel;
    } else if (itemDate >= lastWeekStart) {
      sectionKey = lastWeekLabel;
    } else {
      // Group by month and year for older items
      const monthName = itemDate.toLocaleDateString("en-US", {
        month: weekFormat,
        year: "numeric",
      });
      sectionKey = monthName;
    }

    if (!sections[sectionKey]) {
      sections[sectionKey] = [];
    }
    sections[sectionKey].push(item);
  });

  return sections;
}

/**
 * Generic grouping function that can group by any date-based criteria
 */
export function groupByCustomDate<T extends { date: string }>(
  items: T[],
  grouper: (date: Date) => string
): GroupedData<T> {
  const sections: GroupedData<T> = {};

  // Sort items by date (newest first)
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sortedItems.forEach((item) => {
    const itemDate = new Date(item.date);
    const sectionKey = grouper(itemDate);

    if (!sections[sectionKey]) {
      sections[sectionKey] = [];
    }
    sections[sectionKey].push(item);
  });

  return sections;
}

/**
 * Gets the keys of grouped data in the desired order
 */
export function getOrderedGroupKeys(
  groupedData: GroupedData<any>,
  priorityKeys: string[] = []
): string[] {
  const allKeys = Object.keys(groupedData);

  // Separate priority keys from other keys
  const priority = priorityKeys.filter((key) => allKeys.includes(key));
  const others = allKeys.filter((key) => !priorityKeys.includes(key));

  // Sort others alphabetically (for consistent ordering of months)
  others.sort();

  return [...priority, ...others];
}
