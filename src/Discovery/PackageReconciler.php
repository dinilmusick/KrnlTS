<?php

declare(strict_types=1);

namespace KrnlWP\Discovery;
final class PackageReconciler {
    public function diff(array $declared,array $installed): array {
        return ['missing'=>array_values(array_diff(array_keys($declared),array_keys($installed))),
                'extra'=>array_values(array_diff(array_keys($installed),array_keys($declared)))];
    }
}