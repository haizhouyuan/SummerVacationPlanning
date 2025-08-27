const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('🔍 查找用户登录凭据');
console.log('=========================\n');

async function getUserCredentials() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');
    
    const db = client.db();
    const users = db.collection('users');

    // 查找"爸爸"用户
    const parentUser = await users.findOne({ 
      displayName: '爸爸',
      role: 'parent' 
    });
    
    if (parentUser) {
      console.log('✅ 找到"爸爸"用户:');
      console.log(`   - ID: ${parentUser._id}`);
      console.log(`   - Email: ${parentUser.email}`);
      console.log(`   - Display Name: ${parentUser.displayName}`);
      console.log(`   - Role: ${parentUser.role}`);
      console.log(`   - Has Password: ${parentUser.password ? '是' : '否'}`);
      console.log(`   - Password Hash: ${parentUser.password ? parentUser.password.substring(0, 20) + '...' : '无'}`);
    } else {
      console.log('❌ 未找到"爸爸"用户');
    }
    
    // 查找"袁绍宸"学生
    const studentUser = await users.findOne({
      displayName: '袁绍宸',
      role: 'student'
    });
    
    if (studentUser) {
      console.log('\n✅ 找到"袁绍宸"学生:');
      console.log(`   - ID: ${studentUser._id}`);
      console.log(`   - Email: ${studentUser.email}`);
      console.log(`   - Display Name: ${studentUser.displayName}`);
      console.log(`   - Role: ${studentUser.role}`);
      console.log(`   - Parent ID: ${studentUser.parentId}`);
    } else {
      console.log('\n❌ 未找到"袁绍宸"学生');
    }
    
  } catch (error) {
    console.error('❌ 查询过程中发生错误:', error);
  } finally {
    await client.close();
    console.log('\n🔄 数据库连接已关闭');
  }
}

// 运行查询
getUserCredentials().catch(console.error);