/**
 * Definitions of common types needed to parse text into chat messages that an LLM can understand.
 * @module
 */
import {Either} from "fp-ts/Either"
import {BaseMessage} from "langchain/schema"
import {PromptParseError} from "./errors"

/**
 * Represents an interface that can convert a given text into a list of {@link BaseMessage}s.
 */
export interface ChatMessageParser {

    /**
     * Parses a given text and returns an {@link Either} type, which represents either a list of {@link BaseMessage}s
     * or an error.
     *
     * @param {string} text The text to be parsed.
     * @return {Either<PromptParseError, ReadonlyArray<BaseMessage>>} An Either type, where the left side represents
     * a parse error and the right side represents a successful parse result.
     */
    parse(text: string): Either<PromptParseError, ReadonlyArray<BaseMessage>>
}
