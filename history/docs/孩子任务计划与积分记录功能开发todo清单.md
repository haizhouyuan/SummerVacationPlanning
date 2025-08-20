孩子任务计划与积分记录功能 开发 ToDo 清单
开发准备

从 master 创建新功能分支：基于 master 分支创建一个新的功能分支（例如feature/complete-task-points）用于本次开发。确保拉取最新代码后再开始，在该分支上进行所有前后端改动，完成后再合并回主干。

数据库与配置

MongoDB 连接配置：检查并配置后端的 MongoDB 连接。如果后端尚未连上 MongoDB，需要在 backend/.env 中设置正确的 MONGO_URI（如本地开发使用 mongodb://127.0.0.1:27017/summer_app）
。确认 backend/src/config/mongodb.ts 中的连接逻辑正常，并在应用启动时调用 mongodb.connect() 及 initializeCollections() 初始化集合
。确保已有的集合名称（如 users, tasks, dailyTasks 等）与计划功能所需相符
。如果第一次使用 MongoDB，可以运行 mongodb/init.js 和 mongodb/indexes.js 初始化基础数据和索引
。

数据库模型检查：根据功能需求检查相关数据模型。确保 Task 模型包含标题、描述、类别、难度、预计时长、积分、是否需要证据等字段
；User 模型具有区分学生/家长角色和积分字段，以及家长与孩子的关联关系
；DailyTask 模型用于记录每日计划任务，包括任务引用、状态、完成证据、积分、审批状态等
。如果缺少字段，需在类型定义和数据库集合中加入，例如 DailyTask 需要 approvalStatus（pending/approved/rejected）和 pointsEarned 字段以支持审批和积分统计
。

后端开发任务

实现每日任务计划 API：在后端新增每日任务（DailyTask）的路由和控制器，实现孩子制定每日计划的功能。新建文件 backend/src/routes/dailyTaskRoutes.ts（并在 app.ts 中确保已挂载到 /api/daily-tasks 路径
）以及对应的控制器 backend/src/controllers/dailyTaskController.ts。实现以下接口：

POST /api/daily-tasks：保存孩子规划的任务。请求包含 taskId 和 date（以及可选备注等）。控制器应获取当前登录用户（学生）ID和请求数据，在 dailyTasks 集合中新建文档，字段包括userId（学生ID）、taskId、date、status初始为planned、planningNotes/notes等，设置 createdAt/updatedAt。确保同一任务不重复添加到同一天（可在插入前查询是否已存在相同userId+taskId+date的记录）。插入成功后返回新建的 dailyTask 数据供前端使用
。

GET /api/daily-tasks?date=YYYY-MM-DD：按日期查询每日任务列表。控制器根据req.user判断角色：若为学生，查询该学生在指定日期的所有 DailyTask；若为家长，查询其所有孩子在该日期的任务（可选扩展）。支持通过查询参数过滤日期。返回结果列表，供前端任务页面加载当天计划
。注意返回时将 _id 转为字符串id供前端使用，或者直接返回ApiResponse格式的数据结构。

实现任务完成及证据上传：支持孩子提交任务完成情况，包括文字心得和图片/视频证据
。在 dailyTaskRoutes.ts 中添加以下端点及逻辑：

PUT /api/daily-tasks/:dailyTaskId：孩子标记任务为"完成"。请求体包括 status: 'completed'，以及可能的 evidenceText 和 evidenceMedia（上传文件的URL或标识）。控制器需验证该 dailyTask 属于当前学生且尚未完成，然后执行更新：设置其 status 为 'completed'，记录 completedAt=当前时间，保存提交的 evidenceText 文本心得，以及将 evidenceMedia（包含文件类型、URL等）存入 DailyTask 文档的证据列表字段
。同时设置 approvalStatus='pending' 表示进入待审核状态
。根据任务的基础积分计算出此次获得的积分，例如直接取对应 Task 的 points 字段，写入 DailyTask 的 pointsEarned
（如需根据任务时长或难度重新计算积分也可使用类似 calculateTaskPoints 函数
）。更新完成后返回成功响应。前端调用此接口后会刷新当天任务列表并提示积分奖励
。

