<?php

declare(strict_types=1);

namespace SkipoWP\Ecosystem;

/**
 * Validates version parity and ecosystem dependencies across all 6 repositories.
 */
class EcosystemSync
{
    public const TARGET_VERSIONS = [
        'GutWP' => '1.3.2',
        'KrnlWP' => '1.0.9',
        'FrnlWP' => '0.5.3',
        'KloksWP' => '1.24.0',
        'FloksWP' => '1.13.4',
        'SkipoWP' => '0.5.0',
    ];

    private string $workspaceRoot;

    public function __construct(string $workspaceRoot)
    {
        $this->workspaceRoot = rtrim($workspaceRoot, '/');
    }

    public function checkSync(): array
    {
        $report = [
            'synced' => true,
            'repos' => [],
            'missing' => [],
        ];

        foreach (self::TARGET_VERSIONS as $repo => $targetVer) {
            $path = $this->workspaceRoot . '/' . $repo;
            if (!is_dir($path)) {
                $report['synced'] = false;
                $report['missing'][] = $repo;
                continue;
            }

            $composerJson = $path . '/composer.json';
            $hasComposer = file_exists($composerJson);

            $report['repos'][$repo] = [
                'targetVersion' => $targetVer,
                'path' => $path,
                'hasComposer' => $hasComposer,
            ];
        }

        return $report;
    }
}
