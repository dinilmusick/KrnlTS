<?php
declare(strict_types=1);

namespace KrnlWP\Orchestration;

final class Executor {
    public function __construct(private readonly ?\Closure $nestedRunner = null) {}

    public function execute(FunctionalityOrchestration $flow, array $functionalities, array $input = []): mixed {
        $done = [];
        $results = ['input' => $input];
        $value = $input;
        $steps = $flow->steps();
        $remaining = count($steps);
        $executedCompensations = [];

        while ($remaining > 0) {
            $progress = false;
            foreach ($steps as $step) {
                if (array_key_exists($step->id, $done)) continue;
                foreach ($step->dependsOn as $dep) {
                    if (!array_key_exists($dep, $done)) continue 2;
                }
                $progress = true;
                try {
                    $stepValue = $this->runStep($step, $functionalities, $results, $value);
                    $results[$step->id] = $stepValue;
                    $done[$step->id] = true;
                    $value = $stepValue;

                    if ($step->compensation !== null) {
                        $executedCompensations[] = $step->compensation;
                    }
                } catch (\Throwable $e) {
                    // Saga compensation: execute compensations in reverse order
                    if (!empty($executedCompensations)) {
                        for ($i = count($executedCompensations) - 1; $i >= 0; $i--) {
                            try {
                                ($executedCompensations[$i])($this->context($results));
                            } catch (\Throwable $compErr) {
                                error_log("[KrnlWP] Saga compensation failed: " . $compErr->getMessage());
                            }
                        }
                    }
                    throw new \RuntimeException("Step \"{$step->id}\" failed: " . $e->getMessage(), 0, $e);
                }
                $remaining--;
            }
            if (!$progress) {
                throw new \RuntimeException('Circular or unresolved orchestration dependency detected');
            }
        }
        return $value;
    }

    private function runStep(Step $step, array $functionalities, array $results, mixed $value): mixed {
        if ($step->condition && !(($step->condition)($this->context($results)))) {
            return null;
        }
        if ($step->type === 'fanIn') {
            $joined = [];
            foreach ($step->dependsOn as $dep) {
                $joined[$dep] = $results[$dep] ?? null;
            }
            return $joined;
        }
        if ($step->type === 'fanOut') {
            $items = $step->inputFactory ? ($step->inputFactory)($this->context($results)) : [$value];
            if (!is_array($items)) {
                throw new \RuntimeException('fanOut inputFactory must return an array');
            }
            $worker = $this->worker($functionalities, $step->target);
            $resultsOut = [];
            $limit = max(1, $step->concurrency ?? count($items));
            for ($i = 0; $i < count($items); $i += $limit) {
                foreach (array_slice($items, $i, $limit) as $item) {
                    $resultsOut[] = $this->invoke($worker, $item, $step);
                }
            }
            return $resultsOut;
        }
        if ($step->type === 'nested' && $this->nestedRunner) {
            return ($this->nestedRunner)($step->target, $results, $this->context($results));
        }
        $worker = $this->worker($functionalities, $step->target);
        return $this->invoke($worker, $results, $step);
    }

    private function worker(array $functionalities, string $target): callable {
        $worker = $functionalities[$target] ?? null;
        if (!is_callable($worker)) {
            throw new \RuntimeException("Unknown functionality: $target");
        }
        return $worker;
    }

    private function invoke(callable $worker, mixed $payload, Step $step): mixed {
        $policy = $step->retryPolicy;
        $max = max(1, (int) ($policy['maxAttempts'] ?? 1));
        $last = null;
        for ($attempt = 1; $attempt <= $max; $attempt++) {
            try {
                return $worker($payload);
            } catch (\Throwable $e) {
                $last = $e;
                if ($attempt === $max) break;
                $base = max(0, (int) ($policy['backoffMs'] ?? 100));
                $delay = ($policy['backoff'] ?? 'exponential') === 'linear' ? $base * $attempt : $base * (2 ** ($attempt - 1));
                if (isset($policy['maxBackoffMs'])) {
                    $delay = min($delay, (int) $policy['maxBackoffMs']);
                }
                if ($delay > 0) usleep($delay * 1000);
            }
        }
        if ($step->catchHandler) {
            return ($step->catchHandler)($last, $this->context(['input' => $payload]));
        }
        throw $last ?? new \RuntimeException('Step execution failed');
    }

    private function context(array $results): array {
        return ['results' => $results, 'input' => $results['input'] ?? null];
    }
}