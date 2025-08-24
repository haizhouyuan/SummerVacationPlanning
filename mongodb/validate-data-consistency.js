// 数据校验脚本：验证积分一致性和关联关系
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';

/**
 * 综合数据一致性校验脚本
 * 
 * 验证内容：
 * 1. 用户积分一致性：user.points = sum(approved_daily_tasks.pointsEarned + bonusPoints)
 * 2. 引用完整性：dailyTasks.taskId 对应的 tasks 记录存在
 * 3. 用户关系完整性：parent-child 关系双向一致
 * 4. 积分规则完整性：tasks.activity 对应 pointsRules 存在
 * 5. 审批状态一致性：pendingPoints 与 approvalStatus 的逻辑一致性
 * 6. 数据库索引完整性：所有必要索引是否存在且有效
 * 7. 字段类型一致性：确保字段类型符合预期
 * 8. 业务逻辑一致性：日期、状态转换等业务规则
 */

class DataValidator {
  constructor(db) {
    this.db = db;
    this.errors = [];
    this.warnings = [];
    this.stats = {};
  }

  log(level, category, message, details = null) {
    const logEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      details
    };
    
    if (level === 'ERROR') {
      this.errors.push(logEntry);
      console.log(`❌ [${category}] ${message}`);
    } else if (level === 'WARNING') {
      this.warnings.push(logEntry);
      console.log(`⚠️  [${category}] ${message}`);
    } else {
      console.log(`✅ [${category}] ${message}`);
    }
    
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async validateUserPointsConsistency() {
    console.log('\\n1️⃣  Validating User Points Consistency...');
    
    const usersCollection = this.db.collection('users');
    const dailyTasksCollection = this.db.collection('dailyTasks');
    
    const students = await usersCollection.find({ role: 'student' }).toArray();
    let inconsistentUsers = 0;
    let totalPointsIssue = 0;
    
    for (const user of students) {
      const approvedTasks = await dailyTasksCollection.find({
        userId: user._id.toString(),
        approvalStatus: 'approved'
      }).toArray();
      
      const calculatedPoints = approvedTasks.reduce((total, task) => {
        return total + (task.pointsEarned || 0) + (task.bonusPoints || 0);
      }, 0);
      
      const userRecordPoints = user.points || 0;
      const difference = Math.abs(calculatedPoints - userRecordPoints);
      
      if (difference > 0) {
        inconsistentUsers++;
        totalPointsIssue += difference;
        
        this.log('ERROR', 'POINTS_CONSISTENCY', 
          `User ${user.displayName} has inconsistent points`, {
            userId: user._id,
            calculated: calculatedPoints,
            recorded: userRecordPoints,
            difference: difference
          });
      }
    }
    
    this.stats.userPointsConsistency = {
      totalStudents: students.length,
      inconsistentUsers,
      totalPointsIssue
    };
    
    if (inconsistentUsers === 0) {
      this.log('INFO', 'POINTS_CONSISTENCY', `All ${students.length} students have consistent points`);
    }
  }

  async validateReferentialIntegrity() {
    console.log('\\n2️⃣  Validating Referential Integrity...');
    
    // 检查 dailyTasks.taskId -> tasks._id 关系
    const dailyTasksCollection = this.db.collection('dailyTasks');
    const tasksCollection = this.db.collection('tasks');
    
    const allDailyTasks = await dailyTasksCollection.find({}).toArray();
    const allTaskIds = [...new Set(allDailyTasks.map(dt => dt.taskId))];
    
    let missingTaskRefs = 0;
    
    for (const taskId of allTaskIds) {
      const taskExists = await tasksCollection.findOne({
        $or: [
          { _id: new ObjectId(taskId) },
          { id: taskId }
        ]
      });
      
      if (!taskExists) {
        missingTaskRefs++;
        const affectedDailyTasks = allDailyTasks.filter(dt => dt.taskId === taskId).length;
        
        this.log('ERROR', 'REFERENTIAL_INTEGRITY', 
          `Missing task template ${taskId}`, {
            taskId,
            affectedDailyTasks
          });
      }
    }
    
    // 检查 users 父子关系一致性
    const usersCollection = this.db.collection('users');
    const parents = await usersCollection.find({ role: 'parent' }).toArray();
    const students = await usersCollection.find({ role: 'student' }).toArray();
    
    let parentChildInconsistencies = 0;
    
    for (const parent of parents) {
      if (parent.children && Array.isArray(parent.children)) {
        for (const childId of parent.children) {
          const child = students.find(s => s._id.toString() === childId);
          if (!child) {
            parentChildInconsistencies++;
            this.log('ERROR', 'PARENT_CHILD_RELATION', 
              `Parent ${parent.displayName} references non-existent child ${childId}`);
          } else if (child.parentId !== parent._id.toString()) {
            parentChildInconsistencies++;
            this.log('ERROR', 'PARENT_CHILD_RELATION', 
              `Parent-child relationship inconsistency`, {
                parentId: parent._id,
                childId: childId,
                childParentId: child.parentId
              });
          }
        }
      }
    }
    
    this.stats.referentialIntegrity = {
      missingTaskRefs,
      parentChildInconsistencies
    };
  }

