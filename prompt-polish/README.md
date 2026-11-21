# prompt-polish

A Claude Code mod that adds an **✨ Improve prompt** button above the prompt box. Type a rough question, press the button, and the draft is replaced with a structured prompt. Nothing is sent until you press Enter. **Undo** puts your original wording back.

The rewrite follows Anthropic's prompting guidance (sections in XML tags: role, task, context, constraints, output format, success criteria, unknowns) and Simplified Technical English principles from ASD-STE100 (short sentences, active voice, one word for one meaning, condition before command, SI units). It keeps your facts exactly and never adds standards, clauses or figures you did not give. Missing information is listed under `<unknowns>`.

Each press is one extra model call (Sonnet) and counts towards your usage.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install prompt-polish --marketplace shanbro/tkinter-tictactoe
```

Answer `y` to add the marketplace, then pick a scope (user scope = every session).

From a shell:

```
claude plugin install prompt-polish --marketplace shanbro/tkinter-tictactoe
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `shanbro/tkinter-tictactoe`, then Add plugin.

Sessions opened on this repository also pick it up from `.claude/settings.json` at the repo root.

## Reuse the instructions elsewhere

See `PROMPT-TEMPLATE.md` for the rewrite instructions as plain text, ready to paste into a Claude Project, a `CLAUDE.md` or any chat.

## Files

- `hooks/register.tsx` — the button and the rewrite instructions (`SYSTEM`)
- `types/index.d.ts` — the mod's state types
- `.claude-plugin/plugin.json` — manifest
