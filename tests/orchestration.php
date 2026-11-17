<?php

declare(strict_types=1);

if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require __DIR__ . '/../vendor/autoload.php';
} else {
    spl_autoload_register(function (string $class) {
        $prefix = 'KrnlWP\\';
        if (str_starts_with($class, $prefix)) {
            $file = __DIR__ . '/../src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
            if (file_exists($file)) require_once $file;
        }
    });
}

use KrnlWP\Orchestration\Executor;
use KrnlWP\Orchestration\FunctionalityOrchestration;

function expect($condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}

$flow = new FunctionalityOrchestration('test');
$flow->then('double')->then('add');
$result = (new Executor())->execute($flow, [
    'double' => fn(array $ctx) => $ctx['input']['value'] * 2,
    'add' => fn(array $ctx) => $ctx['step_0_double'] + 3,
], ['value' => 7]);
expect($result === 17, 'sequential execution failed');

$branch = new FunctionalityOrchestration('branch');
$branch->branch('decision', fn(array $ctx) => $ctx['input']['ok'], 'yes', 'no');
$result = (new Executor())->execute($branch, ['yes' => fn() => 'yes', 'no' => fn() => 'no'], ['ok' => true]);
expect($result['decision_then'] === 'yes' && $result['decision_else'] === null, 'branch execution failed');

$fan = new FunctionalityOrchestration('fan');
$fan->fanOut('items', 'square', fn(array $ctx) => $ctx['input']['items'], 2);
$result = (new Executor())->execute($fan, ['square' => fn($v) => $v * $v], ['items' => [1, 2, 3]]);
expect($result === [1, 4, 9], 'fanOut execution failed');

$retry = new FunctionalityOrchestration('retry');
$retry->then('flaky', ['retry' => ['maxAttempts' => 3, 'backoffMs' => 0]]);
$attempts = 0;
$result = (new Executor())->execute($retry, ['flaky' => function() use (&$attempts) {
    $attempts++;
    if ($attempts < 3) throw new RuntimeException('retry');
    return 'ok';
}], []);
expect($result === 'ok' && $attempts === 3, 'retry execution failed');

// Saga compensation test
$saga = new FunctionalityOrchestration('saga');
$compensated = false;
$saga->then('step1', ['compensation' => function() use (&$compensated) { $compensated = true; }]);
$saga->then('step2');
try {
    (new Executor())->execute($saga, [
        'step1' => fn() => 'ok1',
        'step2' => fn() => throw new RuntimeException('step2 error'),
    ], []);
    throw new RuntimeException('should fail');
} catch (RuntimeException $e) {
    expect(str_contains($e->getMessage(), 'step2 error'), 'error propagated');
    expect($compensated === true, 'compensation executed');
}

echo "orchestration tests: OK\n";
