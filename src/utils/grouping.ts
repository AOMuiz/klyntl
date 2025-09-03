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

/**
 * Groups items alphabetically by the first letter of a specified property
 */
export function groupByAlphabet<T extends Record<string, any>>(
  items: T[],
  propertyName: keyof T,
  options: {
    includeNumbers?: boolean;
    numbersGroupLabel?: string;
  } = {}
): GroupedData<T> {
  const { includeNumbers = true, numbersGroupLabel = "#" } = options;

  const sections: GroupedData<T> = {};

  // Sort items alphabetically first
  const sortedItems = [...items].sort((a, b) => {
    const aValue = String(a[propertyName]).toLowerCase();
    const bValue = String(b[propertyName]).toLowerCase();
    return aValue.localeCompare(bValue);
  });

  sortedItems.forEach((item) => {
    const value = String(item[propertyName]);
    const firstChar = value.charAt(0).toUpperCase();

    let sectionKey: string;

    // Check if it's a number
    if (/^\d/.test(firstChar)) {
      sectionKey = includeNumbers ? numbersGroupLabel : "A-Z";
    } else if (/^[A-Z]/.test(firstChar)) {
      sectionKey = firstChar;
    } else {
      // For non-alphanumeric characters, group under "A-Z" or custom label
      sectionKey = "A-Z";
    }

    if (!sections[sectionKey]) {
      sections[sectionKey] = [];
    }
    sections[sectionKey].push(item);
  });

  return sections;
}

/**
 * Converts grouped data to a flat array with section headers
 */
export function flattenGroupedData<T>(
  groupedData: GroupedData<T>,
  options: {
    createHeaderItem: (key: string, items: T[]) => any;
    createDataItem: (item: T) => any;
    sortKeys?: boolean;
    priorityKeys?: string[];
  }
): any[] {
  const {
    createHeaderItem,
    createDataItem,
    sortKeys = true,
    priorityKeys = [],
  } = options;

  const orderedKeys = sortKeys
    ? getOrderedGroupKeys(groupedData, priorityKeys)
    : Object.keys(groupedData);

  const flatData: any[] = [];

  orderedKeys.forEach((key) => {
    const items = groupedData[key];

    // Add section header
    flatData.push(createHeaderItem(key, items));

    // Add all items in this section
    items.forEach((item) => {
      flatData.push(createDataItem(item));
    });
  });

  return flatData;
}

/**
 * Groups contacts alphabetically and returns flat data with headers
 */
export function groupContactsAlphabetically<T extends { name: string }>(
  contacts: T[],
  options: {
    includeNumbers?: boolean;
    numbersGroupLabel?: string;
  } = {}
): (
  | { type: "header"; letter: string; id: string }
  | (T & { type: "contact" })
)[] {
  const groupedData = groupByAlphabet(contacts, "name", options);

  return flattenGroupedData(groupedData, {
    createHeaderItem: (key, items) => ({
      type: "header" as const,
      letter: key,
      id: `header-${key}`,
    }),
    createDataItem: (item) => ({
      ...item,
      type: "contact" as const,
    }),
    priorityKeys: ["#"], // Numbers group should come last
  });
}
