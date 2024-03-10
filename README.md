[![Opticat logo](https://github.com/mysticfall/opticat/raw/main/logo.webp)](https://github.com/mysticfall/opticat)

# Opticat

Opticat is an experimental API designed for game development. Currently, it's focusing on text-based role-playing 
games using LLM(Large Language Model)s, but it may change in the future.

## Project Status

Currently, Opticat is in the proof-of-concept stage. Created to serve as a testbed for trying out various ideas about 
programming paradigms, it's purely experimental at this point and not suitable for practical purposes.

| Statements                  | Branches                | Functions                 | Lines             |
| --------------------------- | ----------------------- | ------------------------- | ----------------- |
| ![Statements](https://img.shields.io/badge/statements-98.04%25-brightgreen.svg?style=flat) | ![Branches](https://img.shields.io/badge/branches-98.33%25-brightgreen.svg?style=flat) | ![Functions](https://img.shields.io/badge/functions-90%25-brightgreen.svg?style=flat) | ![Lines](https://img.shields.io/badge/lines-98.04%25-brightgreen.svg?style=flat) |

## Motivation

The main idea behind the project is to combine key elements of Object-Oriented Programming (OOP) and Functional
Programming (FP) using a data-driven approach.

Specifically, it aims to incorporate the extendable behaviours of a concept hierarchy typically shown in OOP design,
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
