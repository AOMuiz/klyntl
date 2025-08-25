# Klyntl - Expo Router Project Structure

## ✅ Expo Router App Structure

This project uses **Expo Router** with file-based routing and follows modern React Native development practices:

```
klyntl/
├── app.json                      # Expo app configuration
├── babel.config.js              # Babel configuration for Metro bundler
├── expo-env.d.ts                # Expo TypeScript declarations
├── package.json                 # Dependencies and scripts
├── pnpm-lock.yaml              # PNPM lock file
├── pnpm-workspace.yaml         # PNPM workspace configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.js            # ESLint configuration
├──
├── assets/                     # Static assets
│   ├── fonts/                  # Custom fonts
│   └── images/                 # Images and icons
│
├── scripts/                    # Build and utility scripts
│   └── reset-project.js        # Project reset utility
│
└── src/                        # Main source code
    ├── app/                    # 🚀 Expo Router - File-based routing
    │   ├── _layout.tsx         # Root layout component
    │   ├── +not-found.tsx     # 404 page
    │   └── (tabs)/             # Tab-based navigation group
    │       ├── _layout.tsx     # Tab layout
    │       ├── index.tsx       # Home tab (/)
    │       └── explore.tsx     # Explore tab (/explore)
    │
    ├── components/             # Reusable UI components
    │   ├── CustomerCard.tsx    # Customer card component
    │   ├── Collapsible.tsx     # Collapsible content
    │   ├── ExternalLink.tsx    # External link handler
    │   ├── HapticTab.tsx       # Tab with haptic feedback
    │   ├── HelloWave.tsx       # Animated wave component
    │   ├── ParallaxScrollView.tsx # Parallax scroll view
    │   ├── ThemedText.tsx      # Themed text component
    │   ├── ThemedView.tsx      # Themed view component
    │   ├── __tests__/          # Component tests
    │   │   └── CustomerCard.test.tsx
    │   └── ui/                 # Platform-specific UI components
    │       ├── IconSymbol.tsx  # Cross-platform icon
    │       ├── IconSymbol.ios.tsx # iOS-specific icon
    │       ├── TabBarBackground.tsx # Tab bar background
    │       └── TabBarBackground.ios.tsx # iOS tab bar
    │
    ├── constants/              # Application constants
    │   ├── app.ts             # App configuration
    │   └── Colors.ts          # Color theme definitions
    │
    ├── hooks/                  # Custom React hooks
    │   ├── useColorScheme.ts   # Color scheme hook
    │   ├── useColorScheme.web.ts # Web-specific color scheme
    │   └── useThemeColor.ts    # Theme color hook
    │
    ├── navigation/             # Navigation utilities (if needed)
    │
    ├── screens/                # Screen components (if not using app/ router)
    │
    ├── services/               # Business logic and API services
    │   ├── database.ts         # SQLite database service
    │   └── __tests__/          # Service tests
    │       └── database.test.ts
    │
    ├── stores/                 # State management (Zustand)
    │   ├── customerStore.ts    # Customer state management
    │   └── __tests__/          # Store tests
    │       └── customerStore.test.ts
    │
    ├── types/                  # TypeScript type definitions
    │   ├── analytics.ts        # Analytics types
    │   ├── customer.ts         # Customer types
    │   └── transaction.ts      # Transaction types
    │
    ├── utils/                  # Utility functions
    │   ├── helpers.ts          # Common helper functions
    │   └── __tests__/          # Utility tests
    │       └── helpers.test.ts
    │
    └── __tests__/              # Global test setup and utilities
        ├── setup.ts            # Jest configuration and mocks
        └── test-utils.tsx      # Custom render functions and test helpers
```

## 🔧 Expo Router Features & Configuration

### File-Based Routing

Expo Router uses the file system to define routes:

- `src/app/_layout.tsx` - Root layout for the entire app
- `src/app/(tabs)/_layout.tsx` - Layout for tab-based navigation
- `src/app/(tabs)/index.tsx` - Home screen (matches `/`)
- `src/app/(tabs)/explore.tsx` - Explore screen (matches `/explore`)
- `src/app/+not-found.tsx` - 404 error page

### TypeScript Path Mapping

#### Updated `tsconfig.json`

- ✅ Configured baseUrl as "."
- ✅ Added comprehensive path mappings with `@/` prefix
- ✅ Added proper module resolution settings

### Path Aliases Available

```typescript
// Import examples using path aliases:
import { Customer } from "@/types/customer";
import { useCustomerStore } from "@/stores/customerStore";
import { DatabaseService } from "@/services/database";
import { formatCurrency } from "@/utils/helpers";
import { APP_CONFIG } from "@/constants/app";
import { CustomerCard } from "@/components/CustomerCard";
```

### Expo Router Navigation

```typescript
// Navigation in Expo Router
import { router } from "expo-router";

// Navigate to different screens
router.push("/explore");
router.replace("/login");
router.back();

// Using Link component
import { Link } from "expo-router";

<Link href="/explore">Go to Explore</Link>;
```

## 📋 What Was Fixed

