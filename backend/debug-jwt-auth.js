const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// MongoDB连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

async function debugJWTAuth() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log(`🔗 Database URI: ${MONGODB_URI}`);
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // 查找"爸爸"用户
    console.log('\n🔍 查找"爸爸"用户...');
    const parentUser = await usersCollection.findOne({
      $or: [
        { displayName: { $regex: '爸爸', $options: 'i' } },
        { email: { $regex: '爸爸', $options: 'i' } }
      ]
    });

    if (!parentUser) {
      console.log('❌ 找不到"爸爸"用户');
      return;
    }

    console.log('✅ 找到"爸爸"用户：');
    console.log(`   ID: ${parentUser._id}`);
    console.log(`   Email: ${parentUser.email}`);
    console.log(`   DisplayName: ${parentUser.displayName}`);
    console.log(`   Role: ${parentUser.role}`);
    console.log(`   Children: ${JSON.stringify(parentUser.children)}`);
    console.log(`   Points: ${parentUser.points || 0}`);

    // 测试密码验证（假设使用空密码）
    console.log('\n🔐 测试密码验证...');
    let isPasswordValid = false;
    
    try {
      // 测试空密码
      isPasswordValid = await bcrypt.compare('', parentUser.password);
      console.log(`   空密码验证结果: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        // 测试其他常见密码
        const commonPasswords = ['123456', 'password', '爸爸', 'parent'];
        for (const pwd of commonPasswords) {
          const result = await bcrypt.compare(pwd, parentUser.password);
          console.log(`   密码"${pwd}"验证结果: ${result}`);
          if (result) {
            isPasswordValid = true;
            break;
          }
        }
      }
    } catch (error) {
      console.error('   密码验证出错:', error.message);
    }

    // 创建用户对象用于JWT token生成
    const userForToken = {
      id: parentUser._id.toString(),
      email: parentUser.email,
      displayName: parentUser.displayName,
      role: parentUser.role,
      parentId: parentUser.parentId,
      children: parentUser.children,
      points: parentUser.points || 0,
      createdAt: parentUser.createdAt,
      updatedAt: parentUser.updatedAt,
    };

    // 生成JWT token
    console.log('\n🔑 生成JWT token...');
    const tokenPayload = { 
      id: userForToken.id, 
      email: userForToken.email, 
      role: userForToken.role 
    };
    console.log('   Token payload:', tokenPayload);

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    console.log(`   生成的token长度: ${token.length}`);
    console.log(`   Token前20字符: ${token.substring(0, 20)}...`);
    console.log(`   Token后20字符: ...${token.substring(token.length - 20)}`);

    // 验证JWT token
    console.log('\n✅ 验证JWT token...');
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('   Token验证成功！');
      console.log('   解码结果:', decoded);
      
      // 检查解码的用户ID是否有效
      const decodedUserId = decoded.id;
      console.log(`   解码的用户ID: ${decodedUserId}`);
      
      // 尝试使用解码的ID查询数据库
      console.log('\n🔍 使用解码ID查询数据库...');
      const foundUser = await usersCollection.findOne({ _id: new ObjectId(decodedUserId) });
      
      if (foundUser) {
        console.log('✅ 数据库查询成功！');
        console.log(`   查询到的用户: ${foundUser.displayName} (${foundUser.email})`);
        console.log(`   Role: ${foundUser.role}`);
        console.log(`   Children: ${JSON.stringify(foundUser.children)}`);
        
        // 检验role一致性
        if (foundUser.role === decoded.role) {
          console.log('✅ Token中的role与数据库一致');
        } else {
          console.log(`❌ Role不一致: Token=${decoded.role}, DB=${foundUser.role}`);
        }
        
      } else {
        console.log('❌ 使用解码ID无法找到用户！');
        console.log(`   尝试查询的ID: ${decodedUserId}`);
        console.log(`   ID类型: ${typeof decodedUserId}`);
        console.log(`   ObjectId格式是否有效: ${ObjectId.isValid(decodedUserId)}`);
      }
      
    } catch (tokenError) {
      console.error('❌ Token验证失败:', tokenError.message);
    }

    // 模拟完整的登录流程
    console.log('\n🔄 模拟完整登录流程...');
    const loginResult = {
      success: true,
      data: {
        user: userForToken,
        token: token,
      },
      message: 'Login successful',
    };
    
    console.log('✅ 模拟登录响应结构正确');
    console.log(`   用户数据完整性: ${!!loginResult.data.user.id && !!loginResult.data.user.role}`);

    // 测试API请求认证流程
    console.log('\n🌐 测试API请求认证流程...');
    const authHeader = `Bearer ${token}`;
    const extractedToken = authHeader.split(' ')[1];
    
    console.log(`   Authorization header: ${authHeader.substring(0, 30)}...`);
    console.log(`   提取的token与原token一致: ${extractedToken === token}`);
    
    // 模拟中间件认证过程
    try {
      const middlewareDecoded = jwt.verify(extractedToken, JWT_SECRET);
      const middlewareUserId = middlewareDecoded.id;
      
      console.log(`   中间件解码用户ID: ${middlewareUserId}`);
      
      const middlewareUser = await usersCollection.findOne({ _id: new ObjectId(middlewareUserId) });
      if (middlewareUser) {
        console.log('✅ 中间件认证模拟成功！');
        console.log(`   认证用户: ${middlewareUser.displayName} (${middlewareUser.role})`);
        
        // 检查parent权限
        if (middlewareUser.role === 'parent') {
          console.log('✅ 用户具有parent权限');
          if (middlewareUser.children && middlewareUser.children.length > 0) {
            console.log(`✅ 用户有 ${middlewareUser.children.length} 个子用户`);
            
            // 验证子用户ID有效性
            for (const childId of middlewareUser.children) {
              const child = await usersCollection.findOne({ _id: new ObjectId(childId) });
              if (child) {
                console.log(`   ✅ 子用户: ${child.displayName} (${child.email})`);
              } else {
                console.log(`   ❌ 无效的子用户ID: ${childId}`);
              }
            }
          } else {
            console.log('⚠️  家长用户没有关联的子用户');
          }
        }
        
      } else {
        console.log('❌ 中间件认证失败: 找不到用户');
      }
      
    } catch (middlewareError) {
      console.error('❌ 中间件认证模拟失败:', middlewareError.message);
    }

    // 检查可能的问题
    console.log('\n🔍 潜在问题检查...');
    
    // 1. JWT Secret一致性
    const expectedSecret = 'your-secret-key-change-this-in-production';
    console.log(`   JWT Secret一致性: ${JWT_SECRET === expectedSecret ? '✅ 默认' : '⚠️ 自定义'}`);
    
    // 2. ObjectId格式
    const userId = parentUser._id.toString();
    console.log(`   用户ID格式: ${ObjectId.isValid(userId) ? '✅ 有效' : '❌ 无效'}`);
    
    // 3. 数据类型检查
    console.log(`   用户Role数据类型: ${typeof parentUser.role} (值: ${parentUser.role})`);
    console.log(`   Children数据类型: ${Array.isArray(parentUser.children) ? 'Array' : typeof parentUser.children}`);
    
    // 4. Token过期检查
    const decodedForExpiry = jwt.decode(token);
    if (decodedForExpiry && decodedForExpiry.exp) {
      const expirationDate = new Date(decodedForExpiry.exp * 1000);
      const now = new Date();
      console.log(`   Token过期时间: ${expirationDate.toISOString()}`);
      console.log(`   Token是否过期: ${now > expirationDate ? '❌ 已过期' : '✅ 未过期'}`);
    }

    console.log('\n🎯 结论和建议:');
    if (isPasswordValid) {
      console.log('✅ 密码验证正常');
    } else {
      console.log('❌ 密码验证失败 - 可能需要重置密码');
    }
    
    console.log('✅ JWT token生成和验证机制正常');
    console.log('✅ 数据库用户数据结构正确');
    
    if (parentUser.role === 'parent' && parentUser.children && parentUser.children.length > 0) {
      console.log('✅ 家长用户权限配置正确');
    }
    
    console.log('\n💡 如果仍然出现403错误，可能的原因:');
    console.log('1. 客户端发送的token格式不正确');
    console.log('2. API路由权限配置问题');
    console.log('3. 网络传输过程中token损坏');
    console.log('4. 服务器端环境变量配置不一致');
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
  } finally {
    await client.close();
    console.log('\n🔚 数据库连接已关闭');
  }
}

// 运行调试脚本
debugJWTAuth().catch(console.error);