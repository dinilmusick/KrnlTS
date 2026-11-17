<?php

declare(strict_types=1);

namespace KloksWP\Backend;
final class ControlPlaneService {
    public function health():array{return ['status'=>'ok','wordpress'=>get_bloginfo('version'),'php'=>PHP_VERSION];}
    public function capabilities():array{return ['rest'=>true,'cron'=>defined('DISABLE_WP_CRON')? !DISABLE_WP_CRON:true,'elementor'=>class_exists('Elementor\\Plugin')];}
}