<?php

declare(strict_types=1);

namespace FloksWP\Canvas;
final class Predictive {
    public function rank(array $candidates,callable $score):array{usort($candidates,fn($a,$b)=>$score($b)<=>$score($a));return $candidates;}
}