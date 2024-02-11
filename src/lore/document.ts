/**
 * Definitions of related to LangChain documents.
 * @module
 */
import {Document} from "@langchain/core/documents"
import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {flow, pipe} from "fp-ts/function"
import * as A from "fp-ts/ReadonlyArray"
import * as TE from "fp-ts/TaskEither"
import {TaskEither} from "fp-ts/TaskEither"
import {BaseDocumentLoader, DocumentLoader} from "langchain/document_loaders/base"
import {IOError} from "../common"
import {LoreParseError} from "./errors"
import {LoreEntry, LoreEntryMetadata} from "./lore"
import {MarkdownLoreParser} from "./markdown"
import {LoreParser} from "./parser"

/**
 * A type alias for the LangChain {@link Document} with the {@link LoreEntryMetadata}.
 */
export type LoreDocument = Document<LoreEntryMetadata>

/**
 * An implementation of {@link DocumentLoader} that acts as a wrapper for a given {@link DocumentLoader} to
 * convert its output into {@link LoreDocument}s.
 */

export class LoreDocumentLoader extends BaseDocumentLoader {

    /**
     * Constructs a new instance of {@link LoreDocumentLoader}.
     *
     * @param {DocumentLoader} source The loader from which to load source documents.
     * @param {LoreParser} parser The parser with which to convert the source documents into lore entries.
     *  Defaults to an instance of {@link MarkdownLoreParser}.
     * @param {string} [titleSeparator] The separator to use when joining an entry title with its content.
     *  Defaults to ": ".
     */
    constructor(
        readonly source: DocumentLoader,
        readonly parser: LoreParser = new MarkdownLoreParser(),
        readonly titleSeparator: string = ": "
    ) {
        super()

        this.load = this.load.bind(this)
        this.createTask = this.createTask.bind(this)
        this.parse = this.parse.bind(this)
        this.toDocument = this.toDocument.bind(this)
    }

    /**
     * Implements {@link DocumentLoader.load} from the parent class. It's recommended to use the
     * {@link createTask} directly if possible because it does not erase the error type.
     *
     * @return {Promise<Document[]>} A promise that resolves to an array of {@link Document}s.
     */
    async load(): Promise<Document[]> {
        return pipe(
            this.createTask(),
            TE.fold(
                e => () => Promise.reject(e),
                d => () => Promise.resolve(pipe(d, A.toArray))
            )
        )()
    }

    /**
     * Load method to load source documents and parse them into an array of LoreDocuments.
     *
     * @returns A TaskEither that may resolve to either an {@link IOError} or a {@link LoreParseError},
     *          along with a readonly array of {@link LoreDocument} objects.
     */
    createTask(): TaskEither<IOError | LoreParseError, ReadonlyArray<LoreDocument>> {
        return pipe(
            TE.tryCatch<IOError, Document[]>(() => this.source.load(), e => ({
                type: "IO",
                message: "Failed to load source documents.",
                details: e
            })),
            TE.chainW(TE.traverseArray(flow(this.parse, TE.fromEither))),
            TE.map(A.flatten)
        )
    }

    /**
     * Parses a source document into an array of {@link LoreDocument}s. Note that all non-conflicting metadata
     * on the source document is preserved during the conversion.
     *
     * @param {Document} source The document to be parsed.
     * @returns {Either<LoreParseError, ReadonlyArray<LoreDocument>>} Either a {@link LoreParseError} if parsing fails,
     *  or an array of {@link LoreDocument}s if parsing is successful.
     */
    protected parse(source: Document): Either<LoreParseError, ReadonlyArray<LoreDocument>> {
        const {pageContent, metadata} = source

        return pipe(
            this.parser.parseText(pageContent),
            E.map(A.map(this.toDocument)),
            E.map(A.map(d => ({
                pageContent: d.pageContent,
                metadata: {
                    ...metadata,
                    ...d.metadata
                }
            })))
        )
    }

    /**
     * Converts a {@link LoreEntry} object into a {@link LoreDocument}.
     *
     * @param {LoreEntry} entry The LoreEntry object to convert.
     * @return {LoreDocument} The converted Document.
     */
    protected toDocument(entry: LoreEntry): LoreDocument {
        const {title, content, metadata} = entry

        const text = pipe(
            title,
            A.fromOption,
            A.append(content)
        ).join(this.titleSeparator)

        return {
            metadata: metadata,
            pageContent: text
        }
    }
}
