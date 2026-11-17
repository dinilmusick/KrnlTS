<?php

declare(strict_types=1);

namespace FrnlWP\Validation;
final class Input {
    public static function requireString(mixed $value,string $name):string{if(!is_string($value)||trim($value)==='')throw new \InvalidArgumentException("$name must be a non-empty string");return $value;}
    public static function requireArray(mixed $value,string $name):array{if(!is_array($value))throw new \InvalidArgumentException("$name must be an array");return $value;}
}