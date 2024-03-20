/**
 * Definitions of common types used to parse Markdown text into lore entries.
 * @module
 */
import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import {not} from "fp-ts/Predicate"
import * as A from "fp-ts/ReadonlyArray"
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray"
import * as ST from "fp-ts/string"
import matter from "gray-matter"
import {Errors} from "io-ts"
import {PathReporter} from "io-ts/PathReporter"
import {marked, Renderer} from "marked"
import {MarkdownText, parseMarkdown, PlainTextRenderer} from "../common"
import {LoreParseError} from "./errors"
import {LoreContentT, LoreEntry, LoreEntryMetadata, LoreEntryTitleT} from "./lore"
import {AbstractLoreParser} from "./parser"

/**
 * Represents the options for the {@link MarkdownLoreParser} class.
 *
 * @property {Renderer} [renderer] The renderer used to handle rendering of parsed Markdown elements.
 * @property {string} [headerSeparator] The string used to separate headers in the parsed Markdown text.
 *  parsed Markdown text.
 */
export type MarkdownLoreParserOptions = {

    readonly renderer?: Renderer

    readonly headerSeparator?: string
}

/**
 * A {@link LoreParser} implementation that parses a given Markdown text into a list of lore entries.
 */
export class MarkdownLoreParser extends AbstractLoreParser {

    readonly headerSeparator: string

    readonly renderer: Renderer

    /**
     * @param {MarkdownLoreParserOptions} [options={}] Options for the MarkdownLoreParser.
     */
    constructor(options: MarkdownLoreParserOptions = {}) {
        super()

        this.headerSeparator = options?.headerSeparator ?? "> "
        this.renderer = options?.renderer ?? new PlainTextRenderer()
    }

    protected parseEntries(
        text: string,
        metadata: LoreEntryMetadata
    ): Either<LoreParseError, ReadonlyArray<LoreEntry>> {
        const page = matter(text.trim())

        const root = parseMarkdown(page.content.trim())

        const createEntry = (
            section: MarkdownText = root,
            path: ReadonlyArray<string> = A.empty
        ): Either<LoreParseError, ReadonlyArray<LoreEntry>> => {

            const {title, children, contents} = section

            const fullPath = pipe(
                path,
                A.concat(A.fromOption(title))
            )

            const fullTitle = fullPath.join(this.headerSeparator)

            const entry = pipe(
                RNEA.fromReadonlyArray(contents),
                O.map(tokens => pipe(
                        E.Do,
                        E.bind("content", () => pipe(
                            tokens,
                            A.toArray,
                            c => marked.parser(c, {renderer: this.renderer}).trim(),
                            LoreContentT.decode,
                            E.mapLeft<Errors, LoreParseError>(e => ({
                                type: "LoreParse",
                                message: `Failed to parse the lore content: ${fullTitle}.`,
                                details: PathReporter.report(E.left(e))
                            }))
                        )),
                        E.bind("title", () => pipe(
                            O.of(fullTitle),
                            O.filter(not(ST.isEmpty)),
                            O.traverse(E.Applicative)(LoreEntryTitleT.decode),
                            E.mapLeft<Errors, LoreParseError>(e => ({
                                    type: "LoreParse",
                                    message: `Failed to parse the lore title: ${fullTitle}.`,
                                    details: PathReporter.report(E.left(e))
                                })
                            ))
                        ),
                        E.map(({title, content}) => ({
                            title, content, metadata
                        }))
                    )
                )
            )

            const childEntries = pipe(
                children,
                A.traverse(E.Applicative)(c => createEntry(c, fullPath)),
                E.map(A.flatten)
            )

            return pipe(
                E.Do,
                E.bind("parent", () => pipe(
                    entry,
                    A.fromOption,
                    A.traverse(E.Applicative)(e => e)
                )),
                E.bind("children", () => childEntries),
                E.map(({parent, children}) => pipe(parent, A.concat(children)))
            )
        }

        return createEntry()
    }
}
