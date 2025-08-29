const { MongoClient, ObjectId } = require('mongodb');

// MongoDB连接配置 - 使用与后端相同的配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';

async function debugParentAuth() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log(`🔗 Database URI: ${MONGODB_URI}`);
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // 查找所有用户并显示他们的role和children信息
    console.log('\n🔍 查找所有用户的认证信息：');
    const allUsers = await usersCollection.find({}).toArray();
    
    console.log(`\n找到 ${allUsers.length} 个用户：`);
    
    if (allUsers.length === 0) {
      console.log('❌ 数据库中没有任何用户！这解释了403错误的原因。');
      console.log('\n💡 建议解决方案：');
      console.log('1. 检查是否连接了正确的数据库');
      console.log('2. 运行用户数据种子脚本');
      console.log('3. 创建测试用户数据');
      
      // 检查所有可用的集合
      console.log('\n🔍 检查数据库中的所有集合：');
      const collections = await db.listCollections().toArray();
      console.log(`找到 ${collections.length} 个集合：`);
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
      
      return;
    }
    
    for (const user of allUsers) {
      console.log(`\n📋 用户: ${user.displayName || user.email}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role || '未设置'}`);
      console.log(`   Children: ${JSON.stringify(user.children || '未设置')}`);
      console.log(`   Points: ${user.points || 0}`);
      console.log(`   Created: ${user.createdAt || '未知'}`);
      
      // 特别关注家长用户
      if (user.role === 'parent') {
        console.log(`   ✨ 这是家长用户`);
        if (!user.children || user.children.length === 0) {
          console.log(`   ⚠️  警告: 家长用户没有children数组或children为空！`);
        } else {
          console.log(`   ✅ 家长有 ${user.children.length} 个孩子`);
          
          // 验证children ID是否有效
          for (const childId of user.children) {
            try {
              const child = await usersCollection.findOne({ _id: new ObjectId(childId) });
              if (child) {
                console.log(`   👶 Child: ${child.displayName || child.email} (${child.role || 'no role'})`);
              } else {
                console.log(`   ❌ Invalid child ID: ${childId}`);
              }
            } catch (error) {
              console.log(`   ❌ Invalid ObjectId format: ${childId}`);
            }
          }
        }
      }
      
      // 检查学生用户
      if (user.role === 'student') {
        console.log(`   🎓 这是学生用户`);
      }
      
      console.log('   ---');
    }
    
    // 查找包含"爸爸"的用户
    console.log('\n🔍 查找包含"爸爸"的用户：');
    const parentUsers = await usersCollection.find({
      $or: [
        { displayName: { $regex: '爸爸', $options: 'i' } },
        { email: { $regex: '爸爸', $options: 'i' } }
      ]
    }).toArray();
    
    if (parentUsers.length > 0) {
      console.log(`\n找到 ${parentUsers.length} 个包含"爸爸"的用户：`);
      for (const parent of parentUsers) {
        console.log(`\n🎯 用户: ${parent.displayName || parent.email}`);
        console.log(`   ID: ${parent._id}`);
        console.log(`   Role: ${parent.role}`);
        console.log(`   Children: ${JSON.stringify(parent.children)}`);
        console.log(`   Email: ${parent.email}`);
        
        if (parent.role !== 'parent') {
          console.log(`   ⚠️  问题: role不是'parent'，而是'${parent.role}'`);
        }
        
        if (!parent.children || parent.children.length === 0) {
          console.log(`   ⚠️  问题: children数组为空或未定义`);
        }
      }
    } else {
      console.log('❌ 没有找到包含"爸爸"的用户');
    }
    
    // 检查用户关系完整性
    console.log('\n🔍 检查用户关系完整性：');
    const parents = await usersCollection.find({ role: 'parent' }).toArray();
    const students = await usersCollection.find({ role: 'student' }).toArray();
    
    console.log(`\n家长用户数量: ${parents.length}`);
    console.log(`学生用户数量: ${students.length}`);
    
    for (const parent of parents) {
      console.log(`\n🎯 验证家长: ${parent.displayName || parent.email}`);
      if (parent.children && parent.children.length > 0) {
        for (const childId of parent.children) {
          try {
            const child = await usersCollection.findOne({ _id: new ObjectId(childId) });
            if (child) {
              console.log(`   ✅ 关联学生: ${child.displayName || child.email}`);
            } else {
              console.log(`   ❌ 无效的学生ID: ${childId}`);
            }
          } catch (error) {
            console.log(`   ❌ 无效的ObjectId格式: ${childId}`);
          }
        }
      } else {
        console.log(`   ⚠️  该家长没有关联的学生`);
      }
    }
    
  } catch (error) {
    console.error('❌ 数据库查询错误:', error);
  } finally {
    await client.close();
    console.log('\n🔚 数据库连接已关闭');
  }
}

// 运行调试脚本
debugParentAuth().catch(console.error);