<?php

declare(strict_types=1);

namespace KloksWP\State;
final class Spatial {
    public function __construct(public readonly float $x=0,public readonly float $y=0){}
    public function distance(self $other):float{return hypot($this->x-$other->x,$this->y-$other->y);}
}