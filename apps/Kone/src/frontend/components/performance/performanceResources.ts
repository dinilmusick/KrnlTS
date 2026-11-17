import type {CodeBlockDefinition,MotifDefinition,SoundDefinition,SoundGroupDefinition,PerformanceDefinition,SongDefinition,SectionDefinition} from './performanceDomain.js';
export interface ScopedResource<T>{resource:T;scope:'section'|'song'|'performance';inherited:boolean}
export function codeBlocksFor(performance:PerformanceDefinition,song?:SongDefinition,section?:SectionDefinition):ScopedResource<CodeBlockDefinition>[]{
 const result:ScopedResource<CodeBlockDefinition>[] = performance.codeBlocks.map(resource=>({resource,scope:'performance',inherited:true}));
 if(song) result.push(...song.codeBlocks.map(resource=>({resource,scope:'song' as const,inherited:!section})));
 if(section) result.push(...section.codeBlocks.map(resource=>({resource,scope:'section' as const,inherited:false})));
 return result;
}
export function motifsFor(performance:PerformanceDefinition,song?:SongDefinition,section?:SectionDefinition):ScopedResource<MotifDefinition>[]{
 const result:ScopedResource<MotifDefinition>[] = performance.motifs.map(resource=>({resource,scope:'performance',inherited:true}));
 if(song) result.push(...song.motifs.map(resource=>({resource,scope:'song' as const,inherited:true})));
 if(section) result.push(...section.motifs.map(resource=>({resource,scope:'section' as const,inherited:false})));
 return result;
}
export function soundsFor(performance:PerformanceDefinition,song?:SongDefinition):ScopedResource<SoundDefinition>[]{
 const result:ScopedResource<SoundDefinition>[] = performance.sounds.map(resource=>({resource,scope:'performance',inherited:true}));
 if(song) result.push(...song.sounds.map(resource=>({resource,scope:'song' as const,inherited:false})));
 return result;
}
export function soundGroupsFor(performance:PerformanceDefinition,song?:SongDefinition):ScopedResource<SoundGroupDefinition>[]{
 const result:ScopedResource<SoundGroupDefinition>[] = performance.soundGroups.map(resource=>({resource,scope:'performance',inherited:true}));
 if(song) result.push(...song.soundGroups.map(resource=>({resource,scope:'song' as const,inherited:false})));
 return result;
}
export function resolveSound(performance:PerformanceDefinition,song:SongDefinition|undefined,soundId:string):{sound:SoundDefinition;group?:SoundGroupDefinition;scope:'performance'|'song'}|undefined{
 const songSound=song?.sounds.find(sound=>sound.id===soundId); if(songSound)return{sound:songSound,group:song.soundGroups.find(group=>group.id===songSound.soundGroupId),scope:'song'};
 const performanceSound=performance.sounds.find(sound=>sound.id===soundId); if(performanceSound)return{sound:performanceSound,group:performance.soundGroups.find(group=>group.id===performanceSound.soundGroupId),scope:'performance'};
 return undefined;
}