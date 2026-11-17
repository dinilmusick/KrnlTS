<?php

declare(strict_types=1);

namespace FrnlWP\Core;
final class Fault extends \RuntimeException {
    public function __construct(string $message,public readonly string $codeId='FRNL_ERROR',public readonly bool $recoverable=false,public readonly bool $retryable=false,?\Throwable $previous=null){parent::__construct($message,0,$previous);}
}