### 1. Test Framework Issues

- ❌ **Before**: AsyncStorage mock causing test failures
- ✅ **After**: Removed unnecessary AsyncStorage mock
- ❌ **Before**: Incorrect React Native test matchers
- ✅ **After**: Using `.props.children` for text content assertions

### 2. Date Logic Bug

- ❌ **Before**: `Math.ceil` causing date miscalculations
- ✅ **After**: `Math.floor` for accurate day counting
- ✅ **Added**: "Today" case for same-day purchases

### 3. Import Structure

- ❌ **Before**: Incorrect test utility imports
- ✅ **After**: Proper separation of concerns in imports

## 🧪 Testing Structure

All tests follow the co-location pattern:

```typescript
src/[module]/
├── index.ts
└── __tests__/
    └── index.test.ts
```

### Test Categories

- **Unit Tests**: Individual functions and components
- **Integration Tests**: Services and stores working together
- **Component Tests**: UI behavior and interactions

### Test Setup

The project uses:

- **Jest** with `jest-expo` preset
- **React Native Testing Library** for component testing
- **Custom render function** with providers in `test-utils.tsx`
- **Mock utilities** for database and external services

## 🚀 Expo Router Development

### 1. Install Dependencies

```bash
# Using PNPM (project uses PNPM)
pnpm install

# Or using npm
npm install
```

### 2. Start Development Server

```bash
# Start Expo development server
npx expo start

# Or using package.json scripts
npm start
```

### 3. Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### 4. Creating New Routes

In Expo Router, create new routes by adding files to the `src/app/` directory:

```typescript
// src/app/profile.tsx - Creates /profile route
export default function Profile() {
  return <ProfileScreen />;
}

// src/app/customers/[id].tsx - Creates /customers/:id route
import { useLocalSearchParams } from "expo-router";

export default function CustomerDetail() {
  const { id } = useLocalSearchParams();
  return <CustomerDetailScreen customerId={id} />;
}
```

## 🔍 Development Guidelines

### Import Best Practices

When creating new files, use absolute imports with the `@/` prefix:

**✅ Good:**

```typescript
import { validateNigerianPhone } from "@/utils/helpers";
import { useCustomerStore } from "@/stores/customerStore";
import { router } from "expo-router";
```

**❌ Avoid:**

```typescript
import { validateNigerianPhone } from "../../../utils/helpers";
import { useCustomerStore } from "../../stores/customerStore";
```

### Development Workflow

1. **New Routes**: Add files to `src/app/` directory
2. **New Components**: Place in `src/components/`
3. **New Services**: Place in `src/services/`
4. **New Types**: Place in `src/types/`
5. **New Tests**: Co-locate with source files
6. **Constants**: Add to `src/constants/`
7. **Utilities**: Add to `src/utils/`

### Verification Commands

```bash
# Run TypeScript check
npx tsc --noEmit

# Run tests
npm test

# Run linting
npm run lint

# Start development server
npm start
```

## 📁 Expo Router File Organization

### 1. Route Organization

```typescript
// src/app/ - File-based routing
├── _layout.tsx              # Root layout (wraps all routes)
├── +not-found.tsx          # 404 page
├── (tabs)/                 # Route group (doesn't affect URL)
│   ├── _layout.tsx         # Tab navigator layout
│   ├── index.tsx           # /tabs route (home)
│   └── explore.tsx         # /tabs/explore route
├── customers/              # Customer routes
│   ├── _layout.tsx         # Customer section layout
│   ├── index.tsx           # /customers route (list)
│   └── [id].tsx           # /customers/[id] route (detail)
└── auth/                   # Authentication routes
    ├── login.tsx           # /auth/login route
    └── register.tsx        # /auth/register route
```

### 2. Component Organization

```typescript
// src/components/
├── CustomerCard/
│   ├── index.tsx              # Main component
│   ├── CustomerCard.styles.ts # Styles (if using styled-components)
│   ├── CustomerCard.types.ts  # Component-specific types
│   └── __tests__/
│       └── CustomerCard.test.tsx
├── ui/                        # Shared UI components
│   ├── Button/
│   ├── Input/
│   └── Modal/
└── layout/                    # Layout components
    ├── Header/
    └── Footer/
```

### 3. State Management Organization

```typescript
// src/stores/ - Zustand stores
├── customerStore.ts          # Customer data management
├── authStore.ts             # Authentication state
├── appStore.ts              # Global app state
└── __tests__/               # Store tests
    ├── customerStore.test.ts
    └── authStore.test.ts
```

### 4. Service Organization

```typescript
// src/services/
├── database/
│   ├── index.ts          # Main database service
│   ├── migrations.ts     # Database migrations
│   ├── queries.ts        # SQL queries
│   └── __tests__/
├── api/
│   ├── customer.ts       # Customer API calls
│   ├── auth.ts          # Authentication API
│   └── __tests__/
└── storage/
    ├── index.ts          # Local storage utilities
    └── __tests__/
```

The project is now properly structured for Expo Router development with comprehensive testing and modern React Native practices! 🎉
