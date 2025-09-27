#!/usr/bin/env node

/**
 * @ alias import를 상대 경로로 자동 변환하는 스크립트
 * Vercel 배포 환경에서 모듈 해결 문제 해결
 */

const fs = require('fs');
const path = require('path');

// 변환할 파일 확장자
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// 변환 통계
let totalFiles = 0;
let convertedFiles = 0;
let totalReplacements = 0;

/**
 * 디렉토리를 재귀적으로 순회하여 TypeScript/JavaScript 파일을 찾습니다
 */
function findTargetFiles(dir) {
  const files = [];

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // node_modules, .next, .git 등은 제외
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
        files.push(...findTargetFiles(fullPath));
      }
    } else if (TARGET_EXTENSIONS.includes(path.extname(item))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 파일 경로 기준으로 상대 경로를 계산합니다
 */
function calculateRelativePath(fromFile, toDir) {
  const fromDir = path.dirname(fromFile);
  const relativePath = path.relative(fromDir, toDir);

  // Windows 경로를 Unix 스타일로 변환
  return relativePath.replace(/\\/g, '/');
}

/**
 * @ alias import를 상대 경로로 변환합니다
 */
function convertImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let fileReplacements = 0;

  // @ alias import 패턴 찾기
  const importRegex = /(from\s+['"`])@\/([^'"`]+)(['"`])/g;

  newContent = newContent.replace(importRegex, (match, prefix, importPath, suffix) => {
    // src 디렉토리 기준으로 절대 경로 계산
    const srcDir = path.join(__dirname, 'src');
    const targetPath = path.join(srcDir, importPath);

    // 현재 파일 기준으로 상대 경로 계산
    const relativePath = calculateRelativePath(filePath, targetPath);

    // 상대 경로가 현재 디렉토리나 상위 디렉토리로 시작하지 않으면 './' 추가
    const finalPath = relativePath.startsWith('../') || relativePath.startsWith('./')
      ? relativePath
      : './' + relativePath;

    fileReplacements++;
    console.log(`  ${importPath} → ${finalPath}`);

    return `${prefix}${finalPath}${suffix}`;
  });

  // 변경사항이 있으면 파일 저장
  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    convertedFiles++;
    totalReplacements += fileReplacements;

    console.log(`✅ ${path.relative(__dirname, filePath)} (${fileReplacements}개 변환)`);
  }

  return fileReplacements;
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('🔄 @ alias import 자동 변환 시작...\n');

  // src 디렉토리에서 모든 TypeScript/JavaScript 파일 찾기
  const srcDir = path.join(__dirname, 'src');
  const targetFiles = findTargetFiles(srcDir);

  totalFiles = targetFiles.length;
  console.log(`📁 총 ${totalFiles}개 파일 검색됨\n`);

  // 각 파일의 import 변환
  for (const filePath of targetFiles) {
    convertImports(filePath);
  }

  // 결과 출력
  console.log('\n📊 변환 완료!');
  console.log(`- 검색된 파일: ${totalFiles}개`);
  console.log(`- 변환된 파일: ${convertedFiles}개`);
  console.log(`- 총 변경 사항: ${totalReplacements}개`);

  if (convertedFiles > 0) {
    console.log('\n✨ 모든 @ alias import가 상대 경로로 변환되었습니다!');
  } else {
    console.log('\n✅ 변환할 @ alias import가 없습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { convertImports, calculateRelativePath };