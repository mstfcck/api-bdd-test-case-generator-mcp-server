#!/usr/bin/env node
/**
 * Verification script for API BDD Test Case Generator MCP Server
 * Validates the clean architecture build and configuration
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

console.log('🔍 Verifying API BDD Test Case Generator MCP Server...\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Build directory exists
console.log('✓ Checking build output...');
const distPath = resolve('./dist');
if (!existsSync(distPath)) {
    console.error('❌ dist/ directory not found. Run: npm run build');
    hasErrors = true;
} else {
    console.log('  ✅ dist/ directory exists');
}

// Check 2: Clean architecture structure
console.log('\n✓ Checking clean architecture build structure...');
const requiredDirs = [
    './dist',
    './dist/domain',
    './dist/application',
    './dist/infrastructure',
    './dist/shared',
    './dist/di'
];

for (const dir of requiredDirs) {
    if (!existsSync(resolve(dir))) {
        console.error(`❌ ${dir} not found`);
        hasErrors = true;
    } else {
        console.log(`  ✅ ${dir}`);
    }
}

// Check 3: Entry point exists
console.log('\n✓ Checking entry point...');
const entryPoint = './dist/index.js';
if (!existsSync(resolve(entryPoint))) {
    console.error(`❌ ${entryPoint} not found`);
    hasErrors = true;
} else {
    console.log(`  ✅ ${entryPoint}`);
}

// Check 4: Core infrastructure files
console.log('\n✓ Checking core infrastructure files...');
const coreFiles = [
    './dist/di/container.js',
    './dist/di/types.js',
    './dist/infrastructure/mcp/McpServerAdapter.js'
];

for (const file of coreFiles) {
    if (!existsSync(resolve(file))) {
        console.error(`❌ ${file} not found`);
        hasErrors = true;
    } else {
        console.log(`  ✅ ${file}`);
    }
}

// Check 5: Package configuration
console.log('\n✓ Checking package configuration...');
if (!existsSync('./package.json')) {
    console.error('❌ package.json not found');
    hasErrors = true;
} else {
    console.log('  ✅ package.json exists');

    const pkg = await import('./package.json', { with: { type: 'json' } });
    const pkgData = pkg.default;

    // Verify bin path
    if (pkgData.bin && pkgData.bin['api-bdd-test-case-generator-mcp-server']) {
        const binPath = pkgData.bin['api-bdd-test-case-generator-mcp-server'];
        if (binPath === './dist/index.js') {
            console.log('  ✅ Correct bin path: ./dist/index.js');
        } else {
            console.error(`  ❌ Wrong bin path: ${binPath} (should be ./dist/index.js)`);
            hasErrors = true;
        }
    }

    // Verify type module
    if (pkgData.type === 'module') {
        console.log('  ✅ Type: module (ESM enabled)');
    } else {
        console.error('  ❌ Type should be "module" for ESM');
        hasErrors = true;
    }
}

// Check 6: TypeScript configuration
console.log('\n✓ Checking TypeScript configuration...');
if (!existsSync('./tsconfig.json')) {
    console.error('❌ tsconfig.json not found');
    hasErrors = true;
} else {
    console.log('  ✅ tsconfig.json exists');

    // Validate tsconfig.json content
    try {
        const tsconfigContent = readFileSync('./tsconfig.json', 'utf-8');
        // Remove single-line comments only (don't touch /** in strings)
        const cleanContent = tsconfigContent.split('\n')
            .map(line => line.replace(/\/\/.*$/, ''))
            .join('\n');
        const tsconfig = JSON.parse(cleanContent);

        // Check rootDir
        if (tsconfig.compilerOptions?.rootDir === './src') {
            console.log('  ✅ rootDir: ./src (correct)');
        } else {
            console.log(`  ⚠️  rootDir: ${tsconfig.compilerOptions?.rootDir} (recommended: ./src)`);
            hasWarnings = true;
        }

        // Check outDir
        if (tsconfig.compilerOptions?.outDir === './dist') {
            console.log('  ✅ outDir: ./dist (correct)');
        } else {
            console.error(`  ❌ outDir: ${tsconfig.compilerOptions?.outDir} (should be ./dist)`);
            hasErrors = true;
        }

        // Check module resolution
        if (tsconfig.compilerOptions?.module === 'Node16' || tsconfig.compilerOptions?.module === 'NodeNext') {
            console.log(`  ✅ module: ${tsconfig.compilerOptions.module} (ESM compatible)`);
        } else {
            console.log(`  ⚠️  module: ${tsconfig.compilerOptions?.module} (recommended: Node16 or NodeNext for ESM)`);
            hasWarnings = true;
        }

        // Check include pattern
        if (tsconfig.include?.includes('src/**/*.ts')) {
            console.log('  ✅ include pattern targets src directory');
        } else {
            console.log(`  ⚠️  include pattern: ${JSON.stringify(tsconfig.include)} (recommended: ["src/**/*.ts"])`);
            hasWarnings = true;
        }
    } catch (error) {
        console.error(`  ❌ Error parsing tsconfig.json: ${error.message}`);
        hasErrors = true;
    }
}

