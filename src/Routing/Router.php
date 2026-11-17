<?php

declare(strict_types=1);

namespace FrnlWP\Routing;
final class Router {
    public function __construct(private array $routes=[]){}
    public function add(string $id,string $pattern,?callable $load=null):void{if(isset($this->routes[$id]))throw new \RuntimeException("Duplicate route id: $id");$this->routes[$id]=['pattern'=>$pattern,'load'=>$load];}
    public function get(string $id):?array{return $this->routes[$id]??null;}
    public function list():array{return $this->routes;}
    public function match(string $url):?array{$u=parse_url($url);$path=$u['path']??'/';$query=[];parse_str($u['query']??'',$query);foreach($this->routes as $id=>$route){$pattern=$route['pattern']?:'/';$pattern=preg_replace_callback('/\{([a-zA-Z0-9_]+)\}/',fn($m)=>'(?P<'.$m[1].'>[^/]+)',$pattern);$pattern=preg_replace('/\*([a-zA-Z0-9_]*)/','(?P<wildcard>.*)',$pattern);if(preg_match('#^'.rtrim($pattern,'/').'/?$#',$path,$m))return ['id'=>$id,'params'=>array_filter($m,'is_string',ARRAY_FILTER_USE_KEY),'query'=>$query,'path'=>$path];}return null;}
    public function url(string $id,array $params=[],array $query=[]):string{$route=$this->routes[$id]??throw new \RuntimeException("Unknown route");$path=preg_replace_callback('/\{([a-zA-Z0-9_]+)\}/',fn($m)=>rawurlencode((string)($params[$m[1]]??throw new \InvalidArgumentException("Missing parameter: {$m[1]}"))),$route['pattern']);if(str_contains($path,'*'))$path=str_replace('*',implode('/',array_map('rawurlencode',explode('/',(string)($params['wildcard']??'')))),$path);return $query?$path.'?'.http_build_query($query):$path;}
    public function resolve(string $url):?array{$match=$this->match($url);if(!$match)return null;$load=$this->routes[$match['id']]['load']??null;return $match+['data'=>$load?$load():null];}
}