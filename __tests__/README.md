# **tests**

All tests live here, in a tree mirroring the source:

```
__tests__/App.test.tsx              -> App.tsx
__tests__/repositories/carRepository.test.ts -> src/repositories/carRepository.ts
__tests__/screens/CarListScreen.test.tsx     -> src/screens/CarListScreen.tsx
```

Conventions:

- File name is `<subject>.test.ts` or `.test.tsx`.
- Test names restate the acceptance criteria from the design document. A
  Gherkin scenario `Given a car list, When the user taps a car, Then the
details screen opens` becomes
  `it('opens the details screen when the user taps a car')`.
- Repositories and utils get plain unit tests — no rendering needed, which is
  the payoff for keeping them free of React.
- Screens get rendering tests via `@testing-library/react-native`: query the
  way a user would (`getByText`, `getByRole`), not by test IDs where a visible
  label exists.

Every feature or fix ships with a test. See AGENTS.md > Definition of Done.
