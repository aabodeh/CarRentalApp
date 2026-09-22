# context

React Context providers for state that genuinely spans screens — the current
booking draft, and later the app-wide sync status (K3).

**Goes here:** provider + a `useX` consumer hook that throws a clear error when
used outside its provider.

**Does not go here:** data fetching. A provider calls a hook, which calls a
repository. Context is for sharing state, not for getting it.

Prefer local `useState` first. Only promote state to context when a second
screen actually needs it.
