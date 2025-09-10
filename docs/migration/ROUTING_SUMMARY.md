# Klyntl App Routing Architecture Summary

## 📁 Current Structure

```
src/app/
├── _layout.tsx                 # Root layout with onboarding protection
├── +not-found.tsx             # 404 page
├── onboarding.tsx             # Public onboarding flow
├── (tabs)/                    # Main tab navigation
│   ├── _layout.tsx           # Tab configuration
│   ├── index.tsx             # Home/Dashboard
│   ├── customers.tsx         # Customer list
│   ├── transactions.tsx      # Transaction list
│   ├── analytics.tsx         # Analytics dashboard
│   └── store/                # Store section
│       ├── _layout.tsx       # Store navigation
│       ├── index.tsx         # Store listing
│       └── [id].tsx          # Store item details
├── (modal)/                  # Modal presentations
│   ├── _layout.tsx          # Modal configuration
│   ├── customer/            # Customer modals
│   │   ├── _layout.tsx      # Customer modal layout
│   │   ├── add.tsx          # Add customer modal
│   │   └── edit/[id].tsx    # Edit customer modal
│   ├── transaction/         # Transaction modals
│   │   ├── _layout.tsx      # Transaction modal layout
│   │   ├── add.tsx          # Add transaction modal
│   │   └── edit/[id].tsx    # Edit transaction modal
│   └── store/               # Store modals
│       ├── _layout.tsx      # Store modal layout
│       ├── add.tsx          # Add store item modal
│       └── edit/[id].tsx    # Edit store item modal
└── customer/                # Customer stack routes
    ├── _layout.tsx          # Customer navigation
    └── [id].tsx             # Customer details
```

## 🛡️ Protection Strategy

### Current: Onboarding-Based Protection

- Uses `AsyncStorage` to persist onboarding completion
- `Stack.Protected` guards main app routes
- Onboarding screen is always accessible

### Future: Authentication-Based Protection

- Replace onboarding guard with user authentication
- Add `(auth)` route group for login/register
- Implement JWT token management
- Add role-based route protection

## 🎯 Route Patterns

### Tab Routes `(tabs)/`

- Main navigation screens
- Always accessible after protection
- Use `Tabs.Screen` component

### Modal Routes `(modal)/`

- Forms and secondary actions
- Use `ModalCloseButton` for UX
- Configurable presentation styles

### Stack Routes

- Detail views and nested navigation
- Use `Stack.Screen` for configuration
- Support dynamic routes with `[param]`

## 🔧 Key Components

### ModalCloseButton

```tsx
// Basic usage
<ModalCloseButton />

// Configurable variants
<ModalCloseButton variant="text" text="Close" />
<ModalCloseButton variant="cancel" text="Cancel" textColor="#FF3B30" />

// Custom behavior
<ModalCloseButton onPress={() => customCloseLogic()} />
```

### Navigation Hooks

```tsx
const { navigateToCustomer, navigateToAddCustomer, goBack } =
  useAppNavigation();
```

## 🚀 Adding New Features

### New Tab Screen

```bash
mkdir -p src/app/\(tabs\)/new-feature
echo "export default function NewFeature() { return <View><Text>New Feature</Text></View>; }" > src/app/\(tabs\)/new-feature.tsx
```

### New Modal

```bash
mkdir -p src/app/\(modal\)/new-feature
echo "import { ModalCloseButton } from '@/components/ui/ModalCloseButton';" > src/app/\(modal\)/new-feature/_layout.tsx
```

### New Stack Route

```bash
mkdir -p src/app/new-feature
echo "import { Stack } from 'expo-router';" > src/app/new-feature/_layout.tsx
```

## 📚 Documentation

- **[Complete Guide](./ROUTING_NAVIGATION_GUIDE.md)**: Comprehensive routing documentation
- **[Auth Implementation](./AUTH_IMPLEMENTATION.md)**: Step-by-step authentication setup
- **[ModalCloseButton](./../src/components/ui/ModalCloseButton.tsx)**: Configurable modal close component

## 🎨 Design Patterns

1. **Route Groups**: Use parentheses for logical grouping
2. **Layout Files**: Every route group needs `_layout.tsx`
3. **Dynamic Routes**: Use `[param]` for variable segments
4. **Modal UX**: Always provide close/cancel options
5. **Type Safety**: Use TypeScript for navigation params
6. **Error Handling**: Implement proper 404 handling

## 🔄 Migration Path

### Phase 1: Current (Onboarding Protection)

- ✅ Onboarding-based route protection
- ✅ Modal management with close buttons
- ✅ Tab-based main navigation

### Phase 2: Authentication (Future)

- 🔄 Replace onboarding with user auth
- 🔄 Add `(auth)` route group
- 🔄 Implement JWT token management
- 🔄 Add role-based permissions

### Phase 3: Advanced Features (Future)

- 🔄 Deep linking implementation
- 🔄 Push notification handling
- 🔄 Offline navigation support
- 🔄 A/B testing for navigation flows

## 📋 Checklist for New Developers

- [ ] Read the [Complete Routing Guide](./ROUTING_NAVIGATION_GUIDE.md)
- [ ] Understand the current route structure
- [ ] Review the [ModalCloseButton component](../src/components/ui/ModalCloseButton.tsx)
- [ ] Check existing patterns before adding new routes
- [ ] Test navigation on both iOS and Android
- [ ] Ensure proper error handling for invalid routes
- [ ] Add TypeScript types for new route parameters

## 🆘 Common Issues & Solutions

### Issue: "No route named '(modal)' exists"

**Solution**: Ensure `(modal)/_layout.tsx` exists and exports a valid layout component

### Issue: Modal won't close

**Solution**: Add `ModalCloseButton` to modal layout's `headerLeft`

### Issue: Navigation params are undefined

**Solution**: Use `useLocalSearchParams<{ param: string }>()` with proper typing

### Issue: Protected routes not working

**Solution**: Check that the guard condition is properly set and the layout is correctly structured

## 📞 Support

For questions about routing architecture:

1. Check the [Complete Guide](./ROUTING_NAVIGATION_GUIDE.md)
2. Review existing patterns in the codebase
3. Test navigation flows thoroughly
4. Consider user experience implications

This architecture provides a solid, scalable foundation for the Klyntl app's navigation needs! 🚀
