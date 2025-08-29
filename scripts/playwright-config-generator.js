#!/usr/bin/env node

/**
 * Playwright MCP 动态配置生成器
 * 为每个 Claude Code 会话生成唯一的配置，避免多终端冲突
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class PlaywrightConfigGenerator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.configPath = path.join(this.projectRoot, '.claude', 'config.json');
    this.tempDir = path.join(os.tmpdir(), 'claude-playwright-sessions');
    
    // 确保临时目录存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 生成唯一的会话ID
   */
  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const pid = process.pid;
    return `claude-${timestamp}-${pid}-${random}`;
  }

  /**
   * 获取可用端口
   */
  async getAvailablePort(startPort = 9222) {
    const net = require('net');
    
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(startPort, () => {
        const port = server.address().port;
        server.close(() => resolve(port));
      });
      server.on('error', () => {
        this.getAvailablePort(startPort + 1).then(resolve);
      });
    });
  }

  /**
   * 生成 Edge 浏览器配置
   */
  generateEdgeConfig(sessionId, userDataDir, debugPort) {
    return {
      "channel": "msedge",
      "executablePath": "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      "headless": false,
      "args": [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=TranslateUI",
        "--disable-background-timer-throttling",
        "--disable-background-networking",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        `--user-data-dir=${userDataDir}`,
        `--remote-debugging-port=${debugPort}`,
        "--window-size=1280,720",
        // 性能优化参数
        "--disable-images",
        "--disable-javascript-harmony-shipping",
        "--disable-background-media-suspend",
        "--disable-ipc-flooding-protection"
      ]
    };
  }

  /**
   * 生成完整的 MCP 配置
   */
  async generateConfig() {
    const sessionId = this.generateSessionId();
    const debugPort = await this.getAvailablePort(9222);
    const userDataDir = path.join(this.tempDir, sessionId, 'user-data');
    const cacheDir = path.join(this.tempDir, sessionId, 'cache');

    // 创建会话目录
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.mkdirSync(cacheDir, { recursive: true });

    const edgeConfig = this.generateEdgeConfig(sessionId, userDataDir, debugPort);

    const config = {
      "mcpServers": {
        "playwright": {
          "command": "npx",
          "args": ["@modelcontextprotocol/server-playwright"],
          "env": {
            "MCP_PLAYWRIGHT_USER_DATA_DIR": userDataDir,
            "MCP_PLAYWRIGHT_INSTANCE_ID": sessionId,
            "MCP_PLAYWRIGHT_CACHE_DIR": cacheDir,
            "PLAYWRIGHT_BROWSERS_PATH": "0",
            "PLAYWRIGHT_LAUNCH_OPTIONS": JSON.stringify(edgeConfig),
            // 性能优化环境变量
            "MCP_PLAYWRIGHT_MAX_RESPONSE_SIZE": "24000",
            "MCP_PLAYWRIGHT_TIMEOUT": "30000",
            "MCP_PLAYWRIGHT_RESOURCE_FILTER": "true"
          }
        },
        "aliyun": {
          "command": "ssh",
          "args": [
            "-o", "ConnectTimeout=30",
            "-o", "ServerAliveInterval=60", 
            "-o", "ServerAliveCountMax=3",
            "-o", "StrictHostKeyChecking=no",
            "-i", "C:\\Users\\admin\\.ssh\\id_ed25519",
            "root@47.120.74.212",
            "claude",
            "mcp",
            "serve"
          ],
          "env": {
            "SSH_KEY_PATH": "C:\\Users\\admin\\.ssh\\id_ed25519"
          }
        }
      },
      "_metadata": {
        "sessionId": sessionId,
        "generatedAt": new Date().toISOString(),
        "userDataDir": userDataDir,
        "debugPort": debugPort,
        "processId": process.pid
      }
    };

    return { config, sessionId, userDataDir };
  }

  /**
   * 保存配置到文件
   */
  async saveConfig() {
    try {
      const { config, sessionId, userDataDir } = await this.generateConfig();
      
      // 备份现有配置
      if (fs.existsSync(this.configPath)) {
        const backup = this.configPath + '.backup.' + Date.now();
        fs.copyFileSync(this.configPath, backup);
        console.log(`✅ 已备份现有配置: ${backup}`);
      }

      // 保存新配置
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      
      console.log(`✅ 已生成新的 Playwright MCP 配置`);
      console.log(`   会话ID: ${sessionId}`);
      console.log(`   用户数据目录: ${userDataDir}`);
      console.log(`   调试端口: ${config._metadata.debugPort}`);
      console.log(`   配置文件: ${this.configPath}`);

      return { config, sessionId };
    } catch (error) {
      console.error(`❌ 配置生成失败:`, error.message);
      throw error;
    }
  }

  /**
   * 清理过期的会话目录
   */
  cleanupOldSessions(maxAgeHours = 24) {
    try {
      if (!fs.existsSync(this.tempDir)) return;

      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      const sessionDirs = fs.readdirSync(this.tempDir);
      let cleanedCount = 0;

      sessionDirs.forEach(dirName => {
        if (!dirName.startsWith('claude-')) return;

        const dirPath = path.join(this.tempDir, dirName);
        const stats = fs.statSync(dirPath);
        
        if (now - stats.mtimeMs > maxAge) {
          fs.rmSync(dirPath, { recursive: true, force: true });
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        console.log(`🧹 已清理 ${cleanedCount} 个过期会话目录`);
      }
    } catch (error) {
      console.warn(`⚠️  清理过期会话时出错:`, error.message);
    }
  }
}

// CLI 接口
if (require.main === module) {
  const generator = new PlaywrightConfigGenerator();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'generate':
    case undefined:
      generator.cleanupOldSessions();
      generator.saveConfig().catch(console.error);
      break;
      
    case 'cleanup':
      const hours = parseInt(process.argv[3]) || 24;
      generator.cleanupOldSessions(hours);
      break;
      
    case 'help':
    default:
      console.log(`
Playwright MCP 配置生成器

用法:
  node playwright-config-generator.js [generate]  # 生成新配置（默认）
  node playwright-config-generator.js cleanup [hours]  # 清理过期会话目录
  node playwright-config-generator.js help       # 显示帮助

特性:
  ✅ 动态生成唯一会话ID避免多终端冲突
  ✅ 强制使用 Edge 浏览器
  ✅ 自动端口分配和用户数据目录隔离
  ✅ 性能优化配置和资源过滤
  ✅ 自动清理过期会话目录
      `);
      break;
  }
}

module.exports = PlaywrightConfigGenerator;