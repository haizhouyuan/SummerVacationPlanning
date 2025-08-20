明白了，我将为你生成一条 Claude Code 提示词，帮助实现上传打卡功能（支持文本、图片、视频），并满足以下要求：

* 所有任务都支持打卡证据上传；
* 无需家长审核，直接记录；
* 本地服务器文件存储；
* 前端上传过程需具备格式验证和上传进度显示；
* 每条打卡内容应具备“是否公开”设置，用于后续展示或分享；

我会详细规划前端组件修改点、后端接口逻辑、数据库模型扩展、静态资源路径规划和安全控制策略等。

请稍等，我会尽快整理 Claude Prompt 给你。


# 实现打卡任务证据上传功能的方案

## 后端接口与路由修改

**数据模型扩展：** 为 `dailyTasks` 模型添加存储证据和公开标记的字段。当前 `DailyTask` 已有 `evidence` 数组用于保存证据内容（文字或文件URL）但尚未区分文字描述或公开属性。建议在数据库中新增字段：`evidenceText: string`（文字心得）、`evidenceMedia: { type: 'image' | 'video'; filename: string; url: string; size: number }`（单个上传文件的信息），以及 `isPublic: boolean`（标记这次打卡是否公开）。如果需要支持多文件上传，可以将 `evidenceMedia` 扩展为数组（如 `evidenceList: EvidenceItem[]`），每个元素包含文件类型、名称、大小和存储路径等信息，充分支持一条打卡记录关联多项证据。

**新增上传接口：** 实现一个文件上传的 REST API，例如 `POST /api/evidence/upload`。后端使用 Express 搭配 Multer 中间件处理文件上传。配置 Multer 的存储目录为服务器本地路径（如 `uploads/evidence/`），按照任务或用户分类存放上传文件。例如可采用路径 `/uploads/evidence/{userId}/{taskId}/{timestamp}_{原文件名}` 来存储，确保不同任务、用户的文件分目录保存。上传接口需要校验文件类型和大小：仅允许常见图片格式 (jpg、jpeg、png) 和视频格式 (mp4、mov、webm)，拒绝不支持的文件类型；文件大小限制在100MB以内（可通过 Multer 的 `limits.fileSize` 参数设置）。接口接收 multipart form-data（字段名如“file”），成功时返回文件的存储信息，例如：`{ success: true, data: { filename, url, size, type } }`，其中 `url` 可以是拼接服务器静态服务地址后的访问路径。为防止文件名冲突，保存时应在文件名前添加时间戳或UUID等随机前缀。另外，要确保立即响应上传进度：可以在 Multer的文件流处理中监听 progress，或分片上传实现断点续传（若需求要求，可选）。

**修改打卡状态接口：** 更新现有的 `PUT /api/daily-tasks/:dailyTaskId` 接口逻辑，支持将证据信息一起保存。 当前实现中若请求体包含 `evidence` 则直接更新存储该字段；我们需要改为获取前端提交的 `evidenceText`、`evidenceMedia`（或列表）以及 `isPublic`，并更新到对应的 `dailyTask` 文档中。例如：`if (evidenceText) updates.evidenceText = evidenceText; if (evidenceMedia) updates.evidenceMedia = evidenceMedia; if (isPublic !== undefined) updates.isPublic = isPublic;`。同时保留原有的 `notes` 字段更新逻辑不变。由于现在不需要家长审核，一旦用户提交，此接口即可直接将任务状态置为 “completed” 并保存证据。原本任务完成后计算积分的流程继续保留：在状态变为 completed 时，根据任务积分值更新 `pointsEarned` 以及用户总积分。接口响应中应包含更新后的打卡任务对象，包括新增的证据字段，方便前端即时展示。

**路由配置：** 在 Express 路由层面，新建一个 evidenceRouter（或在 existing router 中添加）用于文件上传。例如：

```ts
const upload = multer({ dest: 'uploads/evidence/', limits: { fileSize: 100 * 1024 * 1024 }, fileFilter });
router.post('/evidence/upload', authenticateToken, upload.single('file'), evidenceController.uploadEvidence);
```

其中 `fileFilter` 函数检查 MIME 类型是否为允许的图片/视频格式，超出限制则返回错误。上传成功后，由 `evidenceController.uploadEvidence` 返回上面提到的文件信息。确保在主应用中使用 `app.use('/api', router)` 挂载，并通过 `express.static`开放上传目录读取权限，例如：

