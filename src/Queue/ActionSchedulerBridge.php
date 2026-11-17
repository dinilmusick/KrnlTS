<?php

declare(strict_types=1);

namespace KrnlWP\Queue;

final class ActionSchedulerBridge {
    public function __construct(private \Closure $handler) {}
    public function register(): void {
        add_action('krnlwp_queue_message',function(array $job): void {
            ($this->handler)($job['class']??null,$job['payload']??null);
        },10,1);
    }
}