<?php
declare(strict_types=1);

namespace SkipoWP\Backend;

use KrnlWP\Service\WordPressService;
use KrnlWP\Orchestration\Executor;
use KrnlWP\Orchestration\FunctionalityOrchestration;

final class BackendFacade {
    /** @var array<string, object> */
    private array $services = [];
    /** @var array<string, array<int, array{serviceId: string, category: string}>> */
    private array $capabilityOwners = [];
    /** @var array<string, array{serviceId: string, functionalities: array, orchestrations: array, libraries: array}> */
    private array $namespaces = [];

    public function registerService(object $service, ?string $alias = null): self {
        $id = method_exists($service, 'id') ? $service->id() : (property_exists($service, 'id') ? $service->id : get_class($service));
        $name = method_exists($service, 'name') ? $service->name() : $id;

        $this->services[$id] = $service;
        $this->services[$name] = $service;
        if ($alias !== null) {
            $this->services[$alias] = $service;
        }

        $def = method_exists($service, 'getDefinition') ? $service->getDefinition() : null;
        $operations = $def && property_exists($def, 'operations') ? $def->operations : [];
        $orchestrations = $def && property_exists($def, 'orchestrations') ? $def->orchestrations : [];
        $libraries = $def && property_exists($def, 'libraries') ? $def->libraries : [];

        $this->namespaces[$id] = [
            'serviceId' => $id,
            'functionalities' => $operations,
            'orchestrations' => $orchestrations,
            'libraries' => $libraries,
        ];
        $this->namespaces[$name] = &$this->namespaces[$id];

        $this->indexCategory($id, 'functionalities', array_keys($operations));
        $this->indexCategory($id, 'orchestrations', array_keys($orchestrations));
        $this->indexCategory($id, 'libraries', array_keys($libraries));

        return $this;
    }

    private function indexCategory(string $serviceId, string $category, array $names): void {
        foreach ($names as $name) {
            $key = $category . ':' . $name;
            $this->capabilityOwners[$key][] = ['serviceId' => $serviceId, 'category' => $category];
        }
    }

    public function getService(string $idOrName): object {
        return $this->services[$idOrName] ?? throw new \RuntimeException("[BackendFacade] Service '$idOrName' not found.");
    }

    public function listServices(): array {
        return array_values(array_unique(array_keys($this->services)));
    }

    public function hasCapability(string $name, ?string $category = null): bool {
        if ($category !== null) {
            return !empty($this->capabilityOwners[$category . ':' . $name]);
        }
        return !empty($this->capabilityOwners['functionalities:' . $name])
            || !empty($this->capabilityOwners['orchestrations:' . $name])
            || !empty($this->capabilityOwners['libraries:' . $name]);
    }

    public function getFunctionality(string $name, ?string $namespace = null): mixed {
        return $this->resolveCapability('functionalities', $name, $namespace);
    }

    public function getOrchestration(string $name, ?string $namespace = null): mixed {
        return $this->resolveCapability('orchestrations', $name, $namespace);
    }

    public function getLibrary(string $name, ?string $namespace = null): mixed {
        return $this->resolveCapability('libraries', $name, $namespace);
    }

    private function resolveCapability(string $category, string $name, ?string $namespace = null): mixed {
        if ($namespace !== null) {
            $ns = $this->namespaces[$namespace] ?? throw new \RuntimeException("[BackendFacade] Namespace '$namespace' not found.");
            return $ns[$category][$name] ?? throw new \RuntimeException("[BackendFacade] Capability '$name' not found in namespace '$namespace'.");
        }

        $owners = $this->capabilityOwners[$category . ':' . $name] ?? [];
        if (empty($owners)) {
            throw new \RuntimeException("[BackendFacade] Capability '$name' ($category) not found across services.");
        }
        if (count($owners) > 1) {
            $list = implode(', ', array_column($owners, 'serviceId'));
            throw new \RuntimeException("[BackendFacade] Collision: capability '$name' is registered by multiple services ($list).");
        }

        $svcId = $owners[0]['serviceId'];
        return $this->namespaces[$svcId][$category][$name];
    }

    public function executeCapability(string $capabilityName, mixed $input = null, array $context = []): mixed {
        if (isset($this->services[$capabilityName])) {
            $service = $this->services[$capabilityName];
            if (method_exists($service, 'call')) {
                return $service->call($capabilityName, $input, $context);
            }
        }

        $owners = array_merge(
            $this->capabilityOwners['functionalities:' . $capabilityName] ?? [],
            $this->capabilityOwners['orchestrations:' . $capabilityName] ?? []
        );

        if (empty($owners)) {
            throw new \RuntimeException("[BackendFacade] Cannot resolve capability '$capabilityName' to any service.");
        }
        if (count($owners) > 1) {
            throw new \RuntimeException("[BackendFacade] Collision: capability '$capabilityName' owned by multiple services.");
        }

        $targetService = $this->services[$owners[0]['serviceId']];
        if (method_exists($targetService, 'call')) {
            return $targetService->call($capabilityName, $input, $context);
        }

        throw new \RuntimeException("[BackendFacade] Target service does not support call().");
    }
}
