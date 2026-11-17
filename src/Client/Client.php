<?php

declare(strict_types=1);

namespace KloksWP\Client;
final class Client {
    public function __construct(private string $namespace='klokswp/v1'){}
    public function call(string $route,array $payload=[]):array{$r=wp_remote_post(rest_url($this->namespace.'/'.$route),['headers'=>['Content-Type'=>'application/json'],'body'=>wp_json_encode($payload)]);if(is_wp_error($r))throw new \RuntimeException($r->get_error_message());return json_decode((string)wp_remote_retrieve_body($r),true)?:[];}
}