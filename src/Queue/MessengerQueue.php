<?php

declare(strict_types=1);

namespace KrnlWP\Queue;

use Symfony\Component\Messenger\Envelope;
use Symfony\Component\Messenger\MessageBusInterface;

final class MessengerQueue implements Queue {
    public function __construct(private MessageBusInterface $bus) {}
    public function dispatch(object $message): string {
        $id=bin2hex(random_bytes(12));
        $this->bus->dispatch(new Envelope($message));
        return $id;
    }
}