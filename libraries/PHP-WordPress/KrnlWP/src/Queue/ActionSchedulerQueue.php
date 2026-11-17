<?php

declare(strict_types=1);

namespace KrnlWP\Queue;

final class ActionSchedulerQueue implements Queue {
    public function dispatch(object $message): string {
        if (!function_exists('as_enqueue_async_action')) {
            throw new \RuntimeException('Action Scheduler is not loaded');
        }
        $id=as_enqueue_async_action(
            'krnlwp_queue_message',
            ['class'=>$message::class,'payload'=>$message],
            'krnlwp'
        );
        if (!$id) throw new \RuntimeException('Queue dispatch failed');
        return (string)$id;
    }
}