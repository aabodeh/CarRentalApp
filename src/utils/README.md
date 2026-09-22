# utils

Small, pure, framework-free helpers: date formatting, price formatting,
`sleep`, backoff interval calculation.

**Goes here:** a function with no React and no I/O, that is trivial to unit
test.

**Does not go here:** anything that needs state, navigation or the network. If
a helper is only used by one module, leave it in that module until a second
caller appears.