  async validateActivityPointsRules() {
    console.log('\\n3️⃣  Validating Activity Points Rules...');
    
    const tasksCollection = this.db.collection('tasks');
    const pointsRulesCollection = this.db.collection('pointsRules');
    
    const allTasks = await tasksCollection.find({}).toArray();
    const allPointsRules = await pointsRulesCollection.find({}).toArray();
    
    const activitiesWithRules = new Set(allPointsRules.map(pr => pr.activity));
    const activitiesInTasks = new Set(allTasks.map(t => t.activity).filter(a => a));
    
    let missingActivityRules = 0;
    let unusedActivityRules = 0;
    
    // 检查任务中的activity是否都有对应的积分规则
    for (const activity of activitiesInTasks) {
      if (!activitiesWithRules.has(activity)) {
        missingActivityRules++;
        const affectedTasks = allTasks.filter(t => t.activity === activity).length;
        
        this.log('WARNING', 'ACTIVITY_POINTS_RULES', 
          `No points rule for activity: ${activity}`, {
            activity,
            affectedTasks
          });
      }
    }
    
    // 检查积分规则中是否有未使用的activity
    for (const activity of activitiesWithRules) {
      if (!activitiesInTasks.has(activity)) {
        unusedActivityRules++;
        this.log('WARNING', 'ACTIVITY_POINTS_RULES', 
          `Unused points rule for activity: ${activity}`);
      }
    }
    
    this.stats.activityPointsRules = {
      totalActivitiesInTasks: activitiesInTasks.size,
      totalPointsRules: activitiesWithRules.size,
      missingActivityRules,
      unusedActivityRules
    };
  }

  async validateApprovalStatusConsistency() {
    console.log('\\n4️⃣  Validating Approval Status Consistency...');
    
    const dailyTasksCollection = this.db.collection('dailyTasks');
    
    // 检查待审批任务是否有pendingPoints
    const pendingWithoutPendingPoints = await dailyTasksCollection.countDocuments({
      approvalStatus: 'pending',
      pendingPoints: { $exists: false }
    });
    
    // 检查已审批任务是否还有pendingPoints（应该被清除）
    const approvedWithPendingPoints = await dailyTasksCollection.countDocuments({
      approvalStatus: 'approved',
      pendingPoints: { $exists: true, $gt: 0 }
    });
    
    // 检查已拒绝任务是否还有pendingPoints（应该被清除）
    const rejectedWithPendingPoints = await dailyTasksCollection.countDocuments({
      approvalStatus: 'rejected',
      pendingPoints: { $exists: true, $gt: 0 }
    });
    
    // 检查已审批任务是否有pointsEarned
    const approvedWithoutPointsEarned = await dailyTasksCollection.countDocuments({
      approvalStatus: 'approved',
      pointsEarned: { $lte: 0 }
    });
    
    if (pendingWithoutPendingPoints > 0) {
      this.log('ERROR', 'APPROVAL_STATUS', 
        `${pendingWithoutPendingPoints} pending tasks missing pendingPoints`);
    }
    
    if (approvedWithPendingPoints > 0) {
      this.log('ERROR', 'APPROVAL_STATUS', 
        `${approvedWithPendingPoints} approved tasks still have pendingPoints`);
    }
    
    if (rejectedWithPendingPoints > 0) {
      this.log('ERROR', 'APPROVAL_STATUS', 
        `${rejectedWithPendingPoints} rejected tasks still have pendingPoints`);
    }
    
    if (approvedWithoutPointsEarned > 0) {
      this.log('WARNING', 'APPROVAL_STATUS', 
        `${approvedWithoutPointsEarned} approved tasks have no pointsEarned`);
    }
    
    this.stats.approvalStatusConsistency = {
      pendingWithoutPendingPoints,
      approvedWithPendingPoints,
      rejectedWithPendingPoints,
      approvedWithoutPointsEarned
    };
  }

