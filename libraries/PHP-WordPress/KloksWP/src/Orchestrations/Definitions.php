<?php

declare(strict_types=1);

namespace KloksWP\Orchestrations;
final class Definitions {
    public static function all():array {
        return [
            'kloks.orchestrator.a'=>[
                'id'=>'kloks.orchestrator.a','name'=>'OrchestratorA','version'=>'1.0.0','scope'=>'service',
                'dependencies'=>['kloks.service.a','kloks.service.b'],
                'steps'=>[
                    ['id'=>'step_math','target'=>'kloks.service.a','operation'=>'add'],
                    ['id'=>'step_counter','target'=>'kloks.service.b','operation'=>'increment','dependsOn'=>['step_math']]
                ]
            ],
            'kloks.orchestrator.b'=>[
                'id'=>'kloks.orchestrator.b','name'=>'OrchestratorB','version'=>'1.0.0','scope'=>'service',
                'dependencies'=>['kloks.service.b','kloks.service.c'],
                'steps'=>[
                    ['id'=>'step_counter','target'=>'kloks.service.b','operation'=>'increment'],
                    ['id'=>'step_telemetry','target'=>'kloks.service.c','operation'=>'publishReading','dependsOn'=>['step_counter']]
                ]
            ],
            'kloks.orchestrator.audioMidi'=>[
                'id'=>'kloks.orchestrator.audioMidi','name'=>'AudioMidiOrchestrator','version'=>'1.0.0','scope'=>'service',
                'dependencies'=>['kloks.midi.subsystem','kloks.audio.hardware'],
                'steps'=>[
                    ['id'=>'step_midi','target'=>'kloks.midi.subsystem','operation'=>'emitVirtualMidi'],
                    ['id'=>'step_audio','target'=>'kloks.audio.hardware','operation'=>'getState','dependsOn'=>['step_midi']]
                ]
            ]
        ];
    }
}