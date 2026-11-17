<?php

declare(strict_types=1);

namespace KrnlWP\Queue;

interface Queue {
    public function dispatch(object $message): string;
}