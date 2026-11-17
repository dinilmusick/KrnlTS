<?php

declare(strict_types=1);

namespace FrnlWP\Validation;

/**
 * Validates Frnl component definitions, templates, and theme structures.
 */
class FrnlValidatorEngine
{
    private string $projectRoot;
    private int $maxFileLineLimit;

    public function __construct(string $projectRoot, array $options = [])
    {
        $this->projectRoot = rtrim($projectRoot, '/');
        $this->maxFileLineLimit = (int) ($options['maxFileLineLimit'] ?? 200);
    }

    public function validateAll(): array
    {
        $files = $this->collectPhpFiles($this->projectRoot);
        $errors = [];
        $warnings = [];

        foreach ($files as $file) {
            $report = $this->validateFile($file);
            $errors = array_merge($errors, $report['errors']);
            $warnings = array_merge($warnings, $report['warnings']);
        }

        return [
            'valid' => count($errors) === 0,
            'totalFiles' => count($files),
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    public function validateFile(string $filePath): array
    {
        $errors = [];
        $warnings = [];
        $content = file_get_contents($filePath);
        if ($content === false) {
            return ['errors' => [['ruleId' => 'READ_ERROR', 'filePath' => $filePath, 'message' => 'Unable to read file']], 'warnings' => []];
        }

        $lines = explode("\n", $content);
        $lineCount = count($lines);

        // 1. File Limit Rule
        if ($lineCount > $this->maxFileLineLimit) {
            $errors[] = [
                'ruleId' => 'FRNL_FILE_LIMIT_EXCEEDED',
                'filePath' => $filePath,
                'message' => "File exceeds {$this->maxFileLineLimit} lines (actual: {$lineCount})",
            ];
        }

        // 2. Strict Types
        if (!str_contains($content, 'declare(strict_types=1);')) {
            $warnings[] = [
                'ruleId' => 'STRICT_TYPES_MISSING',
                'filePath' => $filePath,
                'message' => 'File should declare strict_types=1',
            ];
        }

        // 3. Component Accessibility
        if (str_contains($content, 'Component') && str_contains($content, 'render') && !str_contains($content, 'aria-') && !str_contains($content, 'role')) {
            $warnings[] = [
                'ruleId' => 'ACCESSIBILITY_HINT',
                'filePath' => $filePath,
                'message' => 'UI components should render semantic accessibility attributes (role or aria)',
            ];
        }

        return ['errors' => $errors, 'warnings' => $warnings];
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
