<?php

declare(strict_types=1);

namespace KloksWP\Services;
use KrnlWP\Service\WordPressService;
final class ServiceFactory {
    public static function create(string $id):WordPressService{return match($id){
        'kloks.service.a'=>ServiceA::create(),'kloks.service.b'=>ServiceB::create(),'kloks.service.c'=>ServiceC::create(),'kloks.service.d'=>ServiceD::create(),
        default=>throw new \InvalidArgumentException("Unknown Kloks service: $id")
    };}
}