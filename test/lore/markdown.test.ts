import * as E from "fp-ts/Either"
import * as O from "fp-ts/Option"
import {describe, expect, it} from "vitest"
import {MarkdownLoreParser} from "../../src"

describe("MarkdownLoreParser", () => {

    describe("parseText", () => {
        it("should trim excessive spaces and line-breaks", () => {
            const text = `

# Heading 1

 First line.
Second line.  

`

            const parser = new MarkdownLoreParser()
            const result = parser.parseText(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const entries = result.right

                expect(entries).toHaveLength(1)

                const {title, content} = entries[0]

                expect(title).toEqual(O.of("Heading 1"))
                expect(content).toBe("First line. Second line.")
            }
        })

        it("should parse a Markdown string without a title", () => {
            const text = "No title."

            const parser = new MarkdownLoreParser()
            const result = parser.parseText(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const entries = result.right

                expect(entries).toHaveLength(1)

                const {title, content} = entries[0]

                expect(title).toSatisfy(O.isNone)
                expect(content).toBe("No title.")
            }
        })

        it("should create an entry per each section, demarcated by a heading", () => {
            const text = `
# Heading 1.1
Text 1.1.

## Heading 2.1
Text 2.1.

### Heading 3.1
Text 3.1

### Heading 3.2
Text 3.2

## Heading 2.2
Text 2.2.1
Text 2.2.2
`

            const parser = new MarkdownLoreParser()
            const result = parser.parseText(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const entries = result.right

                expect(entries).toHaveLength(5)

                // First section
                expect(entries[0].title).toEqual(O.of("Heading 1.1"))
                expect(entries[0].content).toBe("Text 1.1.")

                // Second section
                expect(entries[1].title).toEqual(O.of("Heading 1.1> Heading 2.1"))
                expect(entries[1].content).toBe("Text 2.1.")

                // Third section
                expect(entries[2].title).toEqual(O.of("Heading 1.1> Heading 2.1> Heading 3.1"))
                expect(entries[2].content).toBe("Text 3.1")

                // Fourth section
                expect(entries[3].title).toEqual(O.of("Heading 1.1> Heading 2.1> Heading 3.2"))
                expect(entries[3].content).toBe("Text 3.2")

                // Fifth section
                expect(entries[4].title).toEqual(O.of("Heading 1.1> Heading 2.2"))
                expect(entries[4].content).toBe("Text 2.2.1 Text 2.2.2")
            }
        })

        it("should return `None` as `title` when given text without a heading", () => {
            const text = "Text without a heading."

            const parser = new MarkdownLoreParser()
            const result = parser.parseText(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const entries = result.right

                expect(entries).toHaveLength(1)

                const {title, content} = entries[0]

                expect(title).satisfy(O.isNone)
                expect(content).toBe("Text without a heading.")
            }
        })

        it("should parse metadata if it's present, ignoring unknown properties", () => {
            const text = `
---
author: Anna
constant: true
---
Text without a heading.`

            const parser = new MarkdownLoreParser()
            const result = parser.parseText(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const entries = result.right

                expect(entries).toHaveLength(1)

                const {metadata} = entries[0]

                expect(metadata).toMatchObject(({constant: true}))
            }
        })

        it("should return child entries with metadata if it's present", () => {
            const text = `
---
constant: true
---
Text without a heading.

## Heading 1

First section.
`

            const parser = new MarkdownLoreParser()
            const result = parser.parseText(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const entries = result.right

                expect(entries).toHaveLength(2)

                const {metadata} = entries[1]

                expect(metadata).toMatchObject(({constant: true}))
            }
        })

        it("should return default metadata when it's not present", () => {
            const text = "No metadata."

            const parser = new MarkdownLoreParser()
            const result = parser.parseText(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const entries = result.right

                expect(entries).toHaveLength(1)

                const {metadata} = entries[0]

                expect(metadata).toMatchObject(({constant: false}))
            }
        })

        it("should use the given separator to join headings", () => {
            const text = `
# Heading 1.1
Text 1.1.

## Heading 2.1
Text 2.1.
`

            const parser = new MarkdownLoreParser({headerSeparator: " // "})
            const result = parser.parseText(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const entries = result.right

                expect(entries).toHaveLength(2)

                const {title} = entries[1]

                expect(title).toMatchObject(O.of("Heading 1.1 // Heading 2.1"))
            }
        })

        it("should ignore sections without contents", () => {
            const text = `
# Heading 1.1

## Heading 2.1
Text 2.1.

## Heading 2.2
`

            const parser = new MarkdownLoreParser({headerSeparator: " // "})
            const result = parser.parseText(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const entries = result.right

                expect(entries).toHaveLength(1)

                const {title} = entries[0]

                expect(title).toMatchObject(O.of("Heading 1.1 // Heading 2.1"))
            }
        })

        it("should use compact Markdown content", () => {
            const text = `
# Heading 1.1

## Heading 2.1

This is a list:

 * item 1.
 * item 2.
 * item 3.

End of the list.

------

This is a code block:

\`\`\`json
{
    value: true
}
\`\`\`

End of the code block.

This is a blockquote:

> Dialogue example

End of the blockquote.

`

            const parser = new MarkdownLoreParser()
            const result = parser.parseText(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const entries = result.right

                expect(entries).toHaveLength(1)

                const {title, content} = entries[0]

                expect(title).toMatchObject(O.of("Heading 1.1> Heading 2.1"))
                expect(content).toBe(`This is a list:

* item 1.
* item 2.
* item 3.

End of the list.

---

This is a code block:

{
    value: true
}

End of the code block.

This is a blockquote:

> Dialogue example

End of the blockquote.`)
            }
        })
    })
})
