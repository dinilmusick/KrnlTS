<?php

declare(strict_types=1);

namespace KloksWP\Services;

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class HttpService {
    private HttpClientInterface $client;
    public function __construct() { $this->client=HttpClient::create(); }
    public function request(string $method,string $url,array $options=[]): array {
        return $this->client->request($method,$url,$options)->toArray(false);
    }
}