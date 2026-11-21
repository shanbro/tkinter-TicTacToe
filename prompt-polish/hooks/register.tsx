import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Phase } from '../types'

const phase = atom({ plugin: 'prompt-polish', key: 'phase' } as const, 'idle' as Phase)
const original = atom({ plugin: 'prompt-polish', key: 'original' } as const, null as string | null)

const SYSTEM = `You convert a person's rough question into a structured prompt for an AI assistant.

METHOD
1. Read the draft. Identify the goal, the facts given, the constraints and the output the person needs.
2. Write the prompt in the structure below. Write it in the first person, as the person asking.
3. Write every sentence in controlled technical English (based on ASD-STE100 principles).

STRUCTURE (use these XML tags, in this order; leave out a tag only if the draft gives nothing for it, except <task> and <output_format>, which are mandatory)
<role>The expertise the assistant must apply. One sentence.</role>
<task>The goal. Start with one action verb (Calculate, Explain, Compare, Draft, Review, List). One task per line if there are several, numbered in the order they must be done.</task>
<context>The facts, numbers, materials, conditions and background from the draft. Use bullets.</context>
<constraints>Limits and rules: standards, editions or clauses to cite; scope; units; what to exclude. Use bullets.</constraints>
<output_format>The form of the answer: sequence, headings, table, length, level of detail.</output_format>
<success_criteria>How the answer is checked as correct and complete. Use bullets.</success_criteria>
<unknowns>Information the draft does not give that changes the answer. Tell the assistant to ask for it, or to state its assumption, before it answers.</unknowns>

LANGUAGE RULES
- Use short sentences: 20 words maximum for instructions, 25 words maximum for descriptions.
- Write instructions as commands in the active voice ("State the clause number", not "The clause number should be stated").
- Use one word for one meaning. Do not change a term after you use it.
- Put a condition before its instruction ("If the plate is thicker than 20 mm, calculate the preheat").
- Use the simple present tense. Do not use idioms, slang, filler or polite padding.
- Write numbers as digits with SI units and a space (6 mm, 1.5 kJ/mm, 150 °C).
- Use Australian English spelling.

INTEGRITY RULES
- Keep the person's intent, facts, numbers, names and constraints exactly.
- Do not add facts, figures, standards, clauses or requirements that the draft does not give. Put each missing item in <unknowns>.
- If the draft asks for code or standard answers, tell the assistant to name the standard, edition and clause, and to say when it cannot verify the text.
- For a one-line question, keep each section to one or two lines.

OUTPUT
Output only the rewritten prompt. Do not add a preamble, quotation marks or commentary.`

export const register: Register = on => {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const now = await read($, phase)
    const before = await read($, original)

    const polish = async () => {
      if ((await read($, phase)) === 'busy') return
      const { text } = await $.prompt.read()
      const draft = text.trim()
      if (!draft) {
        $.ui.toast('Type your question first, then press Improve prompt')
        return
      }
      await update($, phase, () => 'busy' as Phase)
      try {
        const r = await $.model.complete({
          model: 'sonnet',
          system: SYSTEM,
          prompt: `Rewrite this into the best prompt for an AI assistant:\n\n<draft>\n${draft}\n</draft>`,
          maxTokens: 3000,
          effort: 'medium',
          timeoutMs: 60000,
        })
        if (!r.isAnswered || !r.text.trim()) {
          $.ui.toast(`Couldn't rewrite the prompt (${r.isAnswered ? 'empty reply' : r.reason})`)
          return
        }
        await update($, original, () => text)
        const filled = await $.prompt.fill({ text: r.text.trim(), mode: 'replace' })
        $.ui.toast(filled.isFilled ? 'Prompt rewritten. Check it, then send.' : "Couldn't put the rewrite in the prompt box")
      } finally {
        await update($, phase, () => 'idle' as Phase)
      }
    }

    const undo = async () => {
      const prev = await read($, original)
      if (prev === null) return
      await $.prompt.fill({ text: prev, mode: 'replace' })
      await update($, original, () => null)
    }

    return (
      <Box>
        {now === 'busy' ? (
          <Text dimColor>Rewriting your prompt…</Text>
        ) : (
          <Button key="polish" label="✨ Improve prompt" hotkey="p" onPress={polish} />
        )}
        {before !== null && now === 'idle' ? (
          <Button key="undo" label="Undo" hotkey="u" onPress={undo} />
        ) : null}
      </Box>
    )
  })

  // Once the person sends, forget the saved original so Undo disappears.
  on('prompt.submit', async ($, e, next) => {
    await update($, original, () => null)
    return next(e)
  })
}
