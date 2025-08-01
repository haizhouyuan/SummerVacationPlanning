好的，我将阅读你最新分支的代码，并根据你提供的积分与勋章制度，生成一条适用于 Claude Code 的 prompt，包含以下内容：

* 修复并实现任务计划 UI 模块的正常工作；
* 实现打卡自动触发的积分计算逻辑；
* 实现勋章系统（永久叠加加成，积分倍率对应勋章数量）；
* 实现游戏时间兑换逻辑，每30分钟游戏需扣除2份积分，控制冷却与锻炼间隔；

我会分析哪些模块需要重点重构或修改，并分层级标注开发优先级，生成 Claude Prompt，便于你交给 Claude 自动完成实现。


# 实现每日积分奖励和勋章系统

## 1. 打卡后积分自动计算 (Daily Task Points Calculation)

**修改后台每日任务完成逻辑**：在用户完成每日任务（打卡）时，后台应自动根据任务分值给予积分奖励。目前 `updateDailyTaskStatus` 的控制器代码已有基础实现：如果任务标记为`completed`，会查找对应任务的`points`并累加到用户积分。我们需要在此基础上完善：

* **应用任务基础分值**：确保使用任务定义中的`points`值作为基础奖励。例如，日记任务2分、晨练任务2分等（需根据**每日任务结构表**调整任务库中的分值）。代码片段显示目前直接使用`task.points`赋给`pointsEarned`并加到用户积分。若某些任务有特殊规则（如日记每额外50字+1分），可在此处根据`evidence`内容计算额外奖励分（如统计日记文字数，每满50字增加1分）。

* **更新用户积分字段**：调用数据库更新用户积分时，使用计算后的总积分。例如：

  ```ts
  const basePoints = task.points;  
  // …可在此计算额外积分…  
  const totalPoints = basePoints;  
  updates.pointsEarned = totalPoints;  
  await collections.users.doc(req.user.id).update({  
      points: req.user.points + totalPoints,  
      updatedAt: new Date(),  
  });
  ```

  这将把此次任务所得积分累加到用户总积分。确保前端刷新后显示正确的积分值（前端的TodayTasks页面会重新获取`user.points`并显示）。另外，可修改前端任务完成提醒，使用后端返回的`dailyTask.pointsEarned`而非静态的`task.points`，这样当积分包含加成时提示准确（例如利用后端返回的updatedDailyTask数据来alert）。

## 2. 勋章加成系统实现 (Consecutive Full-Completion Medal System)

**实现连续全勤天数勋章奖励**：根据需求，用户连续若干天全部完成当天所有任务，可解锁对应勋章，并对后续任务积分提供倍率加成：青铜1.1倍（7天）、白银1.2倍（14天）、黄金1.3倍（30天）、钻石1.4倍（60天）。勋章效果可叠加，相乘形成总倍率。具体实现步骤：

* **追踪全勤天数 (Streak)**：在用户模型中新增字段，如`currentStreak: number`，表示用户当前连续全勤的天数。每当用户“当天的所有任务”全部标记完成时，递增该值；若某天未完成所有任务（有任务状态不是completed，例如planned/in\_progress/skipped），则重置`currentStreak`为0（代表中断连续天数）。需要在每日任务状态更新逻辑中判断是否**全勤**：可以在最后一个任务完成时触发检查。当`updateDailyTaskStatus`设置某任务为完成后，查询该用户当日是否还有未完成任务：若该日期的`dailyTasks`全部状态为`completed`（没有planned/in\_progress，也没有跳过的任务），则认为当天全勤。

* **更新勋章状态**：在用户模型新增勋章字段，例如：

  ```ts
  medals: { bronze: boolean; silver: boolean; gold: boolean; diamond: boolean }
  ```

  初始均为false。每次用户`currentStreak`更新后，检查是否达到了新的勋章阈值：

  * 当`currentStreak == 7`天时，若`medals.bronze`尚未获得，则设为true，**解锁青铜勋章**。
  * 当`currentStreak == 14`天且`medals.silver`未获得，则设为true，解锁白银勋章。
  * 同理处理30天（黄金）和60天（钻石）勋章。
    勋章一经获得永久保留（不要在中断后重置已获得的勋章标志）。

