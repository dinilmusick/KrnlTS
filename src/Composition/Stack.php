<?php

declare(strict_types=1);

namespace SkipoWP\Composition;
final class Stack {
    public static function standard():Graph{
        $g=new Graph();
        $g->add('GutWP');
        $g->add('KrnlWP',['GutWP']);
        $g->add('FrnlWP',['GutWP']);
        $g->add('KloksWP',['KrnlWP','GutWP']);
        $g->add('FloksWP',['FrnlWP','KloksWP']);
        $g->add('SkipoWP',['GutWP','KrnlWP','FrnlWP','KloksWP','FloksWP']);
        return $g;
    }
}