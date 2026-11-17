<?php

declare(strict_types=1);

namespace KrnlWP\State;

final class StateStore {
    /** @var array<string,mixed> */
    private array $state=[];

    public function get(string $key,mixed $default=null): mixed {
        return array_key_exists($key,$this->state)?$this->state[$key]:$default;
    }

    public function set(string $key,mixed $value): mixed {
        $previous=$this->get($key); $this->state[$key]=$value; return $previous;
    }

    public function has(string $key): bool { return array_key_exists($key,$this->state); }

    /** @return array<string,mixed> */
    public function all(): array { return $this->state; }
}