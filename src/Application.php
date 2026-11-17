<?php

declare(strict_types=1);

namespace SkipoWP;

final class Application {
    public const VERSION = '0.5.0';
    public function __construct(private Manifest $manifest) {}
    public function manifest(): Manifest { return $this->manifest; }
    public function validate(): array {
        $errors=[];
        if ($this->manifest->name==='') $errors[]='Application name is required';
        if (!in_array($this->manifest->type,['wordpress-plugin','wordpress-theme'],true)) $errors[]='Unsupported application type';
        return $errors;
    }
}