Claude Code 在用 Playwright 调用 MCP 工具时返回的数据量过大，超出了上限。我帮你拆解一下：

1. 报错现象

browser_click 报错

response (669349 tokens) exceeds maximum allowed tokens (25000)


表示一次点击动作返回的上下文/页面快照太大，被截断。

browser_evaluate 报错

response (2033176 tokens) exceeds maximum allowed tokens (25000)


表示 page.evaluate 返回的结果内容太大。因为默认 evaluate 会把页面中所有上下文序列化并传回（可能包含整个 DOM），所以结果爆炸式膨胀。

2. 问题根源

Claude Code 的 MCP 工具对返回 token 数有限制（25k），而 Playwright 默认操作可能把整个页面状态传回。

你在 evaluate 里返回了 button.click() 的结果，但由于写法问题，Playwright 可能把整个页面环境也序列化了。

选择器 button:contains("学生演示") 本身是 jQuery 风格，不是原生 CSS 选择器，所以失败了（报错提示很明确）。后来你改成 textContent.includes('学生演示') 才能正常工作。


3. 修复思路
是\*\*“从源头限流 + 工具层约束 + 用法规范 + 项目级提示”\*\*四层并行，避免 MCP 在浏览器/Playwright 调用时把整页上下文或大对象序列化回传而触发 25k token 上限。

---

# 一、从源头限流（浏览器/Playwright 侧）

**1）一律用 Locator/内置查询，少用 `page.evaluate`**

* ✅ `await page.getByTestId('student-demo').click()`
* ✅ `await page.getByRole('button', { name: '学生演示' }).click()`
* ❌ 避免 `page.evaluate(() => document.querySelector(...))` 并返回 DOM/对象（会被序列化成超大 JSON）。

**2）若必须 `evaluate`，只返回原始标量**

```js
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.includes('学生演示'));
  if (btn) { btn.click(); return 'OK'; }
  return 'NOT_FOUND';
});
```

* 只返回 `'OK'|'NOT_FOUND'|true|false'` 等标量；**严禁**返回元素、数组、DOM、庞大结构。

**3）阻断大静态资源，降低页面快照体量**

```js
await page.route('**/*', (route) => {
  const type = route.request().resourceType();
  if (['image','media','font'].includes(type)) return route.abort();
  route.continue();
});
```

* 同时可在 URL 层过滤第三方追踪脚本与大 JSON 接口。

**4）禁止“返回页面截图/HTML 字符串/网络日志”**

* 避免 `page.content()`、`page.screenshot({ encoding: 'base64' })` 这类直接回传给 MCP 的调用。

**5）用 `$eval` / `locator.evaluate` 精准取值**

```js
const text = await page.$eval('header h1', el => el.textContent?.trim() || '');
```

* 保证只回传短字符串。

---

# 二、工具层约束（自建 MCP 或脚本封装）

如果你是**自建 MCP 工具**（或有一层本地脚本作为 MCP 的“代理/包装器”），建议做“**响应剪裁 + 白名单返回**”。

**1）输出白名单**

* 统一返回形如：

```ts
type Result = { ok: boolean; msg?: string; data?: string };
```

* `data` 限制为 **<= 2KB** 的纯文本。其它类型（DOM、数组、对象）**先在工具内 stringify + 截断**。

**2）统一剪裁工具**

```ts
function clip(s: unknown, max=2000) {
  try { 
    const t = typeof s === 'string' ? s : JSON.stringify(s);
    return t.length > max ? t.slice(0, max) + `…[clipped ${t.length - max}]` : t;
  } catch { return '[unserializable]'; }
}
```

* 所有工具返回前：`return { ok:true, data: clip(result) }`

**3）参数化“静默模式”**

* 给每个浏览器操作工具加参数：`silent?: boolean`（默认 `true`），silent 时仅返回 `'OK'`，不携带任何页面内容。
* 需要详情时才显式 `silent:false`，但**仍需 clip**。

**4）分页/limit 约定**

* 为查询类工具（如“列出按钮”、“抓取日志”）加入 `limit`, `offset`, `fields` 参数，**默认 limit 很小**。
* 例如：`listButtons({ limit: 20, fields: ['text','data-testid'] })`

---

# 三、用法规范（项目内可复用的“代码片段标准”）

把以下模式沉淀为可复制的**片段**或**辅助函数**，供 Claude/开发者调用：

**1）统一按钮点击（最小返回）**

```js
async function clickByTestId(page, id) {
  await page.getByTestId(id).click();
  return 'OK';
}
```

**2）文本断言（最小返回）**

```js
async function expectVisibleText(page, text, timeout=3000) {
  await page.waitForFunction(
    t => !!document.body.innerText && document.body.innerText.includes(t),
    text, { timeout }
  );
  return 'OK';
}
```

