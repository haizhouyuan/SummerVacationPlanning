import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Playwright 全局清理 - 资源回收和临时文件清理
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Playwright 全局清理启动...');
  
  try {
    // 清理临时的用户数据目录
    const tempDir = path.join(os.tmpdir(), 'claude-playwright-sessions');
    
    if (fs.existsSync(tempDir)) {
      const sessions = fs.readdirSync(tempDir);
      let cleanedCount = 0;
      
      for (const session of sessions) {
        if (session.startsWith('claude-')) {
          const sessionPath = path.join(tempDir, session);
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            cleanedCount++;
          } catch (error) {
            console.warn(`⚠️ 清理会话目录失败: ${session}`, error.message);
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`✅ 已清理 ${cleanedCount} 个临时会话目录`);
      }
    }
    
    // 清理测试产生的临时文件
    const testArtifacts = [
      'test-results',
      'playwright-report',
      '.playwright'
    ];
    
    for (const artifact of testArtifacts) {
      const artifactPath = path.join(process.cwd(), artifact);
      if (fs.existsSync(artifactPath)) {
        try {
          const stats = fs.statSync(artifactPath);
          if (stats.isDirectory()) {
            // 保留最近的测试结果，清理旧的
            const files = fs.readdirSync(artifactPath);
            if (files.length > 10) {
              console.log(`🧹 清理旧的测试产物: ${artifact}`);
              // 这里可以添加更详细的清理逻辑
            }
          }
        } catch (error) {
          console.warn(`⚠️ 清理测试产物失败: ${artifact}`, error.message);
        }
      }
    }
    
    console.log('✅ Playwright 全局清理完成');
    
  } catch (error) {
    console.error('❌ 全局清理过程中出现错误:', error.message);
  }
}

export default globalTeardown;