<?php
declare(strict_types=1);

namespace GutWP\SemanticInput;

require_once __DIR__ . '/SemanticInputSchema.php';
require_once __DIR__ . '/SemanticInputResolution.php';

final class SemanticInputResolver {
    public static function resolveDeterministic(string $input, SemanticInputSchema $schema): ?SemanticInputResolution {
        $trimmed = trim($input);
        if ($trimmed === '') return null;

        // 1. Enum match
        if (!empty($schema->enum)) {
            foreach ($schema->enum as $candidate) {
                if (is_string($candidate) && strcasecmp($trimmed, $candidate) === 0) {
                    return new SemanticInputResolution('resolved', $candidate, [], $candidate, $input);
                }
            }
        }

        // 2. Type matches
        if ($schema->type === 'string') {
            if ($schema->format === 'email' && filter_var($trimmed, FILTER_VALIDATE_EMAIL)) {
                return new SemanticInputResolution('resolved', $trimmed, [], $trimmed, $input);
            }
            if ($schema->format === 'uri' && filter_var($trimmed, FILTER_VALIDATE_URL)) {
                return new SemanticInputResolution('resolved', $trimmed, [], $trimmed, $input);
            }
            if ($schema->format === 'date' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $trimmed)) {
                return new SemanticInputResolution('resolved', $trimmed, [], $trimmed, $input);
            }
            if ($schema->pattern && preg_match('/' . $schema->pattern . '/', $trimmed)) {
                return new SemanticInputResolution('resolved', $trimmed, [], $trimmed, $input);
            }
        }

        if ($schema->type === 'number' && is_numeric($trimmed)) {
            return new SemanticInputResolution('resolved', (float) $trimmed, [], (float) $trimmed, $input);
        }

        if ($schema->type === 'integer' && filter_var($trimmed, FILTER_VALIDATE_INT) !== false) {
            return new SemanticInputResolution('resolved', (int) $trimmed, [], (int) $trimmed, $input);
        }

        if ($schema->type === 'boolean') {
            $lower = strtolower($trimmed);
            if ($lower === 'true' || $lower === 'yes' || $lower === '1') {
                return new SemanticInputResolution('resolved', true, [], true, $input);
            }
            if ($lower === 'false' || $lower === 'no' || $lower === '0') {
                return new SemanticInputResolution('resolved', false, [], false, $input);
            }
        }

        return null;
    }

    public static function rankCandidates(string $input, array $candidates): array {
        if (empty($candidates)) return [];
        $ranked = [];
        $inputLower = strtolower(trim($input));

        foreach ($candidates as $candidate) {
            $candStr = (string) $candidate;
            $candLower = strtolower($candStr);
            similar_text($inputLower, $candLower, $percent);
            $similarity = $percent / 100.0;
            $relevance = str_contains($candLower, $inputLower) ? 0.9 : $similarity;
            $ranked[] = new SemanticInputCandidate($candStr, (float) $similarity, (float) $relevance);
        }

        usort($ranked, static fn(SemanticInputCandidate $a, SemanticInputCandidate $b) => $b->relevance <=> $a->relevance);
        return $ranked;
    }

    public static function resolve(string $input, SemanticInputSchema $schema, array $candidates = []): SemanticInputResolution {
        $trimmed = trim($input);
        if ($trimmed === '') {
            return new SemanticInputResolution('invalid', null, [], null, $input, ['code' => 'EMPTY_INPUT', 'message' => 'Semantic input is empty.']);
        }

        $deterministic = self::resolveDeterministic($trimmed, $schema);
        if ($deterministic !== null) return $deterministic;

        if (!empty($candidates)) {
            $ranked = self::rankCandidates($trimmed, $candidates);
            if (!empty($ranked)) {
                $top = $ranked[0];
                $second = $ranked[1] ?? null;
                $margin = $second ? ($top->relevance - $second->relevance) : 1.0;

                if ($top->relevance >= 0.7 && $margin >= 0.1) {
                    return new SemanticInputResolution('resolved', $top->value, $ranked, $top->value, $input);
                }
                return new SemanticInputResolution('ambiguous', null, $ranked, null, $input, ['code' => 'AMBIGUOUS_CANDIDATE', 'message' => 'Multiple viable candidates found.']);
            }
        }

        return new SemanticInputResolution('unresolved', null, [], null, $input, ['code' => 'UNRESOLVED', 'message' => 'Input could not be resolved to target schema.']);
    }
}