**3）选择 + 执行动作 + 仅返回状态**

```js
async function clickByText(page, label) {
  const btn = await page.getByRole('button', { name: label });
  await btn.click();
  return 'OK';
}
```

**4）统一 evaluate 门面（强制标量返回）**

```js
async function evalScalar(page, fn, ...args) {
  const res = await page.evaluate(fn, ...args);
  if (['string','number','boolean'].includes(typeof res) || res === null) return String(res);
  return 'OK'; // 一律不回传复杂对象
}
```

---

# 四、项目级“claude.md”/提示工程（系统性规避）

在项目根新建（或更新）`claude.md`（或你的 Agent 读取的说明文档），用**不可商量的规则**约束 Claude 的行为，使其**默认走小返回路径**：

```md
# CLAUDE PROJECT RULES (BROWSER/MCP)

## 必须遵守
1. 任何 Playwright 操作 **禁止** 返回 DOM、数组或大对象；只返回 "OK" / "FAIL" / 简短字符串。
2. **优先使用** getByTestId / getByRole / locator，**避免** page.evaluate。
3. 若必须 evaluate，**只返回标量**，且不得超过 64 字符。
4. 禁止在步骤中调用 page.content() / screenshot(base64) / 导出 HAR / 导出大 JSON。
5. 任何“列表/抓取/调试”型工具调用必须带 `limit`（默认 ≤ 20）与 fields 白名单。
6. 默认开启静默模式（`silent=true`），除非我在提示中明确要求详细输出。
7. 对网络/资源拦截：阻断 image/media/font 第三方资源。
8. 发生报错：优先缩小选择器范围或改用 `getByTestId`；不要扩大返回内容调试。

## 选择器规范
- 给交互元素添加 data-testid 并用它定位，避免文本模糊匹配。
- 统一 Button 命名：`data-testid="student-demo" | "teacher-demo"`。

## 输出格式
- 执行类步骤：仅回复 `OK`。
- 断言类步骤：`OK: <简短断言内容>`，长度 ≤ 80。
```

> 作用：Claude/Agent 在读取 `claude.md` 后，会**优先遵守这些“硬规则”**，避免它自己在 evaluate 里返回大对象或“帮你抓一大坨页面信息”。

---

# 五、前端侧“可测性”增强（减少抓 DOM 的需求）

**1）埋点 `data-testid`**（强烈建议）

```jsx
<button data-testid="student-demo">学生演示</button>
```

**2）状态可观测**

* 登录成功后，在页面上渲染简短且唯一的标识，如：

```jsx
<div data-testid="login-status">demo-user-logged-in</div>
```

* Playwright 只需断言这个节点的 `textContent`，避免拉取整页。

**3）Mock 接口最小化返回**

* Demo 流程只返回少量字段（token 也可截短），避免页面持有大 JSON 对象。

---

# 六、可选：把“浏览器操作”包成单独的 MCP 工具

若你在用 **自建 MCP**（Node/TS）：

* 提供 `clickByTestId`, `assertText`, `waitForSelector` 这类**窄接口**工具，内部用 Playwright 实现；
* **工具返回值统一为短字符串**（如 `'OK'` 或 `'NOT_FOUND: xxx'`），**永不直接暴露 page/elements**；
* 对“抓取列表/文本”的工具，**强制参数化 limit/clip**，并默认开启 clip。

示例（工具返回剪裁）：

```ts
export async function getInnerText(toolArgs): Promise<string> {
  const { selector, clipLen = 200 } = toolArgs;
  const text = await page.$eval(selector, el => el.textContent ?? '');
  return text.length > clipLen ? text.slice(0, clipLen) + `…[clipped]` : text;
}
```

---

# 七、落地清单（你可以直接做）

1. 前端按钮补齐 `data-testid`。
2. 在 `claude.md` 写入上述**硬规则**，并提交仓库根目录。
3. 把现有的 Playwright 片段替换为 **Locator 优先**，删掉 `:contains` 之类选择器。
4. 在自动化脚本入口统一加：

   * 资源拦截（阻断 image/media/font）；
   * `evalScalar`/`clip` 工具；
   * 所有工具默认 `silent=true`。
5. 若你有自建 MCP：给所有工具加**白名单返回**与**剪裁**。没有自建 MCP，也把上述**用法规范**固化到 `claude.md` 里。

---

如果你愿意，我可以基于你当前项目结构，**直接给你一套可复制的 `claude.md` 模板 + Playwright 工具化封装文件（TS 版本）**，放到 `tools/` 下，并在 `package.json scripts` 里挂上标准任务，确保后续 Claude/Agent 只能走“最小返回”的路径。
