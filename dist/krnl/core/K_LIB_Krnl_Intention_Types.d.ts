export interface KrnlEventIntention {
    name: string;
    description: string;
    inputs: Record<string, string>;
    outputs: Record<string, string>;
}
export interface KrnlIntentionFunctionality {
    purpose: string;
    inputs: Record<string, string>;
    outputs: Record<string, string>;
    state: Record<string, string>;
    events: KrnlEventIntention[];
}
export interface KrnlIntentionLibraryCategory {
    name: string;
    purpose: string;
    data: Record<string, string>;
    functions: Record<string, string>;
}
export interface KrnlIntentionLibrary {
    purpose: string;
    categories: KrnlIntentionLibraryCategory[];
}
export interface KrnlIntentionEntity {
    purpose: string;
    functionalities: KrnlIntentionFunctionality[];
    componentEntities: KrnlIntentionEntity[];
}
export declare function buildEntityIntention(entity: any): KrnlIntentionEntity;
//# sourceMappingURL=K_LIB_Krnl_Intention_Types.d.ts.map