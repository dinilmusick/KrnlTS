<?php

declare(strict_types=1);

namespace KloksWP\AudioMidi;
final class MidiMessage {
    public function __construct(public readonly int $status,public readonly int $data1,public readonly int $data2=0){}
    public function bytes():array{return [$this->status,$this->data1,$this->data2];}
}