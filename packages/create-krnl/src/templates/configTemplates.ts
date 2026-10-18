export function getBasePackageJson(projectName: string): string {
  return JSON.stringify(
    {
      name: projectName,
      version: '1.0.0',
      description: 'Full-stack application powered by Krnl symmetric architecture',
      type: 'module',
      main: 'dist/index.js',
      scripts: {
        dev: 'krnl dev',
        build: 'krnl build',
        validate: 'krnl validate',
        test: 'vitest run',
        sync: 'krnl sync',
      },
      dependencies: {
        '@ultrst-armada/krnl': '^1.0.0',
        '@ultrst-armada/krnl-core': '^1.0.0',
        'react': '^18.3.1',
      },
      devDependencies: {
        '@types/node': '^22.0.0',
        '@types/react': '^18.3.1',
        '@ultrst-armada/krnl-cli': '^1.0.0',
        '@ultrst-armada/krnl-validate': '^1.0.0',
        typescript: '^5.7.3',
        vitest: '^1.6.0',
      },
    },
    null,
    2
  );
}

export function getTsConfig(projectName: string): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ESNext',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        lib: ['ESNext', 'DOM'],
        jsx: 'react-jsx',
        strict: true,
        outDir: './dist',
        skipLibCheck: true,
        resolveJsonModule: true,
        paths: {
          '@/*': ['./krnl/*'],
        },
      },
      include: ['krnl/**/*', `${projectName}.ts`, 'krnl-magnetic.d.ts'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2
  );
}

export function getAppEntrypoint(projectName: string): string {
  const safeIdentifier = projectName.replace(/[^a-zA-Z0-9_$]/g, '_');
  return `import { AppServiceFacade } from "./krnl/backend/services/App/AppServiceFacade.js";

export const services = {
  app: AppServiceFacade,
};

export const ${safeIdentifier}Backend = {
  services,
};

export default AppServiceFacade;
`;
}
