import * as E from "fp-ts/Either";
import {AIMessage, HumanMessage, SystemMessage} from "langchain/schema"
import {describe, expect, it} from "vitest"
import {MarkdownMessageParser} from "../../src"

describe("MarkdownMessageParser", () => {

    const parser = new MarkdownMessageParser()

    describe("parse", () => {
        it("should convert each section into a BaseMessage, divided by headings", () => {
            const text = `
# Human

Who is Max Caulfield's best friend?

# AI

It's Chloe Price.
`

            const result = parser.parse(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const messages = result.right

                expect(messages).toHaveLength(2)

                expect(messages[0]).toBeInstanceOf(HumanMessage)
                expect(messages[0].content).toBe("Who is Max Caulfield's best friend?")

                expect(messages[1]).toBeInstanceOf(AIMessage)
                expect(messages[1].content).toBe("It's Chloe Price.")
            }
        })

        it("should convert sections with an unrecognised heading into a SystemMessage", () => {
            const text = `
# Human

What is the Chloe's hair colour'?

# Answer

It's blue.
`

            const result = parser.parse(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const messages = result.right

                expect(messages).toHaveLength(2)

                expect(messages[1]).toBeInstanceOf(SystemMessage)
                expect(messages[1].content).toBe("It's blue.")
            }
        })

        it("should treat the top-level content as a SystemMessage, if it lacks a heading", () => {
            const text = `
You play a role of Kate Marsh in a never-ending role play with the user.

# Human

Max: Hi, Kate!
`

            const result = parser.parse(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const messages = result.right

                expect(messages).toHaveLength(2)

                expect(messages[0]).toBeInstanceOf(SystemMessage)
                expect(messages[0].content).toBe(
                    "You play a role of Kate Marsh in a never-ending role play with the user.")
            }
        })

        it("should read optional postfix from headings and set its value as the message's name property", () => {
            const text = `
# Human:Max

Ready for the mosh pit, shaka brah!

# AI:Chloe

...Maybe not.
`

            const result = parser.parse(text)

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const messages = result.right

                expect(messages).toHaveLength(2)

                expect(messages[0].name).toBe("Max")
                expect(messages[1].name).toBe("Chloe")
            }
        })
    })
})
