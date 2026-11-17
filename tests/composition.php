<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Manifest.php';
require_once __DIR__ . '/../src/Composition/Graph.php';
require_once __DIR__ . '/../src/Composition/Stack.php';
require_once __DIR__ . '/../src/Composition/ApplicationBuilder.php';
require_once __DIR__ . '/../src/Composition/IntegrityValidator.php';
require_once __DIR__ . '/../src/Backend/BackendFacade.php';

function expect(bool $cond, string $msg): void {
    if (!$cond) throw new \RuntimeException("Assertion failed: $msg");
}

use SkipoWP\Manifest;
use SkipoWP\Composition\ApplicationBuilder;
use SkipoWP\Composition\IntegrityValidator;
use SkipoWP\Backend\BackendFacade;

// 1. Manifest test
$manifest = new Manifest('test-app', 'wordpress-plugin', ['rest-api', 'admin-settings']);
expect($manifest->name === 'test-app', 'manifest name');
expect($manifest->toArray()['type'] === 'wordpress-plugin', 'manifest toArray');

// 2. ApplicationBuilder test
$builder = new ApplicationBuilder();
$builder->layer('gutwp');
$builder->layer('krnlwp', ['gutwp']);
$builder->layer('klokswp', ['krnlwp']);
$build = $builder->build($manifest);
expect(in_array('gutwp', $build['order'], true), 'order contains gutwp');

// 3. IntegrityValidator test
$validator = new IntegrityValidator();
$validLayers = [
    'krnlwp'  => ['gutwp'],
    'klokswp' => ['krnlwp'],
    'skipowp' => ['klokswp', 'flokswp'],
];
$errors = $validator->validateLayerDependencies($validLayers);
expect(empty($errors), 'valid layer dependencies pass');

$invalidLayers = [
    'gutwp' => ['klokswp'], // illegal upward dependency
];
$badErrors = $validator->validateLayerDependencies($invalidLayers);
expect(!empty($badErrors), 'catches illegal upward dependency');

// 4. BackendFacade test
$facade = new BackendFacade();
$mockDef = (object)[
    'operations' => [
        'calculate' => fn($in) => ($in['val'] ?? 0) * 2,
    ],
    'orchestrations' => [],
    'libraries' => [],
];
$mockService = new class($mockDef) {
    public function __construct(private object $def) {}
    public function id(): string { return 'svc.math'; }
    public function name(): string { return 'MathService'; }
    public function getDefinition(): object { return $this->def; }
    public function call(string $op, mixed $in = null): mixed {
        return ($this->def->operations[$op])($in);
    }
};

$facade->registerService($mockService);
expect($facade->hasCapability('calculate'), 'facade has calculate capability');
expect($facade->executeCapability('calculate', ['val' => 21]) === 42, 'facade executes calculate');
expect(in_array('svc.math', $facade->listServices(), true), 'listServices includes svc.math');

require_once __DIR__ . '/../src/Execution/SkipoExecutionEngine.php';
require_once __DIR__ . '/../src/Ecosystem/EcosystemSync.php';
require_once __DIR__ . '/../src/Aiko/AikoBridge.php';
require_once __DIR__ . '/../src/Fod/FodBridge.php';

// 5. SkipoExecutionEngine test
$engine = new \SkipoWP\Execution\SkipoExecutionEngine();
$engine->bootstrapAll();
expect($engine->getLoadedLayers() === \SkipoWP\Execution\SkipoExecutionEngine::LAYERS, 'engine bootstraps all 6 layers');
$cmdRes = $engine->executeCommand('build', ['target' => 'production']);
expect($cmdRes['status'] === 'success', 'engine executes command');

// 6. EcosystemSync test
$sync = new \SkipoWP\Ecosystem\EcosystemSync(dirname(__DIR__, 2));
$syncReport = $sync->checkSync();
expect(isset($syncReport['repos']['GutWP']), 'ecosystem tracks GutWP');
expect(isset($syncReport['repos']['KrnlWP']), 'ecosystem tracks KrnlWP');

// 7. AikoBridge & FodBridge test
$aikoBridge = new \SkipoWP\Aiko\AikoBridge();
$task = $aikoBridge->dispatchAgentTask('Researcher', 'Analyze code');
expect($task['agentRole'] === 'Researcher', 'AikoBridge dispatches task');

$fodBridge = new \SkipoWP\Fod\FodBridge();
$flowRes = $fodBridge->executeFlow(['id' => 'flow-1', 'nodes' => [1, 2]]);
expect($flowRes['flowId'] === 'flow-1' && $flowRes['nodesExecuted'] === 2, 'FodBridge executes flow');

echo "All SkipoWP composition, backend facade, execution engine, ecosystem, and AI bridge tests passed successfully!\n";