  async validateDatabaseIndexes() {
    console.log('\\n5️⃣  Validating Database Indexes...');
    
    const requiredIndexes = {
      'users': [
        { key: { email: 1 }, unique: true },
        { key: { role: 1 } },
        { key: { parentId: 1 } }
      ],
      'tasks': [
        { key: { isPublic: 1, category: 1 } },
        { key: { createdBy: 1 } }
      ],
      'dailyTasks': [
        { key: { userId: 1, date: -1 } },
        { key: { userId: 1, taskId: 1, date: 1 }, unique: true },
        { key: { approvalStatus: 1 } }
      ],
      'pointsRules': [
        { key: { activity: 1 }, unique: true }
      ],
      'userPointsLimits': [
        { key: { userId: 1, date: 1 }, unique: true }
      ]
    };
    
    let missingIndexes = 0;
    
    for (const [collectionName, indexes] of Object.entries(requiredIndexes)) {
      try {
        const collection = this.db.collection(collectionName);
        const existingIndexes = await collection.indexes();
        
        for (const requiredIndex of indexes) {
          const found = existingIndexes.find(existing => {
            return JSON.stringify(existing.key) === JSON.stringify(requiredIndex.key);
          });
          
          if (!found) {
            missingIndexes++;
            this.log('ERROR', 'DATABASE_INDEXES', 
              `Missing index in ${collectionName}`, {
                collection: collectionName,
                requiredKey: requiredIndex.key,
                unique: requiredIndex.unique || false
              });
          }
        }
      } catch (error) {
        this.log('WARNING', 'DATABASE_INDEXES', 
          `Could not check indexes for ${collectionName}: ${error.message}`);
      }
    }
    
    this.stats.databaseIndexes = { missingIndexes };
  }

  async validateFieldTypes() {
    console.log('\\n6️⃣  Validating Field Types...');
    
    const dailyTasksCollection = this.db.collection('dailyTasks');
    const usersCollection = this.db.collection('users');
    
    // 检查用户积分字段类型
    const usersWithInvalidPoints = await usersCollection.countDocuments({
      points: { $type: "string" } // 积分应该是数字，不是字符串
    });
    
    // 检查DailyTasks的日期格式
    const invalidDateFormatTasks = await dailyTasksCollection.find({
      date: { $not: { $regex: /^\\d{4}-\\d{2}-\\d{2}$/ } }
    }).toArray();
    
    // 检查pointsEarned和pendingPoints是否为数字
    const invalidPointsEarnedTasks = await dailyTasksCollection.countDocuments({
      pointsEarned: { $type: "string" }
    });
    
    const invalidPendingPointsTasks = await dailyTasksCollection.countDocuments({
      pendingPoints: { $type: "string" }
    });
    
    if (usersWithInvalidPoints > 0) {
      this.log('ERROR', 'FIELD_TYPES', 
        `${usersWithInvalidPoints} users have string-type points (should be number)`);
    }
    
    if (invalidDateFormatTasks.length > 0) {
      this.log('ERROR', 'FIELD_TYPES', 
        `${invalidDateFormatTasks.length} daily tasks have invalid date format`, {
          sampleInvalidDates: invalidDateFormatTasks.slice(0, 3).map(t => t.date)
        });
    }
    
    if (invalidPointsEarnedTasks > 0) {
      this.log('ERROR', 'FIELD_TYPES', 
        `${invalidPointsEarnedTasks} daily tasks have string-type pointsEarned`);
    }
    
    if (invalidPendingPointsTasks > 0) {
      this.log('ERROR', 'FIELD_TYPES', 
        `${invalidPendingPointsTasks} daily tasks have string-type pendingPoints`);
    }
    
    this.stats.fieldTypes = {
      usersWithInvalidPoints,
      invalidDateFormatTasks: invalidDateFormatTasks.length,
      invalidPointsEarnedTasks,
      invalidPendingPointsTasks
    };
  }

