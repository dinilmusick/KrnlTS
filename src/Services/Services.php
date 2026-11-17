<?php

declare(strict_types=1);

namespace KloksWP\Services;
use KrnlWP\Service\WordPressService;
final class Services {
    public static function create(string $id):WordPressService{return ServiceFactory::create($id);}
    public static function ids():array{return ['kloks.service.a','kloks.service.b','kloks.service.c','kloks.service.d'];}
}