* **积分倍率计算**：在计算任务奖励积分时，依据用户已拥有的勋章叠加倍率。可以在`updateDailyTaskStatus`计算积分时，引入用户勋章状态：例如计算一个`multiplier`初始为1，拥有青铜则`multiplier *= 1.1`，白银则再`*1.2`，依此类推。计算最终奖励积分`totalPoints = Math.round(basePoints * multiplier)`（如有小数可四舍五入）。然后将`updates.pointsEarned = totalPoints`，累加给用户积分。这样已获得勋章的用户在完成新任务时，其积分奖励会自动按倍率提高。注意：**当用户正好在完成当天任务后达成勋章条件时**（例如第7天完成后获得青铜），当日任务的积分仍按获得勋章前的倍率计算，勋章加成从下一次任务开始生效（符合“后续任务积分加成”的要求）。

* **数据持久化**：修改数据库用户文档结构以保存`currentStreak`和`medals`字段，并在身份验证中包含这些字段（确保`req.user`携带最新的勋章和连续天数信息）。前端Dashboard可以利用这些字段显示用户勋章状态（例如用AchievementBadge组件展示已解锁的勋章），替换目前的模拟数据。

## 3. 任务规划模块修复 (Fix Task Planning UI)

当前任务规划页面存在问题，导致每日任务计划无法正常工作。需要检查并修改`frontend/src/pages/TaskPlanning.tsx`：

* **成功规划任务数提示错误**：在`handlePlanTasks`函数中，选中任务规划后会清空`selectedTasks`然后弹出提示。由于状态更新的异步特性，弹窗中`selectedTasks.length`可能为0（因为之前已经`setSelectedTasks([])`）。这使提示的任务数量不正确。**修复方案**：在清空之前保存`selectedTasks.length`到临时变量，或将`alert`调用移至`setSelectedTasks`之前。例如:

  ```js
  const count = selectedTasks.length;
  // …API calls…
  setSelectedTasks([]);
  await loadDailyTasks();
  alert(`成功规划了 ${count} 个任务！`);
  ```

  这样能正确显示规划的任务数量。

* **即时更新今日计划列表**：确保在成功添加任务后调用`loadDailyTasks()`刷新状态已经生效。如果前端仍未显示更新的任务，考虑在`createDailyTask`接口响应后直接将新任务插入`dailyTasks`状态，以提供更顺畅的用户体验（当前是每次重新从服务器拉取，可接受但略影响体验）。

* **其他潜在问题**：确认日期选择和任务过滤正常工作。当前代码限制只能规划“今天以及未来”的任务（`min`属性限制日期不早于今天），这个符合预期。还应确保**不能重复添加**同一任务到同一天：代码已在循环中检查了`existingTask`避免重复，这个逻辑是正确的。若发现仍可重复添加，需要调试该判断逻辑。

* **模块重构**（如有必要）：如果问题复杂，可以将任务规划和每日任务生成逻辑拆分为更清晰的函数。例如，将“将选中任务列表创建为dailyTasks”的流程封装，或在后台提供批量创建接口以减少前端逐个请求。目前前端在for-loop中逐个调用API规划任务，有一定效率问题；如任务量大，可以考虑后端接受任务ID列表批量创建以优化。

## 4. 游戏时间兑换逻辑 (Game Time Exchange)

**实现积分兑换游戏时间的功能**：根据需求，两类游戏时间兑换规则如下：普通游戏1积分=5分钟，教育游戏1积分=10分钟，且每天前20分钟教育类游戏时间免费。代码中已经设计了相关常量和逻辑，需要将其完整实现：

