# theme

Design tokens — colours, spacing scale, font sizes, radii — exported as plain
objects and consumed inside `StyleSheet.create`.

**Goes here:** values used by more than one component.

**Does not go here:** styles for a single component. Those live in that
component's own `StyleSheet.create` block at the bottom of its file.

One token file beats six people each picking their own shade of blue.
