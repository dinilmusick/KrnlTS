# 02 — SKIPO CONTRACT BOUNDARY ENFORCEMENT

## CORE_MODEL

    SKIPO := SCAFFOLD + POLICY + VALIDATION + UPGRADE_TOOLING

    LibraryContract
        ↓
    SKIPO Validator
        ↓
    Consumer App

## OBJECTIVES

    S1 → canonical dependency manifest
    S2 → public-import validator
    S3 → internal-import validator
    S4 → local-shim detector
    S5 → consumer contract requirements
    S6 → contract snapshot/diff
    S7 → upgrade verification
    S8 → generated-app enforcement
    S9 → CI/build integration

## APP_CONTRACT

    .skipo/
    ├── config.json
    ├── contracts/
    │   ├── kloks.json
    │   └── floks.json
    └── actions/

    ConsumerRequirements ⊆ InstalledLibraryPublicContract

## VALIDATORS

    V1 → structure
    V2 → architecture
    V3 → purity
    V4 → dependency boundaries
    V5 → public exports
    V6 → forbidden internal imports
    V7 → local shim / duplicate contract detection
    V8 → installed-library compatibility
    V9 → semantic consumer tests

## FORBIDDEN

    APP → node_modules/package/internal/*
    APP → undocumented library symbol
    APP → local replacement of canonical library symbol
    APP → Skipo/ runtime implementation
    APP → sibling application implementation

## REQUIRED

    APP → @kloks/<public-subpath>
    APP → @floks/<public-subpath>
    APP → documented facade
    APP → documented schema

## COMMANDS

    skipo contract snapshot
    skipo contract diff
    skipo contract check
    skipo dependency check
    skipo validate
    skipo upgrade verify

## GENERATOR_INTEGRATION

    generate app
      ↓
    write .skipo/config.json
      ↓
    write dependency requirements
      ↓
    write contract requirements
      ↓
    install canonical packages
      ↓
    validate

## BUILD_GATE

    source_change
      → skipo validate
      → contract extraction
      → contract diff
      → dependency boundary check
      → package tests
      → consumer contract tests
      → app tests
      → build

## UPGRADE_RULE

    Library upgrade
      → skipo upgrade verify
      → compatible ⇒ app code unchanged
      → incompatible ⇒ explicit migration

## ACCEPTANCE

    ExitCode(skipo validate) = 0

    Validation MUST fail if:
      ∃ import outside public contract
      ∨ ∃ local canonical-symbol shim
      ∨ ∃ undocumented dependency boundary
      ∨ InstalledContract ⊅ RequiredContract
