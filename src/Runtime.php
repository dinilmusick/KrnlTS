<?php
declare(strict_types=1);

namespace FrnlWP;

use FrnlWP\Accessibility\AccessibilityValidator;
use FrnlWP\Facade\FrnlFacade;
use FrnlWP\Store\SemanticStore;

use FrnlWP\FrontendApi\FrontendApi;
use FrnlWP\Validation\FrnlValidatorEngine;

final class Runtime {
    public const VERSION = '0.5.3';

    public static function createStore(): SemanticStore {
        return new SemanticStore();
    }

    public static function createFacade(?SemanticStore $store = null): FrnlFacade {
        return new FrnlFacade($store ?? self::createStore());
    }

    public static function createFrontendApi(?SemanticStore $store = null, array $options = []): FrontendApi {
        return new FrontendApi($store ?? self::createStore(), $options);
    }

    public static function createValidatorEngine(string $projectRoot, array $options = []): FrnlValidatorEngine {
        return new FrnlValidatorEngine($projectRoot, $options);
    }

    public static function validateAccessibility(array $contract, array $attributes): array {
        return AccessibilityValidator::validate($contract, $attributes);
    }

    public static function semanticAttributes(string $componentId, string $state = 'idle', array $extra = []): array {
        return array_merge([
            'data-frnl-component' => $componentId,
            'data-frnl-state' => $state,
        ], $extra);
    }

    public static function formatAttributes(array $attributes): string {
        $html = '';
        foreach ($attributes as $key => $value) {
            $html .= sprintf(' %s="%s"', htmlspecialchars((string) $key, ENT_QUOTES, 'UTF-8'), htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'));
        }
        return $html;
    }
}
