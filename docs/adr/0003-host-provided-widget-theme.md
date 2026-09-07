# Host-provided Ask AI theme

Ask AI appearance is a Host `explainit()` option: `light`, `dark`, or `system`. The widget lives in a ShadowRoot, so it cannot read Host CSS. `system` follows `prefers-color-scheme`. The Host passes the value that matches its page (or `system` when the page tracks the OS).

## Considered options

- **Infer from Host computed styles / `color-scheme`**: brittle across docs tools and theme toggles; Shadow DOM still would not inherit Tailwind `dark:` classes.
- **Owner dashboard setting**: a Host site's own theme toggle would drift from a static Owner preference.
