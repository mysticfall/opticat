/**
 * Definitions of common types related to Markdown text processing.
 * @module
 */
import {pipe} from "fp-ts/lib/function.js"
import * as O from "fp-ts/lib/Option.js"
import {none, Option} from "fp-ts/lib/Option.js"
import * as A from "fp-ts/lib/ReadonlyArray.js"
import * as RNEA from "fp-ts/lib/ReadonlyNonEmptyArray.js"
import * as ST from "fp-ts/lib/string.js"
import {decode} from "html-entities"
import {marked, MarkedOptions, Renderer, Token} from "marked"

/**
 * Represents a Markdown text with a title, contents, and children.
 *
 * @property {Option<string>} title The title of the Markdown text. It can be an empty string or null if not specified.
 * @property {ReadonlyArray<Token>} contents The array of tokens representing the contents of the Markdown text.
 * @property {ReadonlyArray<MarkdownText>} children The array of child {@link MarkdownText} elements.
 */
export type MarkdownText = {
    readonly title: Option<string>
    readonly contents: ReadonlyArray<Token>
    readonly children: ReadonlyArray<MarkdownText>
}

/**
 * Parses Markdown text and returns the structured content.
 *
 * @param {string} text The Markdown text to parse.
 * @return {MarkdownText} The structured Markdown content.
 */
export function parseMarkdown(text: string): MarkdownText {

    const tokens = marked.lexer(text)

    type ParseData = {
        readonly children: ReadonlyArray<MarkdownText>,
        readonly contents: ReadonlyArray<Token>,
        readonly remaining: ReadonlyArray<Token>
    }

    const collect = (
        remaining: ReadonlyArray<Token> = tokens,
        children: ReadonlyArray<MarkdownText> = A.empty,
        contents: ReadonlyArray<Token> = A.empty,
        depth: number = 0
    ): ParseData => pipe(
        RNEA.fromReadonlyArray(remaining),
        O.map(RNEA.unprepend),
        O.map(([head, tail]) => {
            if (head.type == "heading") {
                if (head.depth > depth) {
                    const result = collect(tail, A.empty, A.empty, depth + 1)

                    const child = {
                        title: O.of(head.text),
                        children: result.children,
                        contents: result.contents
                    }

                    return collect(result.remaining, pipe(children, A.append(child)), contents, depth)
                } else {
                    return {
                        remaining: remaining,
                        children: children,
                        contents: contents
                    }
                }
            }

            return collect(tail, children, pipe(contents, A.append(head)), depth)
        }),
        O.getOrElse<ParseData>(() => ({
            remaining: A.empty,
            children: children,
            contents: contents
        }))
    )

    const {children, contents} = collect()

    return {
        title: none,
        children: children,
        contents: contents
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * An implementation of {@link Renderer} which converts a Markdown input into plain text output.
 * @implements {Renderer}
 */
export class PlainTextRenderer implements Renderer {

    readonly options: MarkedOptions

    constructor(options?: MarkedOptions) {
        this.options = options || {}
    }

    code(code: string, _infostring: string | undefined, _escaped: boolean): string {
        return code
    }

    blockquote(quote: string): string {
        return quote
    }

    html(html: string, _block?: boolean | undefined): string {
        return html
    }

    heading(text: string, level: number, _raw: string): string {
        return pipe(
            RNEA.range(1, level),
            A.map(() => "="),
            A.append(" "),
            A.append(decode(text)),
            A.append("\n\n")
        ).join("")
    }

    hr(): string {
        return "---"
    }

    list(body: string, _ordered: boolean, _start: number | ""): string {
        return pipe(
            body.split("*"),
            A.map(i => i.trim()),
            A.filter(i => i.length > 0),
            A.map(ST.trim),
            A.map(i => [" *", i].join(" "))
        ).join("\n")
    }

    listitem(text: string, _task: boolean, _checked: boolean): string {
        return "* " + decode(text)
    }

    checkbox(checked: boolean): string {
        return checked ? "[x]" : "[ ]"
    }

    paragraph(text: string): string {
        return decode(text).replace(/\n/g, " ") + "\n\n"
    }

    table(_header: string, _body: string): string {
        return ""
    }

    tablerow(_content: string): string {
        return ""
    }

    tablecell(_content: string, _flags: { header: boolean; align: "center" | "left" | "right" | null }): string {
        return ""
    }

    strong(text: string): string {
        return decode(text)
    }

    em(text: string): string {
        return decode(text)
    }

    codespan(text: string): string {
        return decode(text)
    }

    br(): string {
        return "\n"
    }

    del(_text: string): string {
        return decode("")
    }

    link(_href: string, _title: string | null | undefined, text: string): string {
        return decode(text)
    }

    image(_href: string, _title: string | null, text: string): string {
        return decode(text)
    }

    text(text: string): string {
        return decode(text)
    }
}