POST /api/daily-tasks/evidence/upload：实现文件上传接口用于接收前端上传的图片/视频文件。在路由中使用中间件（如 multer）处理 multipart/form-data 请求，将文件保存到服务器本地的 /uploads 目录（app.ts 已将该目录配置为静态资源路径
）。上传成功后，返回带有文件访问URL及文件类型/大小等信息的响应（如 { success:true, data:{ url, type, size, filename } }）。前端在 EvidenceModal 中通过 uploadService.uploadFileToBackend() 调用此接口
获取文件URL，然后将 URL 列表作为 evidenceMedia 提交到上面的任务完成接口。务必在后端校验文件类型和大小，限制仅允许安全的图片/视频格式（例如 JPEG/PNG/MP4 等）且大小不超过上限
。保存文件时可按用户ID/任务ID分类存放路径，确保不同用户的证据分开存储。

实现家长审批与积分发放：支持家长查看并审核孩子完成的任务，以发放积分奖励
。在 dailyTaskRoutes.ts 添加以下端点：

GET /api/daily-tasks/pending-approval：家长获取待自己审核的任务列表。控制器需要验证请求用户身份是家长，然后查询其管理的所有孩子列表（从User模型的children字段获取孩子ID数组
）。在 dailyTasks 集合中查找这些userId对应的记录中 approvalStatus 为 'pending' 的任务，将结果按需要格式化后返回。为方便前端展示，可在返回数据中嵌入关联的信息：例如查询每条 DailyTask 对应的 Task 文档，取出任务标题、类别、基础积分等字段，以及孩子的姓名
。也可以简单返回 dailyTasks 列表，由前端根据 taskId 和 userId 再调用其它接口获取详情。注意：如果需要展示已审批过的任务，可考虑该接口返回包含 pending、approved、rejected 三种状态任务（前端组件已区分标签页显示
），或者另提供筛选参数。

PUT /api/daily-tasks/:dailyTaskId/approve：家长审批任务接口。请求体包含 action 字段（值为 'approve' 或 'reject'），以及可选的 approvalNotes（审批备注）和 bonusPoints（额外奖励积分，当 action 为 approve 时）。控制器逻辑：首先根据 URL 参数获取对应的 DailyTask，并验证当前用户是该任务所属孩子的家长（可通过比较 DailyTask.userId 对应的 User.parentId 是否为当前家长ID来确认
）。然后根据 action 执行不同操作：

approve：将该 DailyTask 的 approvalStatus 更新为 'approved'，填写 approvedBy=当前家长ID，approvedAt=当前时间，保存备注和 bonusPoints
。计算最终获得积分 = DailyTask.pointsEarned + (bonusPoints 或0)。在任务审批通过时，需要将该积分正式记入孩子的账户：更新对应孩子 User 文档的 points 累加上述积分
。同时可以更新 DailyTask 的 bonusPoints 字段保存额外积分
。如果有需要，也可以在此生成一条积分获取记录到"积分历史"集合（若有设计积分流水的话）。最后返回成功响应，例如 { success:true }。前端收到成功后应将该任务从待审批列表移除并显示在已批准列表
。

reject：将 DailyTask 的 approvalStatus 更新为 'rejected'，填写 approvedBy（家长ID）、approvedAt 和备注
。拒绝情况下不给积分，孩子之前暂存的 pointsEarned 也可以保持不变（或设为0表示无效）。返回成功后，前端应将任务从待审批列表移至已拒绝列表
。

权限和错误处理：对于上述审批相关接口，确保加入校验：非家长角色调用时返回 403 禁止访问；如果 dailyTask 已经是最终状态也拒绝重复审批。所有操作成功或失败都返回明确的 JSON 消息方便前端提示。

完善积分结算逻辑：调整系统在任务完成和审批过程中的积分计算与记录方式，确保积分正确累计到孩子账户
。具体包括：

