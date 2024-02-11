import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import matter from "gray-matter"
import {Errors} from "io-ts"
import {PathReporter} from "io-ts/PathReporter"
import {LoreParseError} from "./errors"
import {LoreEntry, LoreEntryMetadata, LoreEntryMetadataT} from "./lore"

/**
 * A parser interface that is responsible for converting text into a list of lore entries.
 */
export interface LoreParser {

    /**
     * Parses the given text and returns either a list of lore entries, or an error.
     *
     * @param {string} text The text to be parsed.
     * @return {Either<LoreParseError, ReadonlyArray<LoreEntry>>} Either a {@link LoreParseError} if parsing fails,
     *  or a read-only array of {@link LoreEntry} objects.
     */
    parseText(text: string): Either<LoreParseError, ReadonlyArray<LoreEntry>>
}

/**
 * AbstractLoreParser is an abstract class that implements the {@link LoreParser} interface.
 * It provides a basic implementation of the `parseText` method and requires subclasses to implement the
 * `parseEntries` method.
 */
export abstract class AbstractLoreParser implements LoreParser {

    protected constructor() {
        this.parseText = this.parseText.bind(this)
        this.parseEntries = this.parseEntries.bind(this)
    }

    parseText(text: string): Either<LoreParseError, ReadonlyArray<LoreEntry>> {
        const {content, data} = matter(text.trim())

        return pipe(
            E.Do,
            E.bind("metadata", () => pipe(
                O.of(data),
                O.traverse(E.Applicative)(LoreEntryMetadataT.decode),
                E.mapLeft<Errors, LoreParseError>(e => ({
                    type: "LoreParse",
                    message: `Failed to parse the lore metadata: ${JSON.stringify(data)}.`,
                    details: PathReporter.report(E.left(e))
                }))
            )),
            E.bindW("entries", ({metadata}) => {
                return this.parseEntries(content, pipe(metadata, O.getOrElseW(() => ({
                    constant: false
                }))))
            }),
            E.map(({entries}) => entries)
        )
    }

    /**
     * Parses the given text and metadata to extract lore entries.
     *
     * @param {string} text The input text to be parsed.
     * @param {LoreEntryMetadata} metadata Additional metadata for the lore entries.
     * @returns {Either<LoreParseError, ReadonlyArray<LoreEntry>>} An Either type with either a LoreParseError or an array of parsed LoreEntry objects.
     */
    protected abstract parseEntries(
        text: string,
        metadata: LoreEntryMetadata
    ): Either<LoreParseError, ReadonlyArray<LoreEntry>>
}
