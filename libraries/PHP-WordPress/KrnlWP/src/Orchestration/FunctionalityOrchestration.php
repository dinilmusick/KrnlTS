<?php
declare(strict_types=1);

namespace KrnlWP\Orchestration;

final class FunctionalityOrchestration {
    private array $steps = [];

    public function __construct(
        public readonly string $id,
        public readonly string $version = '1.0.0'
    ) {}

    private function append(string $type, string $target, array $options = []): self {
        $id = $options['id'] ?? 'step_' . count($this->steps) . '_' . $target;
        $depends = $options['dependsOn'] ?? (count($this->steps) ? [$this->steps[array_key_last($this->steps)]->id] : []);
        $condition = isset($options['condition']) && $options['condition'] !== null ? \Closure::fromCallable($options['condition']) : null;
        $inputFactory = isset($options['inputFactory']) && $options['inputFactory'] !== null ? \Closure::fromCallable($options['inputFactory']) : null;
        $catch = isset($options['catchHandler']) && $options['catchHandler'] !== null ? \Closure::fromCallable($options['catchHandler']) : null;
        $compensation = isset($options['compensation']) && $options['compensation'] !== null ? \Closure::fromCallable($options['compensation']) : null;

        $this->steps[] = new Step(
            $id,
            $type,
            $target,
            $depends,
            $condition,
            $options['concurrency'] ?? null,
            $inputFactory,
            $options['retry'] ?? [],
            $options['timeoutMs'] ?? null,
            $catch,
            $compensation
        );
        return $this;
    }

    public function then(string $functionality, array $options = []): self {
        return $this->append('functionality', $functionality, $options);
    }

    public function parallel(string $name, array $targets, array $options = []): self {
        $depends = $options['dependsOn'] ?? (count($this->steps) ? [$this->steps[array_key_last($this->steps)]->id] : []);
        $ids = [];
        foreach ($targets as $target) {
            $id = $name . '_' . $target;
            $ids[] = $id;
            $this->append('functionality', $target, ['id' => $id, 'dependsOn' => $depends]);
        }
        $this->steps[] = new Step($name . '_join', 'fanIn', $name, $ids);
        return $this;
    }

    public function branch(string $name, callable $condition, string $then, ?string $else = null, array $options = []): self {
        $cond = \Closure::fromCallable($condition);
        $depends = $options['dependsOn'] ?? (count($this->steps) ? [$this->steps[array_key_last($this->steps)]->id] : []);
        $this->append('functionality', $then, ['id' => $name . '_then', 'dependsOn' => $depends, 'condition' => $cond]);
        $join = [$name . '_then'];
        if ($else !== null) {
            $this->append('functionality', $else, ['id' => $name . '_else', 'dependsOn' => $depends, 'condition' => fn($ctx) => !$cond($ctx)]);
            $join[] = $name . '_else';
        }
        $this->steps[] = new Step($name . '_join', 'fanIn', $name, $join);
        return $this;
    }

    public function fanOut(string $name, string $target, callable $items, int $concurrency = 5): self {
        return $this->append('fanOut', $target, ['id' => $name, 'concurrency' => $concurrency, 'inputFactory' => $items]);
    }

    public function nested(string $id): self {
        return $this->append('nested', $id, ['id' => 'nested_' . $id]);
    }

    public function steps(): array {
        return $this->steps;
    }

    public function definition(): array {
        return [
            'id' => $this->id,
            'version' => $this->version,
            'scope' => 'functionality',
            'steps' => array_map(
                static fn(Step $s) => [
                    'id' => $s->id,
                    'type' => $s->type,
                    'target' => $s->target,
                    'dependsOn' => $s->dependsOn,
                    'concurrency' => $s->concurrency,
                    'retryPolicy' => $s->retryPolicy,
                    'timeoutMs' => $s->timeoutMs,
                ],
                $this->steps
            ),
        ];
    }
}