自动发放基础积分：根据需求决定任务完成后是否立即给基础积分。当前流程建议在任务标记完成(status='completed')时暂不直接加到User积分，而是先存在 DailyTask.pointsEarned 字段等待审批。待家长审核通过后再真正把积分计入 User.points，以确保家长审核环节可以把关孩子的任务真实性
。不过对于不需要家长审核的任务（如 requiresEvidence=false 的任务），可以在标记完成时直接将 DailyTask.approvalStatus 设为 'approved' 表示系统自动确认，通过程序立即把积分计入孩子账户，以简化流程
。

积分规则与上限：如果项目有定义每日积分上限或不同任务类别的积分规则（如 types 中 PointsRule 配置
），在赋值 DailyTask.pointsEarned 时应检查并应用这些规则。例如控制某些活动每日最多得多少分（dailyLimit），或根据难度/时长调整积分。确保在家长审批时也遵循这些规则，不因为 bonus 打破上限（除非有意设计）。在代码实现上，可在任务完成或审批通过时增加检查逻辑，或通过在 PointsRule 中预先定义规则然后引用。

连续完成与成就：在审批通过给予积分后，考虑更新用户的成就数据。例如更新 User.currentStreak（连续天数）和奖章medals
——若当天所有任务完成则 currentStreak++，达到特定天数时升级 medal 等。此部分可在每日任务全部完成后由另一个流程处理，但也可在每次任务审批通过时检查并更新 streak。此改动涉及 User 文档的字段更新，需小心处理边界条件（如中断连续天数）。

积分日志记录（可选）：为方便日后查询积分获取记录，可在每次任务审批通过时记录一条日志，例如插入一个 pointsHistory 集合，内容包括用户ID、类型（任务完成/奖励兑换等）、积分变动值、时间、关联的任务或操作id等。这样前端可以实现积分历史查看功能（API 已预留 /auth/points-history
）。如果当前项目中没有专门的积分历史表，也可利用 DailyTask 自身的数据（pointsEarned, bonusPoints, approvedAt 等）来统计。

前端开发任务

任务库与新任务创建界面：在前端完善任务库（TaskLibrary）功能，允许用户创建新任务并添加到任务库列表中。检查 frontend/src/components/TaskLibrary.tsx 实现，目前任务库支持按类别/难度筛选和搜索，但缺少新增任务入口。计划在任务库界面添加"新增任务"按钮（仅家长或管理员可见，或所有登录用户可见视需求）。点击后弹出表单对话框，表单字段包括：任务标题、描述、类别、难度、预计时间、奖励积分、是否需要家长审核(证据)等
。提交表单时，调用 apiService.createTask(taskData) 方法，将新任务POST到后端 /api/tasks 接口创建

。后端已有 taskRoutes 定义，确认 POST /api/tasks 由 createTask 控制器处理新任务保存
。前端成功创建任务后，可在任务库列表中加入该任务项，并提供反馈（如通知"任务已添加到任务库"）。同时，考虑在任务库界面增加筛选和排序UI改进（例如按积分或时间排序已经在数据获取时支持
），以方便孩子浏览可选任务。

对接每日任务规划流程：确保前端任务规划页正确调用后端 API 实现完整流程。检查并完善 frontend/src/pages/TaskPlanning.tsx：

页面加载时，应调用 apiService.getTasks() 拉取任务库列表供选择
；调用 apiService.getDailyTasks({ date }) 拉取选定日期已规划的任务
；以及 apiService.getRecommendedTasks() 获取推荐任务
。这些调用应对应后端实现的数据接口。确认筛选日期（selectedDate）变化时会重新加载 dailyTasks 列表
。

在任务选择界面中，多选几个任务后点击"规划任务"按钮时，组件目前遍历所选任务调用 apiService.createDailyTask 将任务逐个提交到后端
。需要确保后端 POST /daily-tasks 接口按上述逻辑工作，以成功返回新增的 dailyTask。前端收到响应后，清空已选择任务并刷新当天任务列表
。测试选择任务->规划流程，观察任务是否正确出现在"今日任务"页。

若任务库支持自定义任务或公共任务（Task有 isPublic 字段
），考虑在 TaskPlanning 上增加筛选，仅显示自己创建或公共任务，避免干扰。这个可根据实际需要实现。

