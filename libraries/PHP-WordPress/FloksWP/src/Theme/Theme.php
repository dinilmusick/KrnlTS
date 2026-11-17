<?php

declare(strict_types=1);

namespace FloksWP\Theme;
final class Theme {
    public function __construct(private array $components=[]){}
    public function parameters(string $component,string $state='idle'):array{return $this->components[$component][$state]??[];}
    public function define(string $component,string $state,array $parameters):void{$this->components[$component][$state]=$parameters;}
}