<?php

declare(strict_types=1);

namespace KloksWP\AudioMidi;
final class Clock {
    public function __construct(private float $bpm=120.0){}
    public function bpm():float{return $this->bpm;}
    public function beatSeconds():float{return 60.0/$this->bpm;}
}