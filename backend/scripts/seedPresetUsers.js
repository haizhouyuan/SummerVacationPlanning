const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedPresetUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');
    
    console.log('🔄 开始创建预设用户...');
    
    // 清理现有演示用户
    console.log('🧹 清理现有演示用户...');
    await users.deleteMany({
      email: { $in: ['student@example.com', 'parent@example.com'] }
    });
    
    // 检查预设用户是否已存在
    const existingUsers = await users.find({
      displayName: { $in: ['袁绍宸', '爸爸', '妈妈'] }
    }).toArray();
    
    if (existingUsers.length > 0) {
      console.log('⚠️ 预设用户已存在，先清理...');
      await users.deleteMany({
        displayName: { $in: ['袁绍宸', '爸爸', '妈妈'] }
      });
    }
    
    // 创建空密码哈希
    console.log('🔐 生成空密码哈希...');
    const emptyPasswordHash = await bcrypt.hash('', 10);
    console.log('✅ 空密码哈希生成完成');
    
    // 插入学生用户
    console.log('👨‍🎓 创建学生用户...');
    const studentResult = await users.insertOne({
      email: '袁绍宸',
      displayName: '袁绍宸',
      password: emptyPasswordHash,
      role: 'student',
      points: 0,
      currentStreak: 0,
      medals: { 
        bronze: false, 
        silver: false, 
        gold: false, 
        diamond: false 
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const studentId = studentResult.insertedId.toString();
    console.log('✅ 学生用户创建成功，ID:', studentId);
    
    // 插入父账号
    console.log('👨 创建父账号...');
    const fatherResult = await users.insertOne({
      email: '爸爸',
      displayName: '爸爸', 
      password: emptyPasswordHash,
      role: 'parent',
      children: [studentId],
      points: 0,
      currentStreak: 0,
      medals: { 
        bronze: false, 
        silver: false, 
        gold: false, 
        diamond: false 
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ 父账号创建成功，ID:', fatherResult.insertedId.toString());
    
    // 插入母账号
    console.log('👩 创建母账号...');
    const motherResult = await users.insertOne({
      email: '妈妈',
      displayName: '妈妈',
      password: emptyPasswordHash, 
      role: 'parent',
      children: [studentId],
      points: 0,
      currentStreak: 0,
      medals: { 
        bronze: false, 
        silver: false, 
        gold: false, 
        diamond: false 
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ 母账号创建成功，ID:', motherResult.insertedId.toString());
    
    // 更新学生的parentId
    console.log('🔗 建立父子关系...');
    await users.updateOne(
      { _id: studentResult.insertedId },
      { $set: { parentId: fatherResult.insertedId.toString() } }
    );
    
    console.log('🎉 预设用户创建成功！');
    console.log('📝 用户信息汇总：');
    console.log('  - 学生：袁绍宸 (ID:', studentId, ')');
    console.log('  - 父账号：爸爸 (ID:', fatherResult.insertedId.toString(), ')');
    console.log('  - 母账号：妈妈 (ID:', motherResult.insertedId.toString(), ')');
    console.log('');
    console.log('🔐 所有用户密码均为空（可直接留空登录）');
    
    // 验证创建结果
    console.log('🔍 验证创建结果...');
    const allUsers = await users.find({
      displayName: { $in: ['袁绍宸', '爸爸', '妈妈'] }
    }).toArray();
    
    console.log(`✅ 验证完成，共找到 ${allUsers.length} 个预设用户`);
    
    for (const user of allUsers) {
      console.log(`  - ${user.displayName} (${user.role}): children=${user.children?.length || 0}, parentId=${user.parentId || 'null'}`);
    }
    
  } catch (error) {
    console.error('❌ 创建预设用户失败:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 直接运行脚本
if (require.main === module) {
  seedPresetUsers()
    .then(() => {
      console.log('✨ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { seedPresetUsers };