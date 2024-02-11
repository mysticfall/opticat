/**
 * Definitions of common types related to in-game information managed by a vector store.
 * @module
 */
import {Option} from "fp-ts/Option"
import * as T from "io-ts"
import {fromNullable, NonEmptyString} from "io-ts-types"
import {MaxLengthString, MinLengthString} from "../common"

/**
 * Represents the validation rules for {@link LoreContent}.
 */
export const LoreContentT = NonEmptyString

/**
 * Represents the content of a lore entry, which must be a non-empty string written in plain English.
 */
export type LoreContent = T.TypeOf<typeof LoreContentT>

/**
 * Represents the validation rules for {@link LoreEntryId}.
 */
export const LoreEntryIdT = T.intersection([
    MinLengthString(1),
    MaxLengthString(20)
], "LoreEntryId")

/**
 * Represents the unique identifier of a lore entry, which must be a character sequence of length 1 to 20.
 */
export type LoreEntryId = T.TypeOf<typeof LoreEntryIdT>

/**
 * Represents the validation rules for {@link LoreEntryMetadata}.
 */
export const LoreEntryMetadataT = T.readonly(T.type({
    constant: fromNullable(T.boolean, false)
}))

/**
 * Represents the metadata information for a lore entry.
 */
export interface LoreEntryMetadata {

    /**
     * Whether this entry should be always included in an LLM context.
     *
     * @readonly
     */
    readonly constant: boolean
}

/**
 * Represents an information entry used for providing the context in content generation
 * using a LLM.
 */
export interface LoreEntry {

    /**
     * An optional title for this lore entry.
     *
     * @readonly
     */
    readonly title: Option<LoreEntryTitle>

    /**
     * The content of this lore entry.
     *
     * @readonly
     */
    readonly content: LoreContent

    /**
     * The metadata of this lore entry.
     *
     * @readonly
     */
    readonly metadata: LoreEntryMetadata
}

/**
 * Represents the validation rules for {@link LoreEntryTitle}.
 */
export const LoreEntryTitleT = T.intersection([
    MinLengthString(1),
    MaxLengthString(200)
], "LoreEntryTitle")

/**
 * Represents the title of a lore entry, which must be a character sequence of length 1 to 200.
 */
export type LoreEntryTitle = T.TypeOf<typeof LoreEntryTitleT>
