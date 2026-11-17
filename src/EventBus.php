<?php

declare(strict_types=1);

namespace KrnlWP;

use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

final class EventBus {
    public function __construct(private EventDispatcherInterface $dispatcher) {}
    public function dispatch(object $event): object { return $this->dispatcher->dispatch($event); }
}