```ts
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

这样前端拿到的 `url`（如 `/uploads/evidence/123/1692200000000_filename.jpg`）可以直接访问到文件内容。务必将路由和静态服务限定在安全范围，例如只开放特定uploads子目录，防止意外暴露服务器其它文件。

## 前端页面组件修改建议

**打卡提交界面调整：** 在任务打卡弹窗或任务详情页，增加证据上传相关的输入控件和提示信息。具体包括：文字描述的多行输入框、上传文件按钮或拖拽区域、以及“是否公开” (`isPublic`) 的开关控件。文字输入框用于填写心得体会或日记内容；上传区域允许用户选择图片或视频文件，当任务要求提交多种证据时，可以一次上传多文件。参考现有的 EvidenceModal 组件实现，这些控件已经部分存在：如文本域用于文字描述📝，FileUpload组件用于处理文件上传，提交时整合成为 evidence 列表。我们需要在此基础上增加**公开**开关，提示用户勾选后该次打卡内容可展示在个人成就页或分享给他人。

**文件上传交互：** 文件选择后，前端应调用后台新建的上传接口，将文件实际传输到服务器。本项目现有实现中，FileUpload组件使用 Firebase Storage 上传，我们将调整为通过 Axios 或 Fetch 调用 `POST /api/evidence/upload`。上传过程中使用 Axios 的 `onUploadProgress` 回调获取进度百分比，驱动前端显示上传进度条（例如一个进度百分比或加载动画）。在 FileUpload 组件中已设计了进度条UI，只需确保拿到后端进度事件并更新状态即可。上传完成后，前端收到返回的文件URL和信息，将其加入到当前证据列表中并即时在界面显示预览。图片可显示缩略图，视频可显示播放器控件供用户播放校验。如果上传失败（文件过大或格式不支持等），应在界面弹出错误提示，例如“上传失败：文件格式或大小不符合要求”，这一点 FileUpload 组件已有错误状态处理。

**提交打卡流程：** 当用户填完文字并成功上传至少一个文件后，点击“完成任务”提交。此时前端需要调用更新打卡状态的API (`PUT /api/daily-tasks/:id`)，请求体包括：`status: 'completed'`，`evidenceText` 字段（文本内容）、`evidenceMedia` 列表（上传接口返回的文件路径/URL等），`isPublic` 值（true/false），以及任何备注 `notes` 字段。后端成功返回后，前端可关闭弹窗并提示用户“打卡成功，积分已获得！”。建议使用一个 Toast 或 Modal 显示该提示信息，并在个人积分或任务列表上即时反映积分和状态的更新。前端还应根据接口返回的数据更新本地状态，例如将该 dailyTask 的 evidenceText、evidenceMedia 和 isPublic 字段保存到状态管理或组件状态中，以便在任务详情或成就页面展示。对于公开的打卡，如果后续有成就页展示功能，前端可以根据 `isPublic` 筛选出这些打卡记录进行展示和分享。

**UI/UX 细节：** 在上传区域附近提供格式和大小限制的提示说明，例如文本标注“支持 JPG/PNG 图片，MP4/MOV 等视频，单个文件不超过100MB”。当选择视频时，可以提示建议最长60秒以内，以确保上传和浏览流畅（如果需要，可在前端通过获取视频元数据限制时长）。上传完的文件列表应支持删除未满意的文件重新上传。整个证据提交区域应设计得直观明了，确保用户知道哪些是必填项（如文字描述通常是必填，中通过 `task.evidenceTypes` 判断需不需要文字证据）。最后，在任务卡片或详情界面，显示提交后的证据：文字内容直接呈现，图片/视频提供可预览缩略图或播放按钮。这样不仅满足功能需求，也提升了用户完成任务分享成果的体验。

## 文件存储结构与安全考虑

**存储路径规划：** 在服务器本地创建专门的目录（如项目根目录下的 `/uploads/evidence/`）用于保存证据文件。按照任务或用户再细分子目录，避免所有文件堆在一个文件夹下造成混乱或重名覆盖。例如采用“用户ID/任务ID”两级目录：`/uploads/evidence/<userId>/<taskId>/`，每个上传文件保存为`<timestamp>_<原文件名>`的格式。这样既保持与原Firebase存储结构的一致性，方便未来迁移或查找，又能防止不同用户或任务间文件名冲突。同时记录文件的 MIME 类型和大小等元数据存入数据库，以备检索和展示。如果不想暴露真实文件名，存储时也可对文件名进行清理或哈希处理，只保留扩展名以识别类型。

**安全校验：** 为防范恶意上传和访问，需在多个层面做好限制。首先，在上传接口的服务端通过 Multer 的 `fileFilter` 严格限制文件类型，只允许预期的图片和视频格式（如通过 MIME 类型匹配 image/jpeg, image/png, video/mp4 等），拒绝可执行文件或脚本文件。其次，设置文件大小上限100MB，防止耗尽存储或内存。Multer在保存文件时会给出原始文件名，但我们应当对文件名进行规范化处理：去除路径分隔符等特殊字符，防止出现路径穿越（directory traversal）漏洞。例如，使用 `path.basename` 获取文件名或自行生成安全的新文件名，而不是直接使用用户提供的文件名写入文件系统。**访问控制：** 对于上传后的文件，通过 Express 静态中间件提供访问时，应确保禁止目录列表浏览，即客户端无法列出 `/uploads` 下所有文件。另外，可以根据 `isPublic` 字段决定文件的访问权限：若未来实现他人查看公开打卡，需确保只有公开的资源对外可见，非公开的应要求权限（例如通过验证用户身份后以受保护路由发送文件流）。目前实现中，可先将所有证据文件限定在受控的 `/uploads/evidence` 静态路径下，文件URL不会暴露服务器敏感信息，也不允许通过URL参数直接访问其他路径。

**避免恶意内容：** 虽然只允许特定格式，但仍需考虑用户可能上传不当内容的风险。基本的做法是在前端提示文明上传，在后台限制文件类型大小。进一步的安全可以集成杀毒或恶意文件扫描，对上传内容进行检查（根据项目需要选择）。在响应文件请求时，务必设置正确的 Content-Type，以防止浏览器误执行文件。例如图片视频通常无执行风险，但例如SVG这类含脚本的图片格式应谨慎对待（当前限制中未包含SVG）。总而言之，严格的文件类型校验和存储隔离是必要的安全措施。通过以上规划，我们将在本地服务器安全地实现证据的保存与提供访问，满足打卡上传文本、图片、视频的功能需求。
