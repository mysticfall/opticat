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
import {AIMessage, BaseMessage, HumanMessage, SystemMessage} from "@langchain/core/messages"
import {marked, Renderer, Token} from "marked"
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

        const renderChildren = (texts: ReadonlyArray<MarkdownText>, level = 2): string => {
            return pipe(
                texts,
                A.flatMap(({title, contents, children}) => {
                    const options = {renderer: this.renderer}

                    const tokens = A.toArray(contents)
                    const body = marked.parser(tokens, options).trim()

                    return pipe(
                        title,
                        O.map(t => {
                            const heading: Token = {
                                type: "heading",
                                raw: "",
                                depth: level - 1,
                                text: "",
                                tokens: [{
                                    type: "text",
                                    raw: t,
                                    text: t,
                                }]
                            }

                            return "\n\n" + marked.parser([heading], options)
                        }),
                        A.fromOption,
                        A.append(body),
                        A.concat(A.isEmpty(children) ? A.empty : A.of(renderChildren(children, level + 1)))
                    )
                })
            ).join("").trim()
        }

        const createMessage = ({title, contents, children}: MarkdownText): Option<BaseMessage> => {
            const tokens = A.toArray(contents)
            const body = marked.parser(tokens, {renderer: this.renderer})

            return pipe(
                O.of(body),
                O.map(t => O.isSome(title) && A.isNonEmpty(children) ? [t, renderChildren(children)].join("\n") : t),
                O.map(ST.trim),
                O.filter(not(ST.isEmpty)),
                O.map(t => {
                    const isAI = pipe(title, O.exists(ST.startsWith("AI")))
                    const isHuman = pipe(title, O.exists(ST.startsWith("Human")))
                    const isPlaceholder = pipe(title, O.exists(ST.startsWith("Placeholder")))

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
                            return new SystemMessage({
                                name: isPlaceholder ? "placeholder" : name,
                                content: isPlaceholder ? name ?? "placeholder" : t
                            })
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
