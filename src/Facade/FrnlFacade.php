<?php
declare(strict_types=1);

namespace FrnlWP\Facade;

use FrnlWP\Store\SemanticStore;

final class FrnlFacade {
    public function __construct(private readonly SemanticStore $store) {}

    public function component(string $componentId): array {
        return $this->store->entity($componentId);
    }

    public function event(string $componentId, string $eventName, mixed $payload = null): mixed {
        return $this->store->invoke($componentId, $eventName, $payload);
    }

    public function library(string $address): mixed {
        return $this->store->library($address);
    }

    public function setVisualOverride(string $componentId, string $parameter, mixed $value): void {
        $this->store->setVisualOverride($componentId, $parameter, $value);
    }

    public function registerTheme(string $name, array $theme): void {
        $this->store->registerTheme($name, $theme);
    }

    public function applyTheme(string $componentId, string $themeName): void {
        $this->store->applyTheme($componentId, $themeName);
    }

    public function store(): SemanticStore {
        return $this->store;
    }
}
