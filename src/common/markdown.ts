/**
 * Definitions of common types related to Markdown text processing.
 * @module
 */
import {pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import {none, Option} from "fp-ts/Option"
import * as A from "fp-ts/ReadonlyArray"
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray"
import {marked, MarkedOptions, Parser, Renderer, Token, Tokens} from "marked"

/**
 * Represents a Markdown text with a title, contents, and children.
 */
export interface MarkdownText {

    /**
     * The title of the Markdown text. It can be an empty string or null if not specified.
     *
     * @readonly
     */
    readonly title: Option<string>

    /**
     * The array of tokens representing the contents of the Markdown text.
     *
     * @readonly
     */
    readonly contents: ReadonlyArray<Token>

    /**
     * The array of child {@link MarkdownText} elements.
     *
     * @readonly
     */
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

/**
 * Options for rendering plain text using the {@link PlainTextRenderer}.
 * This interface extends {@link MarkedOptions} interface.
 */
export interface PlainTextRendererOptions {

    readonly concatenateList?: boolean
    readonly headerChar?: string
    readonly parserOptions?: MarkedOptions
}

const DefaultOptions: MarkedOptions = {
    gfm: true,
    breaks: true
}

/**
 * An implementation of {@link Renderer} which renders a Markdown input mostly verbatim, while normalising
 * and compacting it.
 * @implements {@link Renderer}
 */
export class PlainTextRenderer implements Renderer {

    private readonly headerChar: string

    private readonly concatenateList: boolean

    readonly parser: Parser

    readonly options: MarkedOptions

    constructor(options?: PlainTextRendererOptions) {
        this.options = {...DefaultOptions, ...options?.parserOptions}
        this.parser = new Parser(this.options)

        this.headerChar = options?.headerChar ?? "="
        this.concatenateList = options?.concatenateList ?? false
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    space(_token: Tokens.Space): string {
        return "\n"
    }

    code({text, lang}: Tokens.Code): string {
        return ["```", lang ?? "", "\n", text, "\n```\n"].join("")
    }

    blockquote({text}: Tokens.Blockquote): string {
        return ["> ", text, "\n"].join("")
    }

    html({text}: Tokens.HTML | Tokens.Tag): string {
        return text
    }

    heading({depth, tokens}: Tokens.Heading): string {
        const text = this.parser.parseInline(tokens)

        return pipe(
            RNEA.range(1, depth),
            A.map(() => this.headerChar),
            A.append(" "),
            A.append(text),
            A.append("\n")
        ).join("")
    }

    hr(): string {
        return "---\n"
    }

    list({items, ordered}: Tokens.List): string {
        const removePeriod = (s: string) => s.endsWith(".") ? s.substring(0, s.length - 1) : s

        const itemSeparator = this.concatenateList ? "; " : "\n"

        return pipe(
            items,
            A.map(i => this.listitem(i)),
            A.mapWithIndex((i, text) => {
                if (!this.concatenateList) {
                    return ordered ? [i + 1, ". ", text].join("") : ["*", text].join(" ")
                }

                return i < items.length - 1 ? removePeriod(text) : text
            })
        ).join(itemSeparator).trim() + "\n"
    }

    listitem({text, task, checked}: Tokens.ListItem): string {
        if (task) {
            return [checked ? "[x] " : "[ ] ", text].join("")
        }

        return text
    }

    checkbox({checked}: Tokens.Checkbox): string {
        return checked ? "[x]" : "[ ]"
    }

    paragraph({text, pre}: Tokens.Paragraph): string {
        return [pre ? text : text.replace(/\s*\n\s*/g, " "), "\n"].join("")
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    table(_tokens: Tokens.Table): string {
        return ""
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tablerow(_tokens: Tokens.TableRow): string {
        return ""
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tablecell(_tokens: Tokens.TableCell): string {
        return ""
    }

    strong({text}: Tokens.Strong): string {
        return ["**", text, "**"].join("")
    }

    em({text}: Tokens.Em): string {
        return ["*", text, "*"].join("")
    }

    codespan({text}: Tokens.Codespan): string {
        return ["```", text, "```"].join("")
    }

    br(): string {
        return "\n"
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    del(_tokens: Tokens.Del): string {
        return ""
    }

    link({text}: Tokens.Link): string {
        return text
    }

    image({text}: Tokens.Image): string {
        return text
    }

    text({text}: Tokens.Text | Tokens.Escape | Tokens.Tag): string {
        return text
    }
}
