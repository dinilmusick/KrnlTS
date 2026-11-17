<?php

declare(strict_types=1);

namespace KloksWP\Backend;
final class ApiService {
    public function register(string $route,callable $callback,string $namespace='klokswp/v1',callable $permissionCallback):void{
        register_rest_route($namespace,$route,['methods'=>'POST','callback'=>$callback,'permission_callback'=>$permissionCallback]);
    }
}