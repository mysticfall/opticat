import {Document} from "@langchain/core/documents"
import * as E from "fp-ts/Either"
import {BaseDocumentLoader} from "langchain/document_loaders/base"
import {describe, expect, it} from "vitest"
import {LoreDocument, LoreDocumentLoader, LoreParseError, LoreParseErrorT} from "../../src"

class MockDocumentLoader extends BaseDocumentLoader {

    constructor(readonly documents: Document[]) {
        super()
    }

    async load(): Promise<Document[]> {
        if (this.documents.length == 0) {
            throw new Error("No documents found.")
        }

        return this.documents
    }
}

describe("LoreDocumentLoader", () => {

    describe("createTask", () => {
        it("should create a task that returns the converted lore documents", async () => {

            const source = new MockDocumentLoader([{
                pageContent: `
---
constant: true
---
Text without a heading.

## Page 1

First section.`,
                metadata: {
                    id: 1
                }
            },
                {
                    pageContent: `
# Page 2

Text with a heading.
`,
                    metadata: {
                        id: 2
                    }
                }])

            const loader = new LoreDocumentLoader(source)

            const result = await loader.createTask()()

            expect(result).toSatisfy(E.isRight<ReadonlyArray<LoreDocument>>)

            if (E.isRight(result)) {
                const docs = result.right

                const expectedOutput = [
                    {"pageContent": "Text without a heading.", "metadata": {"id": 1, "constant": true}},
                    {"pageContent": "Page 1: First section.", "metadata": {"id": 1, "constant": true}},
                    {"pageContent": "Page 2: Text with a heading.", "metadata": {"id": 2, "constant": false}}
                ]

                expect(docs).toMatchObject(expectedOutput)
            }
        })

        it("should return an IOError when the source loader fails to load the documents", async () => {
            const source = new MockDocumentLoader([])
            const loader = new LoreDocumentLoader(source)

            const result = await loader.createTask()()

            expect(result).toSatisfy(E.isLeft<ReadonlyArray<LoreDocument>>)

            if (E.isLeft(result)) {
                const {type, message, details} = result.left

                expect(type).toBe("IO")
                expect(message).toBe("Failed to load source documents.")
                expect(details).toBeInstanceOf(Error)
                expect((details as Error).message).toBe("No documents found.")
            }
        })

        it("should return a LoreParseError when the parser fails to convert the source documents", async () => {
            const source = new MockDocumentLoader([{
                pageContent: `# ${"A".repeat(210)}

Title is too long!
`,
                metadata: {}
            }])

            const loader = new LoreDocumentLoader(source)

            const result = await loader.createTask()()

            expect(result).toSatisfy(E.isLeft<ReadonlyArray<LoreDocument>>)

            if (E.isLeft(result)) {
                const {type, message, details} = result.left

                expect(type).toBe("LoreParse")
                expect(message).toSatisfy<string>(v => v.startsWith("Failed to parse the lore title: AAA"))
                expect(details).toHaveLength(1)
                expect(details).contain("Must be equal to or shorter than 200 characters.")
            }
        })
    })

    describe("load", () => {
        it("should return the converted lore documents", async () => {

            const source = new MockDocumentLoader([{
                pageContent: `
---
constant: true
---
Text without a heading.

## Page 1

First section.`,
                metadata: {
                    id: 1
                }
            },
                {
                    pageContent: `
# Page 2

Text with a heading.
`,
                    metadata: {
                        id: 2
                    }
                }])

            const loader = new LoreDocumentLoader(source)

            const result = await loader.load()

            const expectedOutput = [
                {"pageContent": "Text without a heading.", "metadata": {"id": 1, "constant": true}},
                {"pageContent": "Page 1: First section.", "metadata": {"id": 1, "constant": true}},
                {"pageContent": "Page 2: Text with a heading.", "metadata": {"id": 2, "constant": false}}
            ]

            expect(result).toMatchObject(expectedOutput)
        })

        it("should throw an IOError when the source loader fails to load the documents", async () => {
            const source = new MockDocumentLoader([])
            const loader = new LoreDocumentLoader(source)

            await expect(loader.load()).rejects.toThrowError("Failed to load source documents.")
        })

        it("should return a LoreParseError when the parser fails to convert the source documents", async () => {
            const source = new MockDocumentLoader([{
                pageContent: `# ${"A".repeat(210)}

Title is too long!
`,
                metadata: {}
            }])

            const loader = new LoreDocumentLoader(source)

            await expect(loader.load()).rejects.toThrowError()

            const error = await loader.load().catch(e => Promise.resolve(e))

            expect(error).toSatisfy(LoreParseErrorT.is)

            const {type, message, details} = error as LoreParseError

            expect(type).toBe("LoreParse")
            expect(message).toSatisfy<string>(v => v.startsWith("Failed to parse the lore title: AAA"))
            expect(details).toHaveLength(1)
            expect(details).contain("Must be equal to or shorter than 200 characters.")
        })
    })
})
