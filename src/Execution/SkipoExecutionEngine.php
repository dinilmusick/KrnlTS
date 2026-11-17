<?php

declare(strict_types=1);

namespace SkipoWP\Execution;

use SkipoWP\Backend\BackendFacade;
use SkipoWP\Composition\IntegrityValidator;

/**
 * Executes a composite Skipo application across the 6 architecture layers.
 */
class SkipoExecutionEngine
{
    public const LAYERS = ['GutWP', 'KrnlWP', 'FrnlWP', 'KloksWP', 'FloksWP', 'SkipoWP'];

    private BackendFacade $backend;
    private IntegrityValidator $validator;
    private array $loadedLayers = [];

    public function __construct(?BackendFacade $backend = null)
    {
        $this->backend = $backend ?? new BackendFacade();
        $this->validator = new IntegrityValidator();
    }

    public function bootstrapLayer(string $layerName): bool
    {
        if (!in_array($layerName, self::LAYERS, true)) {
            throw new \InvalidArgumentException("Invalid layer: {$layerName}");
        }

        $currentIndex = count($this->loadedLayers);
        $expectedLayer = self::LAYERS[$currentIndex] ?? null;

        if ($layerName !== $expectedLayer) {
            throw new \RuntimeException("Layer ordering violation: expected {$expectedLayer}, got {$layerName}");
        }

        $this->loadedLayers[] = $layerName;
        return true;
    }

    public function bootstrapAll(): void
    {
        $this->loadedLayers = [];
        foreach (self::LAYERS as $layer) {
            $this->bootstrapLayer($layer);
        }
    }

    public function getLoadedLayers(): array
    {
        return $this->loadedLayers;
    }

    public function getBackend(): BackendFacade
    {
        return $this->backend;
    }

    public function getValidator(): IntegrityValidator
    {
        return $this->validator;
    }

    public function executeCommand(string $command, array $payload = []): array
    {
        if (count($this->loadedLayers) < count(self::LAYERS)) {
            $this->bootstrapAll();
        }

        return [
            'status' => 'success',
            'command' => $command,
            'payload' => $payload,
            'timestamp' => time(),
        ];
    }
}
