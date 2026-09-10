# Kovo interface remodel

The founder explicitly authorized a complete visual redesign while retaining all features. The name and Kovo wordmark remain. No database schema or synchronization protocol changes are part of this release.

## Direction and critique

Kovo is a working financial notebook for people with changing income. Prioritize what to do next, then a readable record of what happened. Avoid a dashboard full of equal-weight statistic cards. The initial concept used a larger greeting; the review removed its generic slogan and kept the direct page title, Today. Recent activity is an unboxed list, and the existing balance/monthly detail remains expandable.

Desktop concept:

```text
Navigation | Workspace date                 Account
           | Today
           | One prioritized insight        Action
           | Recent activity / aligned amounts
           | Expand balances and monthly overview
```

Phone concept:

```text
Workspace                               Account
Page title                              Page action
Single-column content / clearly labeled fields
                                    Log tips
Today | Transactions | Budget | Goals | More
```

All text is left-aligned except amounts, which align to the right. The mobile More dialog contains Accounts, Bills, Investments and Settings, with native modal focus containment and Escape dismissal. The tip shortcut is hidden on Settings to avoid covering appearance controls.

## Tokens

- Canvas: #F3F5F7; paper: #FFFFFF; ink: #202D36; secondary: #536572; rule: #D8E0E6; harbor accent: #315D99.
- Dark canvas: #172129; raised surface: #202D36; text: #EEF3F6. Dark accents are independently lightened for contrast.
- Alternate accents: Forest, Ochre, Berry. Financial positive/negative/warning colors remain semantic and independent of accent.
- Typography: Aptos, Segoe UI Variable, Segoe UI, system sans-serif. These readable installed families eliminate external font requests. Headings use deliberate tight spacing; numbers use tabular figures. Normal text scales from a 16px root, or 18px in Larger mode.
- Layout: 228px desktop navigation, 1160px maximum content width, 24px content rhythm. Cards group editable or related information; simple records use rows and separators. Corners distinguish controls, content and dialogs.

## Implementation

`src/index.css` is the single stylesheet. Root tokens apply to the app, authentication, tips and account dialogs. `useAppearance` follows the device setting when selected and responds to preference changes. Appearance fields are stored alongside existing account settings through the unchanged durable save pipeline; old accounts receive safe display defaults without rewriting financial records.

`AppearanceSettings` provides native radio controls for mode, accent, density and text size. `Navigation` keeps desktop and mobile navigation consistent. Financial forms retain their existing handlers and now have visible labels. Reduced motion, visible focus, color-scheme-aware native inputs and a skip link are included.

## Release checks

Verify all existing tests, production build, theme and accent changes, settings persistence, mobile More navigation, dialogs, and all eight pages at phone/tablet/desktop widths. Use only local synthetic data for visual entry tests. Verify the published `version.json` against the source commit after deployment.
