# Design — Intelia Client Project Portal

A locked design system for this app. Every project page and utility page should read as one product family. The system is based on Tally's public design DNA: crisp white paper, black editorial sans type, thin-grey framed work surfaces, small blue primary actions, magenta hand-drawn emphasis marks, and generous quiet spacing.

## Genre
playful-modern-minimal

## Macrostructure family
- App pages: Workbench — the portal is a status workbench, not a marketing page. Project data lives in framed content modules with clear captions.
- Landing/utility pages: Marquee card — one centered card, direct copy, one action.
- Content pages: Long document within the same paper/card system.

## Theme
- `--color-paper`   oklch(99% 0 0)
- `--color-paper-2` oklch(97.5% 0.002 250)
- `--color-paper-3` oklch(95.5% 0.004 250)
- `--color-ink`     oklch(18% 0.006 250)
- `--color-ink-2`   oklch(42% 0.012 250)
- `--color-rule`    oklch(88% 0.006 250)
- `--color-accent`  oklch(55% 0.22 255)
- `--color-accent-ink` oklch(100% 0 0)
- `--color-doodle`  oklch(70% 0.31 330)
- `--color-risk`    oklch(62% 0.16 75)
- `--color-success` oklch(58% 0.16 150)
- `--color-focus`   oklch(62% 0.22 255)

## Typography
- Display: Plus Jakarta Sans, weight 700, style normal
- Body: Plus Jakarta Sans, weights 400/500/600
- Mono: JetBrains Mono, weight 500
- Display tracking: -0.045em for large headings, -0.02em for section headings
- Headlines are black, short, and left-biased; no italic display type.

## Spacing
4-point named scale. Pages use named tokens from `tokens.css`, not raw ad-hoc values.

## Motion
- Card hover: transform translateY(-2px) + slightly stronger shadow.
- Buttons: small physical press — lift on hover, depress on active.
- Reduced motion: remove transforms and keep color/opacity transitions ≤ 150ms.

## Microinteractions stance
- Quiet, functional, no celebratory toasts.
- Focus rings are immediate and high contrast.
- Forms use clear button states; no hidden affordances.

## Component voice
- Cards: white paper, 1px grey border, 8–14px radius, subtle shadow; closer to a framed form surface than a glossy dashboard tile.
- Buttons: Tally-like blue primary pill/rounded rectangle, compact height, white label, physical press.
- Section labels: tiny uppercase blue/mono labels, used sparingly.
- Doodles: magenta underline/stroke accents as tiny annotations, never full illustrations.
- Kanban: simple framed columns with thin borders, compact task cards, clear status counts.

## Per-page allowances
- App/project pages may include small decorative doodle strokes via CSS pseudo-elements.
- App/project pages must keep client content readable; decoration must not compete with status text.
- Public project pages may show question form, but no edit/move/delete controls.

## What pages MUST share
- White paper background.
- Plus Jakarta Sans and JetBrains Mono.
- Blue primary action and magenta annotation accent.
- Thin grey framed cards and compact rounded controls.
- Same status badges and kanban language.

## What pages MAY differ on
- Client brand color may tint the logo mark and a few project-specific accents.
- Section order may differ by project section toggles.
- Some projects may hide metrics/files/questions by configuration.

## Exports
See `tokens.css` for the active CSS custom-property export.