完成任务提交与证据上传 UI：实现学生在前端提交任务完成的交互。涉及 frontend/src/pages/TodayTasks.tsx 以及证据上传弹窗 frontend/src/components/EvidenceModal.tsx 等：

在今日任务列表（DailyTaskCard组件）中，为状态为"planned"的任务提供"标记完成"按钮。点击后弹出 EvidenceModal，提示孩子填写文字心得（文本证据）并可选择上传图片或视频文件作为证明
。EvidenceModal 中调用 uploadService.uploadFileToBackend(file) 将文件上传到后端
。上传成功后，后端返回的文件URL将存入 EvidenceModal 的 state。

孩子填写完证据后提交表单时，调用 apiService.updateDailyTaskStatus(dailyTaskId, { status:'completed', evidenceText:文本内容, evidenceMedia:上传返回的文件信息数组 })
。后端将据此更新 DailyTask 状态和证据字段。如果成功，前端执行：

关闭证据弹窗，重载今日任务列表 loadTodayTasks()
以显示最新状态；

更新当前用户积分（调用 refreshUser() 重新获取用户信息）
；

弹出成功提示，例如"任务完成！获得X积分！"
。其中积分数可从响应的 DailyTask.pointsEarned 或更新后的 user.points 计算得出。在当前实现中，组件通过之前保存的任务数据计算获得积分
。确保此处显示的积分与实际发放吻合。

验证以上流程在无网络或接口异常时给予错误提示（组件已有 showError 调用
）。同时在UI上标记已完成任务（例如在 DailyTaskCard 上改变样式或显示"已提交，待家长审核"字样），提示孩子等待家长审核通过后积分正式入账
。

家长审批前端界面：在家长端提供审批孩子任务的界面，整合后端审批API实现完整流程。前端相关组件为 frontend/src/components/ParentApprovalDashboard.tsx 或 TaskApprovalWorkflow.tsx。完成以下改动：

打开家长审批面板时（例如家长Dashboard点击"审批任务"按钮），调用 apiService.getPendingApprovalTasks() 从后端获取待审批任务列表
。后端应返回该家长名下孩子的所有相关任务以及其当前审批状态。组件接收后可按 pending/approved/rejected 分类填充到不同的状态标签页
。确认界面上显示任务基本信息：任务标题、积分、提交时间等，以及孩子姓名（如后端未提供姓名，可通过 userId 匹配本地已加载的孩子列表或要求后端提供）。

对于每个待审批任务，显示孩子上传的证据详情：包括文本心得直接显示，以及多媒体证据可通过 MediaPreview 组件查看图片或播放视频
。让家长据此判断任务完成质量。

审批交互：在每个任务条目提供"✅通过"和"❌拒绝"按钮。家长可选填备注和奖励积分（如额外加分）通过UI输入（例如在 TaskApprovalWorkflow 中的 state: approvalNotes, bonusPoints
）。点击通过则调用 apiService.approveTask(taskId, { action:'approve', approvalNotes, bonusPoints })
；点击拒绝调用相同接口但 action:'reject'
。等待后端响应，操作成功后：

从前端的 pendingTasks 列表中移除该任务
；

若通过，则将任务对象状态设为 approved 后加入 approvedTasks 列表以供查看
；若拒绝则类似加入 rejectedTasks 列表
。

清空本次审批的备注/加分输入框，关闭详情弹窗等。若后端返回错误则提示审批失败重试
。

家长审批界面还应在导航或按钮上提醒待审批数量，例如在"任务审批"按钮上显示红点或数字（可通过 pendingTasks 长度来决定）。这样家长可以及时看到有未处理的任务。

积分更新与历史展示：在前端确保积分相关的数据实时更新，并提供查看积分记录的界面（如果需要）。具体包括：

