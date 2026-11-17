<?php

declare(strict_types=1);

namespace SkipoWP;

final class Manifest {
    public function __construct(public readonly string $name,public readonly string $type='wordpress-plugin',public readonly array $features=[]) {}
    public static function fromArray(array $data): self {
        return new self((string)($data['name']??'App'),(string)($data['type']??'wordpress-plugin'),(array)($data['features']??[]));
    }
    public function toArray(): array { return ['name'=>$this->name,'type'=>$this->type,'features'=>$this->features]; }
}