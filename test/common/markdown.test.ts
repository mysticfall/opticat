import * as O from "fp-ts/Option"
import {Tokens} from "marked";
import {describe, expect, it, test} from "vitest"
import {parseMarkdown, PlainTextRenderer} from "../../src"

describe("parseMarkdown", () => {

    it("should parse the given markdown text while preserving its hierarchical structure", () => {

        const text = ` 
# Cat

Cats are invasive alien species disguising as domestic pets.

## Appearance

### General features

 * Large eyes.
 * Furry.
 * Pointy ears.
 
### Coat patterns

 * Mackerel
 * Classic
 * Spotted

## Goals

Cats aim to dominate the world.
`

        const document = parseMarkdown(text)

        expect(document.title).satisfy(O.isNone)
        expect(document.children).length(1)
        expect(document.contents).length(1)
        expect(document.contents[0]).toHaveProperty("type", "space")

        const root = document.children[0]

        expect(root.title).toEqual(O.of("Cat"))
        expect(root.children).length(2)
        expect(root.contents).length(2)

        expect(root.contents[0]).toHaveProperty("type", "paragraph")
        expect(root.contents[0]).toHaveProperty("text", "Cats are invasive alien species disguising as domestic pets.")

        const appearance = root.children[0]

        expect(appearance.title).toEqual(O.of("Appearance"))
        expect(appearance.children).length(2)
        expect(appearance.contents).toEqual([])

        const generalFeatures = appearance.children[0]

        expect(generalFeatures.title).toEqual(O.of("General features"))
        expect(generalFeatures.children).length(0)
        expect(generalFeatures.contents).length(2)

        const generalFeaturesList = generalFeatures.contents[0] as Tokens.List

        expect(generalFeaturesList.items).length(3)
        expect(generalFeaturesList.items[0].text).toBe("Large eyes.")
        expect(generalFeaturesList.items[1].text).toBe("Furry.")
        expect(generalFeaturesList.items[2].text).toBe("Pointy ears.")

        expect(generalFeatures.contents[1]).toHaveProperty("type", "space")

        const coatPatterns = appearance.children[1]

        expect(coatPatterns.title).toEqual(O.of("Coat patterns"))
        expect(coatPatterns.children).length(0)
        expect(coatPatterns.contents).length(2)

        const coatPatternsList = coatPatterns.contents[0] as Tokens.List

        expect(coatPatternsList.items).length(3)
        expect(coatPatternsList.items[0].text).toBe("Mackerel")
        expect(coatPatternsList.items[1].text).toBe("Classic")
        expect(coatPatternsList.items[2].text).toBe("Spotted")

        expect(coatPatterns.contents[1]).toHaveProperty("type", "space")

        const goals = root.children[1]

        expect(goals.title).toEqual(O.of("Goals"))
        expect(goals.children).length(0)
        expect(goals.contents).length(1)
        expect(goals.contents[0]).toHaveProperty("type", "paragraph")
        expect(goals.contents[0]).toHaveProperty("text", "Cats aim to dominate the world.")
    })
})

describe("PlainTextRenderer", () => {
    const renderer = new PlainTextRenderer()

    test("code", () => {
        const code = "console.log('hello world')"
        const result = renderer.code(code, undefined, false)
        expect(result).toBe(code + "\n\n")
    })

    test("blockquote", () => {
        const quote = "This is a quote"
        const result = renderer.blockquote(quote)
        expect(result).toBe(`> ${quote}`)
    })

    test("html", () => {
        const html = "<h1>Hello World</h1>"
        const result = renderer.html(html)
        expect(result).toBe(html)
    })

    test("heading", () => {
        const text = "Heading"
        const level = 2
        const result = renderer.heading(text, level, "## Heading")
        expect(result).toBe(`## ${text}\n\n`)
    })

    test("hr", () => {
        const result = renderer.hr()
        expect(result).toBe("---\n\n")
    })

    test("list(concatenateList = true)", () => {
        const renderer = new PlainTextRenderer({concatenateList: true})

        const list = "* item1.\n* item2\n* item3."
        const result = renderer.list(list, false, "")
        expect(result).toBe("item1; item2; item3.\n\n")
    })

    test("list", () => {
        const list = "* item1.\n* item2\n* item3."
        const result = renderer.list(list, false, "")
        expect(result).toBe("* item1.\n* item2\n* item3.\n\n")
    })

    test("listitem", () => {
        const text = "Item"
        const result = renderer.listitem(text, false, false)
        expect(result).toBe(`* ${text}`)
    })

    test("checkbox", () => {
        const checked = true
        const result = renderer.checkbox(checked)
        expect(result).toBe("[x]")
    })

    test("paragraph", () => {
        const text = "Hello\nWorld"
        const result = renderer.paragraph(text)
        expect(result).toBe("Hello World\n\n")
    })

    test("strong", () => {
        const text = "Bold"
        const result = renderer.strong(text)
        expect(result).toBe(text)
    })

    test("em", () => {
        const text = "Italic"
        const result = renderer.em(text)
        expect(result).toBe(text)
    })

    test("codespan", () => {
        const text = "console.log('hello world')"
        const result = renderer.codespan(text)
        expect(result).toBe(text)
    })

    test("br", () => {
        const result = renderer.br()
        expect(result).toBe("\n")
    })

    test("del", () => {
        const text = "Deleted text"
        const result = renderer.del(text)
        expect(result).toBe("")
    })

    test("link", () => {
        const text = "Link Text"
        const result = renderer.link("", null, text)
        expect(result).toBe(text)
    })

    test("image", () => {
        const text = "Image Text"
        const result = renderer.image("", null, text)
        expect(result).toBe(text)
    })

    test("text", () => {
        const text = "Plain Text"
        const result = renderer.text(text)
        expect(result).toBe(text)
    })
})