* **后台接口实现**：完善`backend/src/routes/rewardsRoutes.ts`（或创建新路由）和控制器`calculateGameTime`及`getTodayGameTime`。根据提供的示例代码，实现以下行为：

  * `calculateGameTime` 接口接受 `pointsToSpend` 和 `gameType` 参数。先检查用户积分是否足够。计算兑换分钟数：若`gameType==='educational'`，先查询当天用户已兑换的教育类时间总和，应用“首20分钟免费”规则：

    * 如果用户请求的兑换分钟数未超过免费额度，则**不扣积分**，直接授予对应分钟并记录一次`pointsSpent: 0`的兑换（即免费兑换）。
    * 否则，扣除相应积分，按照比例兑换分钟（普通游戏每分=5分钟，教育游戏每分=10分钟)。创建兑换记录，并从用户积分中扣减相应分值。
  * `getTodayGameTime` 接口根据用户ID和日期查询当日所有兑换记录，汇总计算：基础游戏时间30分钟、`bonusTimeEarned`当日兑换获得的总分钟数、`remainingTime`剩余可用分钟等。这些数据将用于前端显示。确保父母账户可以查询孩子的游戏时间统计（代码已考虑userId查询和权限校验）。

* **前端交互**：前端Rewards页面已经集成了兑换功能UI和调用：比如点击“立即兑换”按钮会调用`apiService.calculateGameTime`。后端实现完成后，测试以下场景：

  * **积分不足**：后端应返回400错误，前端弹出“积分数量无效”提示。
  * **免费教育时长**：在用户当天尚有免费额度且兑换教育类游戏时间时，应返回`isFreeTime: true`，前端弹出提示显示获得免费时间且不扣积分。
  * **正常兑换**：返回兑换成功，告知获得分钟和消耗积分。前端会调用`loadData()`刷新今日游戏时间统计，页面应显示基础时间30分钟，以及更新后的奖励时间和总可用时间。

* **使用记录**：如果还有“使用游戏时间”的功能（如`apiService.useGameTime`), 后端也应实现扣减已用分钟并更新`remainingTime`。但此部分可在将来扩展，实现如当用户实际玩游戏时调用该接口记录`minutesUsed`。当前重点是确保兑换和查询逻辑正确。

## 5. 优先级和涉及模块 (Priority & Modules to Modify)

根据上述分析，建议按以下优先顺序实施修改，以尽快使主要功能正常运行：

1. **任务规划模块修复** – **模块**: 前端 `TaskPlanning.tsx`等. *优先级: 高*. 任务规划是每日任务流程的起点，需先保证用户能够正确添加当天任务。修复提示计数问题，确保任务添加后UI刷新显示。

2. **每日任务积分逻辑完善** – **模块**: 后端 `dailyTaskController.ts`, 前端 `TodayTasks.tsx`. *优先级: 高*. 修正并验证后台自动奖励积分的逻辑，包括根据任务调整基础分值、累加到用户积分，以及前端提示和显示的同步。此功能直接影响用户完成任务的奖励反馈。

3. **连续全勤勋章系统** – **模块**: 后端 `dailyTaskController.ts`，后端用户数据结构, 前端 Dashboard/相关显示. *优先级: 高*. 在积分逻辑基础上添加连续天数统计和勋章判定，加成效果会影响积分计算，需要紧随积分功能实现。修改用户模型以存储`currentStreak`和勋章状态，更新任务完成时的逻辑来维护这些值。

4. **游戏时间兑换功能** – **模块**: 后端 `rewardsController.ts`, 前端 `Rewards.tsx`. *优先级: 中等*. 完善兑换游戏时间的后端接口，使前端现有兑换UI真正生效。此功能独立于任务完成主流程，优先级略低于以上核心流程，但应在积分和勋章系统完成后尽快实现以完整奖励闭环。

完成以上修改后，整个积分奖励系统将符合设计：用户每天添加任务并**全勤完成**可持续获得勋章（叠加积分倍率），完成每项任务即时获得积分奖励，累积积分又可用于兑换游戏时间，形成正向激励循环。验证所有单元测试和前后端交互，确保积分计算准确、勋章状态正确持久、任务规划与兑换流程顺畅无误。
