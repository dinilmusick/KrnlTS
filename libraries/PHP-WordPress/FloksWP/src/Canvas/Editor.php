<?php

declare(strict_types=1);

namespace FloksWP\Canvas;
final class Editor {
    public function __construct(private string $content=''){}
    public function content():string{return $this->content;}
    public function setContent(string $content):void{$this->content=$content;}
}