<?php

declare(strict_types=1);

namespace KrnlWP\Validation;

/**
 * Validates a PHP project against Krnl architectural rules & paradigms.
 */
class KrnlValidatorEngine
{
    private string $projectRoot;
    private int $maxFileLineLimit;
    private int $maxHelperLineLimit;

    public function __construct(string $projectRoot, array $options = [])
    {
        $this->projectRoot = rtrim($projectRoot, '/');
        $this->maxFileLineLimit = (int) ($options['maxFileLineLimit'] ?? 200);
        $this->maxHelperLineLimit = (int) ($options['maxHelperLineLimit'] ?? 30);
    }

    public function validateAll(): array
    {
        $files = $this->collectPhpFiles($this->projectRoot);
        $errors = [];
        $warnings = [];
        $promotableAssets = [];

        if (!file_exists($this->projectRoot . '/composer.json')) {
            $errors[] = [
                'ruleId' => 'WORKSPACE_COMPOSER_MISSING',
                'filePath' => 'composer.json',
                'message' => 'Project root must contain a composer.json file',
            ];
        }

        foreach ($files as $file) {
            $report = $this->validateFile($file);
            $errors = array_merge($errors, $report['errors']);
            $warnings = array_merge($warnings, $report['warnings']);
            if (!empty($report['promotableAssets'])) {
                $promotableAssets = array_merge($promotableAssets, $report['promotableAssets']);
            }
        }

        return [
            'valid' => count($errors) === 0,
            'totalFiles' => count($files),
            'errors' => $errors,
            'warnings' => $warnings,
            'promotableAssets' => $promotableAssets,
        ];
    }

    public function validateFile(string $filePath): array
    {
        $errors = [];
        $warnings = [];
        $promotableAssets = [];
        $content = file_get_contents($filePath);
        if ($content === false) {
            return ['errors' => [['ruleId' => 'READ_ERROR', 'filePath' => $filePath, 'message' => 'Unable to read file']], 'warnings' => []];
        }

        $lines = explode("\n", $content);
        $lineCount = count($lines);

        // 1. File Limits Rule
        if ($lineCount > $this->maxFileLineLimit) {
            $errors[] = [
                'ruleId' => 'FILE_LIMIT_EXCEEDED',
                'filePath' => $filePath,
                'message' => "File exceeds maximum {$this->maxFileLineLimit} lines (actual: {$lineCount})",
            ];
        }

        // 2. Strict Types & Component Rules
        if (!str_contains($content, 'declare(strict_types=1);')) {
            $warnings[] = [
                'ruleId' => 'STRICT_TYPES_MISSING',
                'filePath' => $filePath,
                'message' => 'File should declare strict_types=1 at top',
            ];
        }

        // 3. Orchestration compensation rule
        if (str_contains($content, 'FunctionalityOrchestration') && !str_contains($content, 'compensat')) {
            $warnings[] = [
                'ruleId' => 'ORCHESTRATION_SAGA_RECOMMENDED',
                'filePath' => $filePath,
                'message' => 'Orchestrations should register compensation handlers for Saga rollback',
            ];
        }

        // 4. Scoped Library check
        if (str_contains($filePath, '/Libraries/') || str_contains($filePath, '/Utils/')) {
            $baseName = basename($filePath, '.php');
            $promotableAssets[] = [
                'name' => $baseName,
                'scope' => 'local',
                'target' => 'GutWP',
                'filePath' => $filePath,
            ];
        }

        return [
            'errors' => $errors,
            'warnings' => $warnings,
            'promotableAssets' => $promotableAssets,
        ];
    }

    private function collectPhpFiles(string $dir): array
    {
        if (!is_dir($dir)) {
            return [];
        }

        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $item) {
            if ($item->isFile() && $item->getExtension() === 'php') {
                $path = $item->getPathname();
                if (!str_contains($path, '/vendor/') && !str_contains($path, '/.git/')) {
                    $files[] = $path;
                }
            }
        }

        sort($files);
        return $files;
    }
}
