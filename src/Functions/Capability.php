<?php

declare(strict_types=1);

namespace KloksWP\Functions;

final class Capability {
    public static function require(string $capability,int $userId=0): void {
        if (!user_can($userId ?: get_current_user_id(),$capability)) {
            throw new \RuntimeException('Missing capability: '.$capability);
        }
    }
}