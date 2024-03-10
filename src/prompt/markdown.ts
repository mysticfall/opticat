/**
 * Definitions of common types used to parse Markdown text into prompts.
 * @module
 */
import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import {Option} from "fp-ts/Option"
import {not} from "fp-ts/Predicate"
import * as A from "fp-ts/ReadonlyArray"
import * as ST from "fp-ts/string"
import {AIMessage, BaseMessage, HumanMessage, SystemMessage} from "langchain/schema"
import {marked, Renderer} from "marked"
import {MarkdownText, parseMarkdown, PlainTextRenderer} from "../common"
import {PromptParseError} from "./errors"
import {ChatMessageParser} from "./parser"

/**
 * Represents options for the {@link MarkdownMessageParser} class.
 *
 * @property {Renderer} [renderer] The renderer used to handle rendering of parsed Markdown elements.
 */
export type MarkdownMessageParserOptions = {

    readonly renderer?: Renderer
}

/**
 * Represents a Markdown message parser for parsing chat messages.
 * @implements {ChatMessageParser}
 */
export class MarkdownMessageParser implements ChatMessageParser {

    readonly renderer: Renderer

    /**
     * @param {MarkdownMessageParserOptions} [options={}] Options for the MarkdownMessageParser.
     */
    constructor(options: MarkdownMessageParserOptions = {}) {
        this.renderer = options?.renderer ?? new PlainTextRenderer()

        this.parse = this.parse.bind(this)
    }

    parse(text: string): Either<PromptParseError, ReadonlyArray<BaseMessage>> {
        const root = parseMarkdown(text)

        const createMessage = ({title, contents}: MarkdownText): Option<BaseMessage> => {
            const tokens = A.toArray(contents)
            const body = marked.parser(tokens, {renderer: this.renderer})

            return pipe(
                O.of(body),
                O.map(ST.trim),
                O.filter(not(ST.isEmpty)),
                O.map(t => {
                    const isAI = pipe(title, O.exists(ST.startsWith("AI")))
                    const isHuman = pipe(title, O.exists(ST.startsWith("Human")))

                    const name = pipe(
                        title,
                        O.map(ST.split(":")),
                        O.filter(a => a.length == 2),
                        A.fromOption,
                        A.flatten,
                        A.last,
                        O.toUndefined
                    )

                    const role = isAI ? "AI" : isHuman ? "Human" : "System"

                    switch (role) {
                        case "AI":
                            return new AIMessage({name: name, content: t})
                        case "Human":
                            return new HumanMessage({name: name, content: t})
                        case "System":
                            return new SystemMessage({name: name, content: t})
                    }
                })
            )
        }

        return pipe(
            root.children,
            A.prepend(root),
            A.filterMap(createMessage),
            E.of
        )
    }
}
