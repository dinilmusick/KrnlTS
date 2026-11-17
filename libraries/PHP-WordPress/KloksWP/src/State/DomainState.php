<?php

declare(strict_types=1);

namespace KloksWP\State;
final class DomainState extends State {
    public function transition(string $from,string $to,array $allowed):void{if(!in_array($to,$allowed,true))throw new \RuntimeException("Invalid domain transition");$this->set('state',$to);}
}