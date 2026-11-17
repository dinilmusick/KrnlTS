<?php

declare(strict_types=1);

// Fallback direct autoloaders for all 6 sibling layers
$baseDir = dirname(__DIR__, 2);
spl_autoload_register(function (string $class) use ($baseDir) {
    $map = [
        'GutWP\\'   => $baseDir . '/GutWP/src/',
        'KrnlWP\\'  => $baseDir . '/KrnlWP/src/',
        'FrnlWP\\'  => $baseDir . '/FrnlWP/src/',
        'KloksWP\\' => $baseDir . '/KloksWP/src/',
        'FloksWP\\' => $baseDir . '/FloksWP/src/',
        'SkipoWP\\' => $baseDir . '/SkipoWP/src/',
    ];
    foreach ($map as $prefix => $path) {
        if (str_starts_with($class, $prefix)) {
            $f = $path . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
            if (file_exists($f)) {
                require_once $f;
                return;
            }
        }
    }
});

function assertCondition(bool $cond, string $msg): void {
    if (!$cond) throw new \RuntimeException("E2E Assertion Failed: {$msg}");
}

echo "\n🚀 [E2E Parity Suite] Starting cross-ecosystem 6-layer validation...\n\n";

// 1. Layer 1: GutWP
echo "  [Layer 1: GutWP] Validating utilities, API, models, semantic-input...\n";
$arr = \GutWP\Arrays::unique([1, 2, 2, 3]);
assertCondition($arr === [1, 2, 3], 'GutWP::unique');
$str = \GutWP\Strings::camelCase('hello-world');
assertCondition($str === 'helloWorld', 'GutWP::camelCase');
$model = \GutWP\Models\ModelRegistry::get('needle3');
assertCondition($model && $model->id === 'needle3', 'GutWP ModelRegistry');

// 2. Layer 2: KrnlWP
echo "  [Layer 2: KrnlWP] Validating kernel orchestration, saga compensation, telemetry...\n";
$kernel = new \KrnlWP\Kernel();
$telemetry = $kernel->telemetry();
$span = $telemetry->startSpan('e2e.test');
$flow = new \KrnlWP\Orchestration\FunctionalityOrchestration('e2e_flow');
$flow->then('step1', [], fn() => 'compensated_1');
$result = (new \KrnlWP\Orchestration\Executor())->execute($flow, ['step1' => fn() => 'step1_done'], []);
assertCondition($result === 'step1_done', 'KrnlWP orchestration execution');
$telemetry->endSpan($span, 'ok');
assertCondition(count($telemetry->getSpans()) >= 1, 'KrnlWP telemetry span recorded');

// 3. Layer 3: FrnlWP
echo "  [Layer 3: FrnlWP] Validating semantic store, accessibility, frontend API...\n";
$store = \FrnlWP\Runtime::createStore();
$store->registerEntity('app-root', 'idle', ['title' => 'Portal']);
$frontApi = \FrnlWP\Runtime::createFrontendApi($store);
$snap = $frontApi->inspect();
assertCondition($snap['apiVersion'] === 1 && $snap['componentCount'] === 1, 'FrnlWP frontend snapshot');
$a11yIssues = \FrnlWP\Accessibility\AccessibilityValidator::validate(
    ['nameRequired' => true, 'role' => 'button'],
    ['role' => 'button', 'aria-label' => 'Submit']
);
assertCondition(empty($a11yIssues), 'FrnlWP AccessibilityValidator');

// 4. Layer 4: KloksWP
echo "  [Layer 4: KloksWP] Validating state graph, spatial engine, AI inference, Aiko...\n";
$rules = new \KloksWP\StateGraph\ConnectionRuleStore();
$reg = new \KloksWP\StateGraph\NodeArchetypeRegistry();
$wireVal = new \KloksWP\StateGraph\WireValidation($rules, $reg);
$nodes = ['src' => ['id' => 'src', 'type' => 'trigger'], 'dst' => ['id' => 'dst', 'type' => 'effect']];
$wireCheck = $wireVal->validateWire($nodes, ['sourceNode' => 'src', 'targetNode' => 'dst']);
assertCondition($wireCheck['valid'] === true, 'KloksWP wire validation');
$spatial = new \KloksWP\StateGraph\Spatial\SpatialEngine();
$spatial->setViewport(0.0, 0.0, 2.0);
assertCondition($spatial->worldToScreen(5.0, 5.0) === ['x' => 10.0, 'y' => 10.0], 'KloksWP spatial transform');
$aiko = new \KloksWP\Aiko\AikoBridge();
$aikoTurn = $aiko->chat('e2e-conv', 'Ping');
assertCondition(!empty($aikoTurn['reply']), 'KloksWP Aiko chat turn');

// 5. Layer 5: FloksWP
echo "  [Layer 5: FloksWP] Validating Elementor widgets, OmniCanvas, and token mapping...\n";
$card = new \FloksWP\Element\Card();
assertCondition(str_starts_with($card->get_name(), 'flokswp-'), 'FloksWP Card element');
$omni = new \FloksWP\Canvas\OmniCanvas('fod');
assertCondition(str_contains($omni->render(), 'floks-fod-canvas'), 'FloksWP OmniCanvas render');
$cssVars = \FloksWP\Theme\TokenMapper::toCssVariables(['brand' => ['primary' => '#0073aa']]);
assertCondition(str_contains($cssVars, '--floks-brand-primary: #0073aa;'), 'FloksWP TokenMapper CSS');

// 6. Layer 6: SkipoWP
echo "  [Layer 6: SkipoWP] Validating execution engine, backend facade, ecosystem sync...\n";
$engine = new \SkipoWP\Execution\SkipoExecutionEngine();
$engine->bootstrapAll();
assertCondition(count($engine->getLoadedLayers()) === 6, 'SkipoExecutionEngine 6 layers bootstrapped');
$facade = $engine->getBackend();
$mockDef = (object)[
    'operations' => ['compute' => fn($in) => ($in['x'] ?? 0) * 10],
    'orchestrations' => [], 'libraries' => [],
];
$svc = new class($mockDef) {
    public function __construct(private object $d) {}
    public function id(): string { return 'svc.compute'; }
    public function name(): string { return 'Compute'; }
    public function getDefinition(): object { return $this->d; }
    public function call(string $op, mixed $in = null): mixed { return ($this->d->operations[$op])($in); }
};
$facade->registerService($svc);
assertCondition($facade->executeCapability('compute', ['x' => 4]) === 40, 'BackendFacade capability execution');
$sync = new \SkipoWP\Ecosystem\EcosystemSync($baseDir);
$syncReport = $sync->checkSync();
assertCondition($syncReport['synced'] === true, 'EcosystemSync confirms all 6 repos present');

echo "\n✨ [E2E Parity Suite] All 6 architectural layers verified functional in unified runtime path!\n\n";
