<?php

declare(strict_types=1);

namespace KrnlWP\Runtime;

final class Lifecycle {
    public const UNINITIALIZED='uninitialized';
    public const INITIALIZING='initializing';
    public const READY='ready';
    public const STARTING='starting';
    public const RUNNING='running';
    public const STOPPING='stopping';
    public const STOPPED='stopped';

    /** @return list<string> */
    public static function transitions(string $state): array {
        return match ($state) {
            self::UNINITIALIZED => [self::INITIALIZING],
            self::INITIALIZING => [self::READY],
            self::READY => [self::STARTING],
            self::STARTING => [self::RUNNING],
            self::RUNNING => [self::STOPPING],
            self::STOPPING => [self::STOPPED],
            self::STOPPED => [self::STARTING],
            default => [],
        };
    }

    public static function canTransition(string $from,string $to): bool {
        return in_array($to,self::transitions($from),true);
    }
}