积分实时更新：孩子端在任务完成提交、家长端在审批通过后，用户的总积分应及时更新显示。由于我们的实现是在审批通过后才给积分，因此孩子可能在提交任务后其个人积分暂未增加，需等家长通过后才能看到积分增长。为提升体验，可考虑：孩子提交任务后，在UI上标注"待审批"的积分（例如灰色显示本次应得积分），审批通过后再转为正式积分。这需要前端根据任务状态判断显示。但简单起见，可在家长审批通过后，由家长端发出通知或通过WebSocket/轮询告知孩子端刷新。如果没有实时机制，那么孩子下次登录或手动刷新时会通过 refreshUser() 获得更新的积分。

积分历史页面（可选）：如果后端实现了 /auth/points-history 接口
或可从 DailyTask/Redemption 等记录推导积分变动，则在前端新增"积分历史"或"奖励记录"页面。在该页面调用 apiService.getPointsHistory() 获取一定时间范围内积分获取和消耗记录列表，并以时间线或表格形式展示每笔积分的来源（如任务完成、兑换奖励）和数值变化。这样用户可以清楚了解自己积分的累积过程。若没有独立历史接口，也可以用当前 User 的 points以及相关记录简单展示，如"总积分：X，已兑换：Y，当前剩余：Z"等信息。

成就和统计（可选）：利用后端提供的统计接口丰富前端仪表盘。比如调用 /auth/dashboard-stats 或计算 currentStreak、累计完成任务数等，在学生主页显示如"已连续完成任务N天，获得徽章X"。也可以在家长端显示家庭排行榜（调用 /auth/family-leaderboard）等。如果这些接口尚未实现，可视情况简化为本次不重点开发，留待以后完善。

测试与部署

后端功能测试：为关键后端功能编写单元测试和集成测试。重点测试点包括：

学生规划任务：模拟学生用户调用 POST /daily-tasks，验证数据库中新建记录正确，且相同任务同日重复添加被拒绝的情形。

学生完成任务提交：模拟学生调用 PUT /daily-tasks/:id 提交完成，附带文本和模拟文件URL，断言响应成功，数据库中该记录的 status、evidence、approvalStatus、pointsEarned 等字段按预期更新
。如果 requiresEvidence=false，测试是否直接将approvalStatus设为approved并积分计入用户。

家长审核流程：模拟家长用户调用 GET /daily-tasks/pending-approval，确认只返回自己孩子的任务且状态正确。然后调用 PUT /daily-tasks/:id/approve测试通过和拒绝两种路径：通过后检查对应 DailyTask 的状态和 User.points 增加值是否正确；拒绝后确认 DailyTask 状态变化且 User.points 未增加。还要测试非授权用户或无权限的访问是否被拒绝（如学生调用审批接口应403）。

文件上传接口：模拟上传不支持的文件类型或超大文件，确认后端返回错误码
；上传合法文件后，确认文件在服务器保存并返回的URL可访问（可通过 supertest 提供文件流测试）。
所有测试通过后再进行下一步。可将测试文件放在 backend/src/__tests__ 目录或使用现有测试框架。

前端联调与验收：启动前后端应用进行集成测试，完整跑通主要用户流程：

使用学生账户登录，创建新任务、规划今日任务->提交完成（附证据）；确认前端界面任务状态从"进行中"变为"已提交等待审核"，学生暂未加分；

用家长账户登录，查看待审批任务->审核通过（或拒绝）；学生端刷新后看到积分增加（或任务被标记为已拒绝未得分）
；

测试积分兑换（如果有相关功能）确保不会与本次任务积分流程冲突。
通过浏览器检查网络请求和数据库数据，确保每一步功能都按预期。修复测试中发现的任何问题。

更新文档与部署：在开发完成后，更新项目文档。包括在 README.md 中描述"孩子任务计划与积分"功能的使用方法和流程（例如家长如何审批，积分如何获取等），确保用户或开发者了解新增加的API和界面。补充部署文档，如果新增了环境变量（如文件上传目录、大小限制等）也要在 backend/.env.example 中体现并在说明中提及。最后，合并功能分支回 master 主分支，确保所有代码变更被审查后无冲突地融合。运行部署流程（包括重新构建前端、启动后端）验证应用正常运行，把新功能发布上线供用户使用。