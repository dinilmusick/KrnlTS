declare function runValidate(projectRoot?: string): Promise<boolean>;

declare function runGenerate(type: string, name: string, _parentEntity?: string, projectRoot?: string): Promise<void>;

declare function generateMagneticDeclarations(projectRoot?: string): void;

export { generateMagneticDeclarations, runGenerate, runValidate };
