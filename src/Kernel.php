<?php

declare(strict_types=1);

namespace KrnlWP;

use KrnlWP\Telemetry\TelemetryController;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\EventDispatcher\EventDispatcher;

final class Kernel
{
    public const VERSION = '1.0.9';
    private TelemetryController $telemetry;
    private object $container;

    public function __construct(?object $container = null)
    {
        $this->telemetry = new TelemetryController();
        if ($container !== null) {
            $this->container = $container;
        } elseif (class_exists(ContainerBuilder::class)) {
            $this->container = new ContainerBuilder();
        } else {
            $this->container = new class {
                private array $services = [];
                public function set(string $id, object $svc): void
                {
                    $this->services[$id] = $svc;
                }
                public function get(string $id): object
                {
                    return $this->services[$id] ?? throw new \RuntimeException("Service not found: {$id}");
                }
                public function compile(): void {}
            };
        }
    }

    public function register(object $service, string $id): self
    {
        if (method_exists($this->container, 'set')) {
            $this->container->set($id, $service);
        }
        return $this;
    }

    public function compile(): void
    {
        if (method_exists($this->container, 'compile')) {
            $this->container->compile();
        }
    }

    public function get(string $id): object
    {
        if (method_exists($this->container, 'get')) {
            return $this->container->get($id);
        }
        throw new \RuntimeException("Underlying container does not support get()");
    }

    public function telemetry(): TelemetryController
    {
        return $this->telemetry;
    }

    public static function events(): ?object
    {
        if (class_exists(EventDispatcher::class)) {
            return new EventDispatcher();
        }
        return null;
    }
}