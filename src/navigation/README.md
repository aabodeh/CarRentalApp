# navigation

The native-stack navigator and the route parameter types.

`RootStackParamList` in `types.ts` is the single source of truth for route
names and their params — keep it in sync with `RootNavigator.tsx` so that
`navigation.navigate(...)` stays type-checked.
