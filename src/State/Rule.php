<?php

declare(strict_types=1);

namespace KloksWP\State;
final class Rule {
    public function __construct(public readonly string $id,private readonly \Closure $when,private readonly \Closure $then){}
    public function apply(mixed $value):mixed{return ($this->when)($value)?($this->then)($value):$value;}
}