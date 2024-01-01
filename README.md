[![Opticat logo](https://github.com/mysticfall/opticat/raw/main/logo.webp)](https://github.com/mysticfall/opticat)

# Opticat

Opticat is an experimental API designed for game development.

## Project Status

Currently, Opticat is in the proof-of-concept stage. Spawned from various thoughts about programming paradigms, it's
purely experimental at this point and not suitable for practical purposes.

| Statements                  | Branches                | Functions                 | Lines             |
| --------------------------- | ----------------------- | ------------------------- | ----------------- |
| ![Statements](https://img.shields.io/badge/statements-90.08%25-brightgreen.svg?style=flat) | ![Branches](https://img.shields.io/badge/branches-92.18%25-brightgreen.svg?style=flat) | ![Functions](https://img.shields.io/badge/functions-73.52%25-red.svg?style=flat) | ![Lines](https://img.shields.io/badge/lines-90.08%25-brightgreen.svg?style=flat) |

## Motivation

Opticat is a created to serve as a testbed for various ideas about programming paradigms.

The main idea behind the project is to combine key elements of Object-Oriented Programming (OOP), Functional
Programming (FP), using a data-driven approach.

Specifically, it aims to incorporate the overridable behaviours of a concept, typical of a type hierarchy in OOP,
with the immutability and statelessness of FP.

The `Actor` class, for example, defines what properties and behaviours a game character should have, similar to
what "Actor Form" in Skyrim's Creation Engine does.

In contrast to Skyrim, however, an `Actor` instance in our API corresponds to a `Form` rather than an individual actor.

And since Opticat embraces a data-driven approach, all states of an individual character is represented as an immutable 
data structure, `ActorData`.

This pattern — of having a class representing a form, and a corresponding data structure storing its states — applies 
to most core concepts in Opticat.

Also, `WorldData` is the top-level context that holds all in-game data, and every state updating API (e.g. one that 
changes a character's attribute) adheres to the ubiquitous signature `WorldData =>  Either<Error, WorldData>`.

## Documentation

API documentation can be accessed from [this link](https://mysticfall.github.io/opticat). 

## License

Opticat is an open-source project, available under the [MIT License](LICENSE).
