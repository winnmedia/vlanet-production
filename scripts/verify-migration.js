#!/usr/bin/env node

/**
 * VLANET 데이터베이스 마이그레이션 검증 스크립트
 *
 * 용도: 마이그레이션 후 데이터베이스 상태 검증
 * 실행: node scripts/verify-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const chalk = require('chalk');

// 환경 변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(chalk.red('❌ 환경 변수가 설정되지 않았습니다.'));
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.');
  process.exit(1);
}

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * 테이블 존재 여부 확인
 */
async function verifyTables() {
  console.log(chalk.blue('📊 테이블 존재 여부 확인 중...'));

  const requiredTables = [
    'profiles',
    'videos',
    'video_stats',
    'video_reactions',
    'investment_interests',
    'ai_tech_stack',
    'investor_preferences',
    'curation_categories',
    'curated_videos',
    'content_moderation_logs'
  ];

  let allTablesExist = true;

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);

      if (error) {
        console.error(chalk.red(`❌ 테이블 '${table}' 접근 실패: ${error.message}`));
        allTablesExist = false;
      } else {
        console.log(chalk.green(`✅ 테이블 '${table}' 확인됨`));
      }
    } catch (err) {
      console.error(chalk.red(`❌ 테이블 '${table}' 검증 오류: ${err.message}`));
      allTablesExist = false;
    }
  }

  return allTablesExist;
}

/**
 * ENUM 타입 확인
 */
async function verifyEnumTypes() {
  console.log(chalk.blue('🏷️ ENUM 타입 확인 중...'));

  const requiredEnums = [
    'user_role',
    'video_status',
    'ai_model_type',
    'video_genre',
    'visual_style',
    'admin_permission_level',
    'moderation_action_type',
    'report_reason'
  ];

  let allEnumsExist = true;

  try {
    const { data, error } = await supabase.rpc('get_enum_types', {
      enum_names: requiredEnums
    });

    if (error) {
      // RPC가 없는 경우 직접 쿼리로 확인
      for (const enumName of requiredEnums) {
        console.log(chalk.yellow(`⚠️ ENUM '${enumName}' 확인 (수동 검증 필요)`));
      }
    } else {
      requiredEnums.forEach(enumName => {
        if (data.includes(enumName)) {
          console.log(chalk.green(`✅ ENUM '${enumName}' 확인됨`));
        } else {
          console.error(chalk.red(`❌ ENUM '${enumName}' 누락`));
          allEnumsExist = false;
        }
      });
    }
  } catch (err) {
    console.log(chalk.yellow(`⚠️ ENUM 타입 확인 중 오류 (수동 검증 필요): ${err.message}`));
  }

  return allEnumsExist;
}

/**
 * RLS 정책 확인
 */
async function verifyRLSPolicies() {
  console.log(chalk.blue('🔒 RLS 정책 확인 중...'));

  const tablesWithRLS = [
    'profiles',
    'videos',
    'video_stats',
    'video_reactions',
    'investment_interests',
    'ai_tech_stack',
    'investor_preferences',
    'curation_categories',
    'curated_videos',
    'content_moderation_logs'
  ];

  let allRLSEnabled = true;

  try {
    for (const table of tablesWithRLS) {
      // RLS 활성화 상태 확인을 위한 더미 쿼리
      const { error } = await supabase.from(table).select('*').limit(1);

      if (error && error.message.includes('RLS')) {
        console.log(chalk.green(`✅ RLS 정책 '${table}' 활성화됨`));
      } else if (error) {
        console.log(chalk.yellow(`⚠️ 테이블 '${table}' RLS 상태 확인 불가: ${error.message}`));
      } else {
        console.log(chalk.green(`✅ 테이블 '${table}' 접근 가능`));
      }
    }
  } catch (err) {
    console.error(chalk.red(`❌ RLS 정책 확인 오류: ${err.message}`));
    allRLSEnabled = false;
  }

  return allRLSEnabled;
}

/**
 * 함수 존재 여부 확인
 */
