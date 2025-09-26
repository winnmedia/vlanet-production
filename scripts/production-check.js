#!/usr/bin/env node

/**
 * 프로덕션 준비 상태 검증 스크립트
 * 환경 변수, 보안 설정, 빌드 상태 등을 종합적으로 검증
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Chalk 동적 import (ES Module 지원)
let chalk;
(async () => {
  try {
    chalk = (await import('chalk')).default;
  } catch (error) {
    // Fallback: chalk 없이 색상 없는 출력
    chalk = {
      red: (text) => text,
      green: (text) => text,
      yellow: (text) => text,
      blue: (text) => text,
      bold: (text) => text,
    };
  }
})();

class ProductionChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  log(type, message, details = '') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}]`;

    switch (type) {
      case 'error':
        this.errors.push({ message, details });
        console.log(chalk.red(`${prefix} ❌ ERROR: ${message}`));
        if (details) console.log(chalk.red(`    ${details}`));
        break;
      case 'warning':
        this.warnings.push({ message, details });
        console.log(chalk.yellow(`${prefix} ⚠️  WARNING: ${message}`));
        if (details) console.log(chalk.yellow(`    ${details}`));
        break;
      case 'success':
        this.passed.push({ message, details });
        console.log(chalk.green(`${prefix} ✅ PASSED: ${message}`));
        if (details) console.log(chalk.green(`    ${details}`));
        break;
      case 'info':
        console.log(chalk.blue(`${prefix} ℹ️  INFO: ${message}`));
        if (details) console.log(chalk.blue(`    ${details}`));
        break;
    }
  }

  async checkEnvironmentVariables() {
    this.log('info', '환경 변수 검증 시작...');

    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_APP_URL'
    ];

    const productionEnvVars = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'SESSION_SECRET',
      'NEXT_PUBLIC_SENTRY_DSN'
    ];

    // 필수 환경 변수 검증
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        this.log('error', `필수 환경 변수가 설정되지 않음: ${envVar}`);
      } else {
        this.log('success', `필수 환경 변수 설정됨: ${envVar}`);
      }
    }

    // 프로덕션 환경 변수 검증
    if (process.env.NODE_ENV === 'production') {
      for (const envVar of productionEnvVars) {
        if (!process.env[envVar]) {
          this.log('warning', `프로덕션 권장 환경 변수가 설정되지 않음: ${envVar}`);
        } else {
          this.log('success', `프로덕션 환경 변수 설정됨: ${envVar}`);
        }
      }

      // HTTPS 검증
      if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('https://')) {
        this.log('error', 'NEXT_PUBLIC_APP_URL이 HTTPS를 사용하지 않습니다', process.env.NEXT_PUBLIC_APP_URL);
      } else if (process.env.NEXT_PUBLIC_APP_URL) {
        this.log('success', 'NEXT_PUBLIC_APP_URL이 HTTPS를 사용합니다');
      }
    }
  }

  async checkBuildConfiguration() {
    this.log('info', '빌드 설정 검증 시작...');

    // package.json 확인
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.log('error', 'package.json 파일을 찾을 수 없습니다');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // 필수 스크립트 확인
    const requiredScripts = ['build', 'start', 'lint', 'type-check'];
    for (const script of requiredScripts) {
      if (packageJson.scripts && packageJson.scripts[script]) {
        this.log('success', `빌드 스크립트 존재: ${script}`);
      } else {
        this.log('warning', `빌드 스크립트 누락: ${script}`);
      }
    }

    // TypeScript 설정 확인
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      this.log('success', 'TypeScript 설정 파일 존재');

      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        if (tsconfig.compilerOptions?.strict) {
          this.log('success', 'TypeScript strict 모드 활성화');
        } else {
          this.log('warning', 'TypeScript strict 모드가 비활성화되어 있습니다');
        }
      } catch (error) {
        this.log('error', 'tsconfig.json 파싱 실패', error.message);
      }
    } else {
      this.log('error', 'tsconfig.json 파일을 찾을 수 없습니다');
    }

    // Next.js 설정 확인
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      this.log('success', 'Next.js 설정 파일 존재');
    } else {
      this.log('warning', 'next.config.js 파일을 찾을 수 없습니다');
    }
  }

  async checkSecurityConfiguration() {
    this.log('info', '보안 설정 검증 시작...');

    // Sentry 설정 확인
    const sentryFiles = [
      'sentry.client.config.ts',
      'sentry.server.config.ts',
      'sentry.edge.config.ts',
      'instrumentation.ts'
    ];

    let sentryConfigured = 0;
    for (const file of sentryFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        sentryConfigured++;
        this.log('success', `Sentry 설정 파일 존재: ${file}`);
      }
    }

    if (sentryConfigured === 0) {
      this.log('warning', 'Sentry 설정 파일이 없습니다');
    } else if (sentryConfigured < sentryFiles.length) {
      this.log('warning', `일부 Sentry 설정 파일이 누락되었습니다 (${sentryConfigured}/${sentryFiles.length})`);
    }

    // 환경 변수 검증 파일 확인
    const envConfigPath = path.join(process.cwd(), 'src/shared/config/env.ts');
    if (fs.existsSync(envConfigPath)) {
      this.log('success', '환경 변수 검증 설정 존재');
    } else {
      this.log('warning', '환경 변수 검증 설정 파일을 찾을 수 없습니다');
    }
  }

  async checkTestConfiguration() {
    this.log('info', '테스트 설정 검증 시작...');

    // Jest 설정 확인
    const jestConfigs = ['jest.config.js', 'jest.config.json', 'jest.config.ts'];
    let jestConfigFound = false;

    for (const config of jestConfigs) {
      if (fs.existsSync(path.join(process.cwd(), config))) {
        this.log('success', `Jest 설정 파일 존재: ${config}`);
        jestConfigFound = true;
        break;
      }
    }

    if (!jestConfigFound) {
      // package.json에서 Jest 설정 확인
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      if (packageJson.jest) {
        this.log('success', 'Jest 설정이 package.json에 존재');
      } else {
        this.log('warning', 'Jest 설정을 찾을 수 없습니다');
      }
    }

    // 테스트 스크립트 확인
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    if (packageJson.scripts?.test) {
      this.log('success', 'test 스크립트 존재');
    } else {
      this.log('warning', 'test 스크립트가 없습니다');
    }

    if (packageJson.scripts?.['test:coverage']) {
      this.log('success', 'test coverage 스크립트 존재');
    } else {
      this.log('warning', 'test coverage 스크립트가 없습니다');
    }
  }

  async checkDependencies() {
    this.log('info', '의존성 검증 시작...');

    try {
      // 보안 취약점 검사
      execSync('pnpm audit --audit-level moderate', { stdio: 'pipe' });
      this.log('success', '보안 취약점 검사 통과');
    } catch (error) {
      this.log('warning', '보안 취약점이 발견되었습니다', 'pnpm audit 실행하여 확인하세요');
    }

    try {
      // 오래된 의존성 검사
      const outdated = execSync('pnpm outdated --format json', { stdio: 'pipe', encoding: 'utf8' });
      const outdatedPackages = JSON.parse(outdated);

      if (Object.keys(outdatedPackages).length === 0) {
        this.log('success', '모든 의존성이 최신 상태입니다');
      } else {
        this.log('warning', `${Object.keys(outdatedPackages).length}개의 오래된 의존성이 있습니다`);
      }
    } catch (error) {
      this.log('info', '의존성 상태 확인 중 오류 발생 (정상적일 수 있음)');
    }
  }

  async runBuildTest() {
    this.log('info', '빌드 테스트 시작...');

    try {
      // TypeScript 타입 체크
      execSync('pnpm type-check', { stdio: 'pipe' });
      this.log('success', 'TypeScript 타입 체크 통과');
    } catch (error) {
      this.log('error', 'TypeScript 타입 체크 실패', error.message);
    }

    try {
      // 린트 체크
      execSync('pnpm lint', { stdio: 'pipe' });
      this.log('success', 'ESLint 검사 통과');
    } catch (error) {
      this.log('error', 'ESLint 검사 실패', error.message);
    }

    try {
      // 테스트 실행
      execSync('pnpm test --passWithNoTests', { stdio: 'pipe' });
      this.log('success', '테스트 실행 성공');
    } catch (error) {
      this.log('warning', '테스트 실행 중 오류 발생', error.message);
    }
  }

  async run() {
    console.log(chalk.blue.bold('\n🚀 VideoPlanet 프로덕션 준비 상태 검증\n'));

    await this.checkEnvironmentVariables();
    await this.checkBuildConfiguration();
    await this.checkSecurityConfiguration();
    await this.checkTestConfiguration();
    await this.checkDependencies();
    await this.runBuildTest();

    // 결과 요약
    console.log(chalk.blue.bold('\n📊 검증 결과 요약\n'));
    console.log(chalk.green(`✅ 통과: ${this.passed.length}`));
    console.log(chalk.yellow(`⚠️  경고: ${this.warnings.length}`));
    console.log(chalk.red(`❌ 오류: ${this.errors.length}`));

    if (this.errors.length > 0) {
      console.log(chalk.red.bold('\n❌ 오류 상세:'));
      this.errors.forEach((error, index) => {
        console.log(chalk.red(`${index + 1}. ${error.message}`));
        if (error.details) {
          console.log(chalk.red(`   ${error.details}`));
        }
      });
    }

    if (this.warnings.length > 0) {
      console.log(chalk.yellow.bold('\n⚠️  경고 상세:'));
      this.warnings.forEach((warning, index) => {
        console.log(chalk.yellow(`${index + 1}. ${warning.message}`));
        if (warning.details) {
          console.log(chalk.yellow(`   ${warning.details}`));
        }
      });
    }

    console.log('\n');

    if (this.errors.length === 0) {
      console.log(chalk.green.bold('🎉 프로덕션 배포 준비가 완료되었습니다!'));
      process.exit(0);
    } else {
      console.log(chalk.red.bold('🔧 오류를 수정한 후 다시 실행해주세요.'));
      process.exit(1);
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  (async () => {
    // Chalk 로드 대기
    let loadAttempts = 0;
    while (!chalk && loadAttempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 10));
      loadAttempts++;
    }

    const checker = new ProductionChecker();
    await checker.run();
  })().catch(console.error);
}

module.exports = ProductionChecker;