// Check 7: Jest configuration
console.log('\n✓ Checking Jest configuration...');
if (!existsSync('./jest.config.cjs')) {
    console.log('  ⚠️  jest.config.cjs not found (tests may not be configured)');
    hasWarnings = true;
} else {
    console.log('  ✅ jest.config.cjs exists');

    try {
        const jestConfigContent = readFileSync('./jest.config.cjs', 'utf-8');

        // Check for ESM preset
        if (jestConfigContent.includes('ts-jest/presets/default-esm')) {
            console.log('  ✅ ESM preset configured');
        } else {
            console.log('  ⚠️  ESM preset not detected (may cause test issues)');
            hasWarnings = true;
        }

        // Check for coverage thresholds
        if (jestConfigContent.includes('coverageThreshold')) {
            console.log('  ✅ Coverage thresholds configured');
        } else {
            console.log('  ⚠️  No coverage thresholds configured');
            hasWarnings = true;
        }
    } catch (error) {
        console.log(`  ⚠️  Could not read jest.config.cjs: ${error.message}`);
        hasWarnings = true;
    }
}

// Check 8: Docker configuration
console.log('\n✓ Checking Docker configuration...');
const dockerFiles = {
    'Dockerfile': existsSync('./Dockerfile'),
    'docker-compose.yml': existsSync('./docker-compose.yml'),
    '.dockerignore': existsSync('./.dockerignore')
};

let dockerConfigured = true;
for (const [file, exists] of Object.entries(dockerFiles)) {
    if (exists) {
        console.log(`  ✅ ${file} exists`);
    } else {
        console.log(`  ⚠️  ${file} not found`);
        dockerConfigured = false;
        hasWarnings = true;
    }
}

if (dockerConfigured) {
    // Validate Dockerfile entry point matches package.json bin
    try {
        const dockerfileContent = readFileSync('./Dockerfile', 'utf-8');
        if (dockerfileContent.includes('dist/index.js')) {
            console.log('  ✅ Dockerfile entry point matches build output');
        } else {
            console.log('  ⚠️  Dockerfile entry point may not match build output');
            hasWarnings = true;
        }
    } catch (error) {
        console.log(`  ⚠️  Could not validate Dockerfile: ${error.message}`);
        hasWarnings = true;
    }
}

// Check 9: Build scripts
console.log('\n✓ Checking build scripts...');
const buildScripts = [
    'docker-deploy.sh',
    'local-build.sh'
];

let scriptsFound = 0;
for (const script of buildScripts) {
    if (existsSync(`./${script}`)) {
        console.log(`  ✅ ${script} exists`);
        scriptsFound++;
    }
}

if (scriptsFound === 0) {
    console.log('  ⚠️  No build scripts found');
    hasWarnings = true;
} else {
    console.log(`  ✅ ${scriptsFound} build script(s) available`);
}

// Check 10: Documentation
console.log('\n✓ Checking documentation...');
const docFiles = ['README.md'];
let docsFound = 0;

for (const doc of docFiles) {
    if (existsSync(`./${doc}`)) {
        console.log(`  ✅ ${doc} exists`);
        docsFound++;
    }
}

if (docsFound === 0) {
    console.log('  ⚠️  No documentation files found');
    hasWarnings = true;
}

// Final result
console.log('\n' + '='.repeat(60));
if (hasErrors) {
    console.error('❌ Verification failed! Please fix the errors above.');
    console.log('='.repeat(60));
    process.exit(1);
} else if (hasWarnings) {
    console.log('⚠️  Verification passed with warnings. Review warnings above.');
    console.log('='.repeat(60));
    console.log('\n✅ The MCP server is functional but may have configuration issues.\n');
} else {
    console.log('✅ All checks passed! The MCP server is ready to use.');
    console.log('='.repeat(60));

    console.log('\n📖 Next steps:\n');
    console.log('1. Run the server: node dist/index.js');
    console.log('2. Or use with Docker: docker build -t mcp/api-bdd-test-case-generator .');
    console.log('3. Configure in your MCP client (VS Code, Claude Desktop, etc.)\n');

    console.log('📍 Server entry point:');
    console.log(`   ${resolve('./dist/index.js')}\n`);

    console.log('📝 MCP Client configuration example:');
    console.log(JSON.stringify({
        "mcpServers": {
            "api-bdd-test-case-generator": {
                "command": "node",
                "args": [resolve('./dist/index.js')]
            }
        }
    }, null, 2));
    console.log();
}