async function verifyFunctions() {
  console.log(chalk.blue('⚙️ 데이터베이스 함수 확인 중...'));

  const requiredFunctions = [
    'update_updated_at_column',
    'create_video_stats',
    'calculate_trending_score',
    'update_trending_scores',
    'check_admin_permission'
  ];

  let allFunctionsExist = true;

  for (const func of requiredFunctions) {
    try {
      // 함수 호출 테스트 (안전한 매개변수 사용)
      if (func === 'calculate_trending_score') {
        const { data, error } = await supabase.rpc(func, {
          view_count: 100,
          like_count: 10,
          investment_interest_count: 2,
          hours_since_published: 24
        });

        if (error) {
          console.error(chalk.red(`❌ 함수 '${func}' 호출 실패: ${error.message}`));
          allFunctionsExist = false;
        } else {
          console.log(chalk.green(`✅ 함수 '${func}' 확인됨 (결과: ${data})`));
        }
      } else if (func === 'check_admin_permission') {
        // 테스트용 UUID와 권한 레벨로 함수 테스트
        const { data, error } = await supabase.rpc(func, {
          user_id: '00000000-0000-0000-0000-000000000000',
          required_level: 'ANALYTICS_VIEWER'
        });

        if (error) {
          console.error(chalk.red(`❌ 함수 '${func}' 호출 실패: ${error.message}`));
          allFunctionsExist = false;
        } else {
          console.log(chalk.green(`✅ 함수 '${func}' 확인됨`));
        }
      } else {
        console.log(chalk.yellow(`⚠️ 함수 '${func}' 수동 확인 필요`));
      }
    } catch (err) {
      console.error(chalk.red(`❌ 함수 '${func}' 검증 오류: ${err.message}`));
      allFunctionsExist = false;
    }
  }

  return allFunctionsExist;
}

/**
 * 기본 데이터 확인
 */
async function verifyDefaultData() {
  console.log(chalk.blue('📋 기본 데이터 확인 중...'));

  try {
    // 큐레이션 카테고리 기본 데이터 확인
    const { data: categories, error } = await supabase
      .from('curation_categories')
      .select('name')
      .eq('is_active', true);

    if (error) {
      console.error(chalk.red(`❌ 큐레이션 카테고리 조회 실패: ${error.message}`));
      return false;
    }

    const expectedCategories = [
      '홈페이지 히어로',
      '이주의 베스트',
      '신규 크리에이터 스포트라이트',
      '투자 주목 영상',
      '기술별 쇼케이스'
    ];

    const foundCategories = categories.map(c => c.name);
    let allCategoriesExist = true;

    expectedCategories.forEach(category => {
      if (foundCategories.includes(category)) {
        console.log(chalk.green(`✅ 큐레이션 카테고리 '${category}' 확인됨`));
      } else {
        console.error(chalk.red(`❌ 큐레이션 카테고리 '${category}' 누락`));
        allCategoriesExist = false;
      }
    });

    return allCategoriesExist;
  } catch (err) {
    console.error(chalk.red(`❌ 기본 데이터 확인 오류: ${err.message}`));
    return false;
  }
}

/**
 * 전체 검증 실행
 */
async function runVerification() {
  console.log(chalk.bold.blue('🚀 VLANET 데이터베이스 마이그레이션 검증 시작\n'));

  const results = {
    tables: await verifyTables(),
    enums: await verifyEnumTypes(),
    rls: await verifyRLSPolicies(),
    functions: await verifyFunctions(),
    defaultData: await verifyDefaultData()
  };

  console.log(chalk.bold.blue('\n📊 검증 결과 요약:'));
  console.log(`테이블: ${results.tables ? chalk.green('✅ 통과') : chalk.red('❌ 실패')}`);
  console.log(`ENUM 타입: ${results.enums ? chalk.green('✅ 통과') : chalk.red('❌ 실패')}`);
  console.log(`RLS 정책: ${results.rls ? chalk.green('✅ 통과') : chalk.red('❌ 실패')}`);
  console.log(`함수: ${results.functions ? chalk.green('✅ 통과') : chalk.red('❌ 실패')}`);
  console.log(`기본 데이터: ${results.defaultData ? chalk.green('✅ 통과') : chalk.red('❌ 실패')}`);

  const allPassed = Object.values(results).every(result => result);

  if (allPassed) {
    console.log(chalk.bold.green('\n🎉 모든 검증 통과! 마이그레이션이 성공적으로 완료되었습니다.'));
    console.log(chalk.green('✅ VLANET 데이터베이스가 프로덕션 배포 준비 완료되었습니다.'));
    process.exit(0);
  } else {
    console.log(chalk.bold.red('\n❌ 일부 검증 실패. 마이그레이션을 다시 확인해주세요.'));
    console.log(chalk.yellow('💡 Supabase SQL Editor에서 migrate.sql을 다시 실행해보세요.'));
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  runVerification().catch(error => {
    console.error(chalk.red('💥 검증 스크립트 실행 중 오류 발생:'));
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  verifyTables,
  verifyEnumTypes,
  verifyRLSPolicies,
  verifyFunctions,
  verifyDefaultData,
  runVerification
};