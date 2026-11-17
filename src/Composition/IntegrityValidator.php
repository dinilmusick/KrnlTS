<?php
declare(strict_types=1);

namespace SkipoWP\Composition;

final class IntegrityValidator {
    public const LAYER_ORDER = [
        'gutwp'   => 0,
        'krnlwp'  => 1,
        'frnlwp'  => 2,
        'klokswp' => 3,
        'flokswp' => 4,
        'skipowp' => 5,
    ];

    /**
     * @param array<string, array<int, string>> $layers e.g. ['skipowp' => ['klokswp', 'flokswp']]
     * @return array<int, string> List of errors (empty if valid)
     */
    public function validateLayerDependencies(array $layers): array {
        $errors = [];
        foreach ($layers as $layer => $deps) {
            $layerKey = strtolower($layer);
            $layerRank = self::LAYER_ORDER[$layerKey] ?? null;

            if ($layerRank === null) {
                $errors[] = "Unknown layer in composition: '$layer'";
                continue;
            }

            foreach ($deps as $dep) {
                $depKey = strtolower($dep);
                $depRank = self::LAYER_ORDER[$depKey] ?? null;

                if ($depRank === null) {
                    $errors[] = "Unknown dependency '$dep' in layer '$layer'";
                    continue;
                }

                if ($depRank >= $layerRank) {
                    $errors[] = "Illegal upward or self dependency: '$layer' (rank $layerRank) cannot depend on '$dep' (rank $depRank).";
                }
            }
        }
        return $errors;
    }

    /**
     * @param string $directory Root directory to scan for PHP files
     * @param int $maxLines Maximum permitted lines per file (default 200)
     * @return array<int, string>
     */
    public function validateFileLimits(string $directory, int $maxLines = 200): array {
        $errors = [];
        if (!is_dir($directory)) return $errors;

        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($directory));
        foreach ($iterator as $file) {
            if (!$file->isFile() || $file->getExtension() !== 'php') continue;
            if (str_contains($file->getPathname(), DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR)) continue;

            $lines = count(file($file->getPathname()));
            if ($lines > $maxLines) {
                $errors[] = "{$file->getPathname()}: exceeds limit with $lines lines (max: $maxLines).";
            }
        }
        return $errors;
    }
}
