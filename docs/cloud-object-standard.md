# 云对象编码规范

uniCloud 云对象开发的一些常见规范和实践：

1.  **导出方式**: 使用 `module.exports = { ... }` 导出包含云对象所有方法的对象。
2.  **前置处理 (`_before`)**: 利用 `_before` 钩子函数执行所有方法前都需要进行的通用逻辑，例如：
    - **身份认证**: 获取客户端信息 (`this.getClientInfo()`) 和 Token (`this.getUniIdToken()`)，使用 `uni-id-common` 的 `checkToken` 方法验证用户登录状态。
    - **上下文传递**: 将验证后的用户信息 (`uid`) 或其他需要在方法间共享的数据存入 `this.context` 对象。
3.  **数据库交互**:
    - 获取数据库引用: `const db = uniCloud.database()`。
    - 获取集合引用: `db.collection('collectionName')`。
    - **查询**: 使用 `.where()` 指定条件，`.orderBy()` 排序，`.skip()` 和 `.limit()` 实现分页，最后用 `.get()` 执行查询。
    - **聚合查询**: 对于需要关联查询或复杂数据处理的场景，使用 `.aggregate()` 链式调用聚合操作符，如 `.lookup()` (关联其他集合), `.project()` (重塑文档结构), `.match()` (筛选), `.sort()` (排序), `.skip()`, `.limit()`，最后用 `.end()` 执行。
    - **添加数据**: 使用 `db.collection('collectionName').add(dataObject)`。
    - **删除数据**: 先定位文档 `db.collection('collectionName').doc(documentId)`，再调用 `.remove()`。
    - **更新数据**: 先定位文档 `db.collection('collectionName').doc(documentId)`，再调用 `.update(updateData)` 或 `.set(newData)`。
4.  **云存储交互**:
    - **上传文件**: 使用 `uniCloud.uploadFile({ cloudPath, fileContent, cloudPathAsRealPath })`。
      - `cloudPath`: 指定文件在云存储中的完整路径和文件名。
      - `fileContent`: 要上传的文件 Buffer 数据。
      - `cloudPathAsRealPath: true`: 表示 `cloudPath` 是包含路径的完整文件名，而不是仅仅是目录。
    - **删除文件**: 使用 `uniCloud.deleteFile({ fileList: [fileId1, fileId2, ...] })`，传入要删除文件的 FileID 列表。
5.  **调用外部 HTTP 服务**:
    - 使用 `uniCloud.httpclient.request(url, options)` 发起网络请求。
    - 可以设置 `method`, `data`, `headers`, `dataType` 等参数。
    - 常用于调用第三方 API (如此处的阿里云 AI 服务)。
6.  **配置管理**:
    - 使用 `uni-config-center` 模块 (`require('uni-config-center')`) 来获取和管理配置信息 (如 API Key、第三方服务地址等)，避免硬编码。配置通常放在项目根目录的 `uni_modules/uni-config-center/uniCloud/cloudfunctions/common/uni-config-center/xxx/config.json` 文件中。
7.  **错误处理**:
    - 使用 `try...catch` 块捕获可能发生的异常。
    - 在 `catch` 块中使用 `console.error()` 记录详细错误日志，方便调试。
    - 向前端返回明确的错误信息。可以定义一个通用的错误抛出函数（如示例中的 `throwError`），或者直接 `throw new Error()`。对于需要前端特殊处理的业务逻辑错误（如“无权限删除”），可以通过返回包含 `success: false` 和 `errMsg` 的对象来传递。
8.  **参数处理**:
    - 在方法开始时检查输入参数的有效性 (例如 `if (!prompt)` )。
    - 为可选参数提供默认值 (例如 `params?.page || 1`)。
9.  **异步处理**:
    - 云函数中的 I/O 操作（数据库、存储、HTTP 请求）基本都是异步的，需要使用 `async/await` 来处理 Promise。
    - 对于需要等待的操作（如轮询任务状态），可以使用 `new Promise(resolve => setTimeout(resolve, interval))` 配合 `await` 实现延时。