  async validateBusinessLogic() {
    console.log('\\n7️⃣  Validating Business Logic...');
    
    const dailyTasksCollection = this.db.collection('dailyTasks');
    
    // 检查未来日期的任务（可能是数据错误）
    const today = new Date().toISOString().split('T')[0];
    const futureTasks = await dailyTasksCollection.countDocuments({
      date: { $gt: today }
    });
    
    // 检查完成时间早于创建时间的任务
    const invalidTimestampTasks = await dailyTasksCollection.find({
      $expr: { $lt: ["$completedAt", "$createdAt"] }
    }).toArray();
    
    // 检查status与completedAt字段的一致性
    const completedWithoutTimestamp = await dailyTasksCollection.countDocuments({
      status: 'completed',
      completedAt: { $exists: false }
    });
    
    const pendingWithTimestamp = await dailyTasksCollection.countDocuments({
      status: { $in: ['planned', 'in_progress'] },
      completedAt: { $exists: true }
    });
    
    if (futureTasks > 0) {
      this.log('WARNING', 'BUSINESS_LOGIC', 
        `${futureTasks} tasks scheduled for future dates`);
    }
    
    if (invalidTimestampTasks.length > 0) {
      this.log('ERROR', 'BUSINESS_LOGIC', 
        `${invalidTimestampTasks.length} tasks with completedAt before createdAt`);
    }
    
    if (completedWithoutTimestamp > 0) {
      this.log('ERROR', 'BUSINESS_LOGIC', 
        `${completedWithoutTimestamp} completed tasks missing completedAt timestamp`);
    }
    
    if (pendingWithTimestamp > 0) {
      this.log('WARNING', 'BUSINESS_LOGIC', 
        `${pendingWithTimestamp} non-completed tasks have completedAt timestamp`);
    }
    
    this.stats.businessLogic = {
      futureTasks,
      invalidTimestampTasks: invalidTimestampTasks.length,
      completedWithoutTimestamp,
      pendingWithTimestamp
    };
  }

  generateReport() {
    console.log('\\n📊 Data Validation Summary Report');
    console.log('=' .repeat(60));
    
    console.log(`\\n🎯 Overall Status:`);
    console.log(`   - Errors found: ${this.errors.length}`);
    console.log(`   - Warnings found: ${this.warnings.length}`);
    console.log(`   - Validation status: ${this.errors.length === 0 ? '✅ PASSED' : '❌ FAILED'}`);
    
    console.log(`\\n📈 Detailed Statistics:`);
    Object.entries(this.stats).forEach(([category, stats]) => {
      console.log(`   ${category}:`);
      Object.entries(stats).forEach(([key, value]) => {
        console.log(`     - ${key}: ${value}`);
      });
    });
    
    if (this.errors.length > 0) {
      console.log(`\\n❌ Critical Errors (${this.errors.length}):`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.category}] ${error.message}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. [${warning.category}] ${warning.message}`);
      });
    }
    
    console.log(`\\n💡 Recommendations:`);
    if (this.errors.length > 0) {
      console.log('   1. Fix critical errors before deploying to production');
      console.log('   2. Run database repair scripts for data inconsistencies');
      console.log('   3. Update application code to prevent future issues');
    }
    if (this.warnings.length > 0) {
      console.log('   4. Review warnings and consider cleanup actions');
      console.log('   5. Monitor data quality regularly');
    }
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('   ✅ Database is in excellent condition!');
      console.log('   ✅ All validations passed successfully');
      console.log('   💡 Consider regular validation runs');
    }
    
    return {
      status: this.errors.length === 0 ? 'PASSED' : 'FAILED',
      errorsCount: this.errors.length,
      warningsCount: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings,
      stats: this.stats
    };
  }
}

async function validateDataConsistency() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    console.log(`Validating database: ${db.databaseName}`);
    
    const validator = new DataValidator(db);
    
    // 运行所有验证
    await validator.validateUserPointsConsistency();
    await validator.validateReferentialIntegrity();
    await validator.validateActivityPointsRules();
    await validator.validateApprovalStatusConsistency();
    await validator.validateDatabaseIndexes();
    await validator.validateFieldTypes();
    await validator.validateBusinessLogic();
    
    // 生成报告
    const report = validator.generateReport();
    
    // 保存验证结果到数据库
    await db.collection('validationReports').insertOne({
      timestamp: new Date(),
      ...report,
      databaseName: db.databaseName
    });
    
    console.log('\\n💾 Validation report saved to database');
    
    return report;
    
  } catch (error) {
    console.error('Error during data validation:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  validateDataConsistency().catch(console.error);
}

module.exports = { validateDataConsistency, DataValidator };