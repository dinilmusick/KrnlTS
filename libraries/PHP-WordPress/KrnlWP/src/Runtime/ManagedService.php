<?php

declare(strict_types=1);

namespace KrnlWP\Runtime;

use KrnlWP\Contract\Service;

abstract class ManagedService implements Service {
    private string $lifecycle=Lifecycle::UNINITIALIZED;

    public function state(): string { return $this->lifecycle; }

    final public function initialize(): void {
        $this->move(Lifecycle::INITIALIZING); $this->register(); $this->move(Lifecycle::READY);
    }

    final public function boot(): void {
        $this->move(Lifecycle::STARTING); $this->start(); $this->move(Lifecycle::RUNNING);
    }

    final public function shutdown(): void {
        $this->move(Lifecycle::STOPPING); $this->stop(); $this->move(Lifecycle::STOPPED);
    }

    protected function move(string $next): void {
        if (!Lifecycle::canTransition($this->lifecycle,$next)) throw new \RuntimeException("Invalid lifecycle transition");
        $this->lifecycle=$next;
    }
}