import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // ── Scope: dónde vive cada proyecto ──
            // Las librerías compartidas solo dependen de librerías compartidas.
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            // Las apps demo pueden consumir cualquier librería compartida.
            {
              sourceTag: 'scope:demo',
              onlyDependOnLibsWithTags: ['scope:demo', 'scope:shared'],
            },
            {
              sourceTag: 'scope:cms-demo',
              onlyDependOnLibsWithTags: ['scope:cms-demo', 'scope:shared'],
            },

            // ── Capas: la pirámide de dependencias ──
            // foundation (theme, models) → no depende de nadie por encima.
            {
              sourceTag: 'type:foundation',
              onlyDependOnLibsWithTags: ['type:foundation'],
            },
            // feature (componentes) → solo de los fundamentos.
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:foundation', 'type:feature'],
            },
            // composition (combinan libs) → de fundamentos, features y otras composiciones.
            {
              sourceTag: 'type:composition',
              onlyDependOnLibsWithTags: [
                'type:foundation',
                'type:feature',
                'type:composition',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
