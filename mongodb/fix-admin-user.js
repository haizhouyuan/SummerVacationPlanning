// 修复管理员账户密码问题
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('../backend/node_modules/bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';

async function fixAdminUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // 查找管理员账户
    const adminUser = await usersCollection.findOne({ email: 'admin@summer.app' });
    
    if (!adminUser) {
      console.log('Admin user not found, creating new admin user...');
      
      // 创建新的管理员账户
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const newAdminUser = {
        email: 'admin@summer.app',
        displayName: '系统管理员',
        role: 'admin',
        password: hashedPassword,
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
      };
      
      const insertResult = await usersCollection.insertOne(newAdminUser);
      console.log('✅ Created new admin user with ID:', insertResult.insertedId);
      
    } else {
      console.log('Found existing admin user:', adminUser.email);
      
      // 检查是否有密码
      if (!adminUser.password) {
        console.log('Admin user missing password, adding password...');
        
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const updateResult = await usersCollection.updateOne(
          { _id: adminUser._id },
          { 
            $set: { 
              password: hashedPassword,
              updatedAt: new Date()
            }
          }
        );
        
        console.log('✅ Added password to existing admin user');
        console.log('Updated documents:', updateResult.modifiedCount);
      } else {
        console.log('✅ Admin user already has password');
      }
    }
    
    // 验证结果
    const verifyAdmin = await usersCollection.findOne({ email: 'admin@summer.app' });
    console.log('\nVerification:');
    console.log('- Email:', verifyAdmin.email);
    console.log('- Display Name:', verifyAdmin.displayName);
    console.log('- Role:', verifyAdmin.role);
    console.log('- Has Password:', !!verifyAdmin.password);
    console.log('- Password Length:', verifyAdmin.password ? verifyAdmin.password.length : 0);
    
    console.log('\n✅ Admin user setup completed successfully!');
    console.log('📝 Default credentials: admin@summer.app / admin123');
    
  } catch (error) {
    console.error('Error fixing admin user:', error);
  } finally {
    await client.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  fixAdminUser().catch(console.error);
}

module.exports = { fixAdminUser };