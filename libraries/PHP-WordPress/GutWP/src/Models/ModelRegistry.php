<?php
declare(strict_types=1);

namespace GutWP\Models;

require_once __DIR__ . '/ModelTypes.php';

final class ModelRegistry {
    /** @var array<string, ModelMetadata> */
    private static array $models = [];

    public static function all(): array {
        if (empty(self::$models)) {
            self::registerDefaults();
        }
        return array_values(self::$models);
    }

    public static function get(string $id): ModelMetadata {
        if (empty(self::$models)) {
            self::registerDefaults();
        }
        return self::$models[$id] ?? throw new \InvalidArgumentException("Unknown GutWP model '$id'.");
    }

    public static function has(string $id): bool {
        if (empty(self::$models)) {
            self::registerDefaults();
        }
        return isset(self::$models[$id]);
    }

    public static function register(ModelMetadata $meta): void {
        self::$models[$meta->id] = $meta;
    }

    private static function registerDefaults(): void {
        $defs = [
            new ModelMetadata(
                'smollm2', 'SmolLM2-135M', 'HuggingFaceTB', '1.0.0',
                'Compact on-device language model for text generation and instruction following',
                ['generate', 'instruction-following'], ['value' => 135, 'unit' => 'MB', 'qualifier' => 'parameters']
            ),
            new ModelMetadata(
                'needle3', 'Needle-3-0.5B', 'UltrstArmada', '3.0.0',
                'Fast JSON-schema structured output and semantic extraction model',
                ['complete', 'schema-constrained-json'], ['value' => 500, 'unit' => 'MB', 'qualifier' => 'parameters']
            ),
            new ModelMetadata(
                'whistle', 'Whistle-Small', 'OpenAI', '1.0.0',
                'Voice transcription and speech-to-text processing unit',
                ['transcribe', 'audio'], ['value' => 240, 'unit' => 'MB', 'qualifier' => 'artifact']
            ),
            new ModelMetadata(
                'ettin-reranker', 'Ettin-Reranker-32M', 'UltrstArmada', '1.0.0',
                'Cross-encoder text reranker for ranking candidates and search results',
                ['rerank', 'cross-encoder'], ['value' => 32, 'unit' => 'MB', 'qualifier' => 'parameters']
            ),
            new ModelMetadata(
                'minilm', 'all-MiniLM-L6-v2', 'sentence-transformers', '2.0.0',
                'Fast sentence embedding model for cosine similarity',
                ['embed', 'similarity'], ['value' => 80, 'unit' => 'MB', 'qualifier' => 'artifact']
            ),
        ];

        foreach ($defs as $model) {
            self::register($model);
        }
    }
}
