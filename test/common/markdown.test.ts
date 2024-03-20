import * as O from "fp-ts/Option"
import {marked, Tokens} from "marked"
import {describe, expect, it, test, vi} from "vitest"
import {parseMarkdown, PlainTextRenderer} from "../../src"

describe("parseMarkdown", () => {

    it("should parse the given markdown text while preserving its hierarchical structure", () => {

        const text = ` 
# Cat

Cats are invasive alien species\n disguising as domestic pets.
Cats often use their meows as a primary method to communicate \nand manipulate humans.

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
        expect(root.contents[0]).toHaveProperty(
            "text",
            "Cats are invasive alien species\n" +
            " disguising as domestic pets.\n" +
            "Cats often use their meows as a primary method to communicate \n" +
            "and manipulate humans."
        )

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

    describe("code", () => {
        test("without a language tag", () => {
            const renderer = new PlainTextRenderer()
            const spy = vi.spyOn(renderer, "code")

            const text = `\`\`\`
const text = "Hello world!"
console.log(text)
\`\`\``

            const result = marked(text, {renderer})

            expect(spy).toHaveBeenCalled()
            expect(spy).toHaveReturnedWith(result)
        })

        test("with a language tag", () => {
            const renderer = new PlainTextRenderer()
            const spy = vi.spyOn(renderer, "code")

            const text = `\`\`\`javascript
const text = "Hello world!"
console.log(text)
\`\`\``

            const result = marked(text, {renderer})

            expect(spy).toHaveBeenCalled()
            expect(spy).toHaveReturnedWith(result)
        })
    })

    test("blockquote", () => {
        const renderer = new PlainTextRenderer()
        const spy = vi.spyOn(renderer, "blockquote")

        const text = `> First line
> Second line`

        const result = marked(text, {renderer})

        expect(spy).toHaveBeenCalled()
        expect(spy).toHaveReturnedWith(result)
    })

    test("html", () => {
        const renderer = new PlainTextRenderer()
        const spy = vi.spyOn(renderer, "html")

        const text = "<p>test</p>"

        marked(text, {renderer})

        expect(spy).toHaveBeenCalled()
        expect(spy).toHaveReturnedWith(text)
    })

    describe("heading", () => {
        test("with the default header symbol", () => {
            const renderer = new PlainTextRenderer()
            const spy = vi.spyOn(renderer, "heading")

            const result = marked("##  Heading\n\n###   Subheading ", {renderer})

            expect(spy).toHaveBeenCalled()

            expect(result).toBe("== Heading\n=== Subheading\n")
        })

        test("with a custom header symbol", () => {
            const renderer = new PlainTextRenderer({headerChar: "*"})
            const spy = vi.spyOn(renderer, "heading")

            const result = marked("##  Heading\n\n###   Subheading ", {renderer})

            expect(spy).toHaveBeenCalled()

            expect(result).toBe("** Heading\n*** Subheading\n")
        })
    })

    test("hr", () => {
        const renderer = new PlainTextRenderer()
        const spy = vi.spyOn(renderer, "hr")

        marked("------", {renderer})

        expect(spy).toHaveBeenCalled()
        expect(spy).toHaveReturnedWith("---\n")
    })

    describe("list", () => {
        test("with concatenateList = true", () => {
            const renderer = new PlainTextRenderer({concatenateList: true})
            const spy = vi.spyOn(renderer, "list")

            marked("* item1.\n* item2\n* item3.", {renderer})

            expect(spy).toHaveBeenCalled()
            expect(spy).toHaveReturnedWith("item1; item2; item3.\n")
        })

        test("with concatenateList = false", () => {
            const renderer = new PlainTextRenderer()
            const spy = vi.spyOn(renderer, "list")

            marked("* item1.\n* item2.\n* item3.", {renderer})

            expect(spy).toHaveBeenCalled()
            expect(spy).toHaveReturnedWith("* item1.\n* item2.\n* item3.\n")
        })
    })

    describe("listitem", () => {
        test("bullet item", () => {
            const renderer = new PlainTextRenderer()
            const spy = vi.spyOn(renderer, "listitem")

            marked("* Item", {renderer})

            expect(spy).toHaveBeenCalled()
            expect(spy).toHaveReturnedWith("Item")
        })

        test("checked task item", () => {
            const renderer = new PlainTextRenderer()
            const spy = vi.spyOn(renderer, "listitem")

            marked("- [x] Task ", {renderer})

            expect(spy).toHaveBeenCalled()
            expect(spy).toHaveReturnedWith("[x] Task")
        })

        test("unchecked task item", () => {
            const renderer = new PlainTextRenderer()
            const spy = vi.spyOn(renderer, "listitem")

            marked("- [ ] Task  ", {renderer})

            expect(spy).toHaveBeenCalled()
            expect(spy).toHaveReturnedWith("[ ] Task")
        })
    })

    test("paragraph", () => {
        const renderer = new PlainTextRenderer()
        const spy = vi.spyOn(renderer, "paragraph")

        const text = marked(
            `Cats are invasive alien species\n disguising as domestic pets.
Cats often use their meows as a primary method to communicate \nand manipulate humans.

Cats are smarter than their hooman slaves.`,
            {renderer}
        )

        expect(spy).toHaveBeenCalledTimes(2)
        expect(text).toBe("Cats are invasive alien species disguising as domestic pets. " +
            "Cats often use their meows as a primary method to communicate and manipulate humans.\n\n" +
            "Cats are smarter than their hooman slaves.\n")
    })

    test("strong", () => {
        const renderer = new PlainTextRenderer()
        const spy = vi.spyOn(renderer, "strong")

        const text = marked.parseInline("**strong** __strong__ __not strong __", {renderer})

        expect(spy).toHaveBeenCalled()
        expect(text).toBe("**strong** **strong** __not strong __")
    })

    test("em", () => {
        const renderer = new PlainTextRenderer()
        const spy = vi.spyOn(renderer, "em")

        const text = marked.parseInline("*emphasis* _emphasis_ **not an emphasis **", {renderer})

        expect(spy).toHaveBeenCalled()
        expect(text).toBe("*emphasis* *emphasis* **not an emphasis **")
    })

    test("codespan", () => {
        const renderer = new PlainTextRenderer()
        const spy = vi.spyOn(renderer, "codespan")

        const text = `\`\`\`console.log(text)\`\`\``

        marked.parseInline(text, {renderer})

        expect(spy).toHaveBeenCalled()
        expect(spy).toHaveReturnedWith(text)
    })

    test("br", () => {
        const renderer = new PlainTextRenderer()
        const spy = vi.spyOn(renderer, "br")

        const text = marked.parseInline("First line.\nSecond line.", {renderer, breaks: true})

        expect(spy).toHaveBeenCalled()
        expect(text).toBe("First line.\nSecond line.")
    })

    test("del", () => {
        const renderer = new PlainTextRenderer()
        const spy = vi.spyOn(renderer, "del")

        const text = marked.parseInline("A cat meowing at his ~~owner~~human servant.", {renderer})

        expect(spy).toHaveBeenCalled()
        expect(text).toBe("A cat meowing at his human servant.")
    })

    test("link", () => {
        const renderer = new PlainTextRenderer()
        const spy = vi.spyOn(renderer, "link")

        const text = marked.parseInline("[Cat](https://en.wikipedia.org/wiki/Cat)", {renderer})

        expect(spy).toHaveBeenCalled()
        expect(text).toBe("Cat")
    })

    test("image", () => {
        const renderer = new PlainTextRenderer()
        const spy = vi.spyOn(renderer, "image")

        const text = marked.parseInline("![A cat](cat.jpg)", {renderer})

        expect(spy).toHaveBeenCalled()
        expect(text).toBe("A cat")
    })

    test("text", () => {
        const renderer = new PlainTextRenderer()
        const spy = vi.spyOn(renderer, "text")

        const text = marked.parseInline("text", {renderer})

        expect(spy).toHaveBeenCalled()
        expect(text).toBe("text")
    })
})
