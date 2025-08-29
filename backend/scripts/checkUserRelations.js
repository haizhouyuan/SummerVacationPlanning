const { MongoClient, ObjectId } = require('mongodb');

async function checkUserRelations() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/summer_app');
  
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');
    
    console.log('=== 检查用户关系数据 ===\n');
    
    // 获取所有用户
    const allUsers = await users.find({}, {
      email: 1,
      displayName: 1,
      role: 1,
      children: 1,
      parentId: 1,
      _id: 1
    }).toArray();
    
    console.log('所有用户：');
    allUsers.forEach(user => {
      console.log(`- ${user.displayName} (${user.email})`);
      console.log(`  ID: ${user._id}`);
      console.log(`  角色: ${user.role}`);
      console.log(`  children字段: ${JSON.stringify(user.children)}`);
      console.log(`  parentId字段: ${user.parentId || 'undefined'}`);
      console.log('');
    });
    
    // 检查家长用户的children字段
    const parents = await users.find({ role: 'parent' }).toArray();
    console.log('=== 家长用户分析 ===');
    
    for (const parent of parents) {
      console.log(`家长: ${parent.displayName}`);
      console.log(`children字段: ${JSON.stringify(parent.children)}`);
      
      if (parent.children && parent.children.length > 0) {
        console.log('关联的孩子:');
        for (const childId of parent.children) {
          try {
            const child = await users.findOne({ _id: new ObjectId(childId) });
            if (child) {
              console.log(`  - ${child.displayName} (${child.email})`);
            } else {
              console.log(`  - [未找到ID: ${childId}]`);
            }
          } catch (error) {
            console.log(`  - [无效ID格式: ${childId}]`);
          }
        }
      } else {
        console.log('  无关联孩子');
      }
      console.log('');
    }
    
    // 检查学生用户
    const students = await users.find({ role: 'student' }).toArray();
    console.log('=== 学生用户分析 ===');
    
    students.forEach(student => {
      console.log(`学生: ${student.displayName}`);
      console.log(`  ID: ${student._id}`);
      console.log(`  parentId: ${student.parentId || 'undefined'}`);
      console.log('');
    });
    
    // 建议修复方案
    console.log('=== 修复建议 ===');
    
    const studentsNeedingParent = students.filter(s => !s.parentId);
    const parentsNeedingChildren = parents.filter(p => !p.children || p.children.length === 0);
    
    if (studentsNeedingParent.length > 0) {
      console.log('需要设置parentId的学生:');
      studentsNeedingParent.forEach(s => console.log(`  - ${s.displayName}`));
    }
    
    if (parentsNeedingChildren.length > 0) {
      console.log('需要设置children的家长:');
      parentsNeedingChildren.forEach(p => console.log(`  - ${p.displayName}`));
    }
    
    // 自动匹配建议（基于常见的命名模式）
    console.log('\n自动匹配建议:');
    if (parentsNeedingChildren.length > 0 && studentsNeedingParent.length > 0) {
      console.log('建议将以下用户建立父子关系:');
      console.log(`  家长: ${parentsNeedingChildren[0].displayName} (${parentsNeedingChildren[0]._id})`);
      console.log(`  孩子: ${studentsNeedingParent[0].displayName} (${studentsNeedingParent[0]._id})`);
    }
    
  } catch (error) {
    console.error('检查用户关系时出错:', error);
  } finally {
    await client.close();
  }
}

// 设置环境变量并运行
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/summer-vacation-planning';
checkUserRelations();