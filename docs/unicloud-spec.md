### 1. 云数据库 Schema 设计

根据设计文档，主要涉及以下两个云数据库集合：

1.  **`users` 集合 (由 `uni-id-pages` 自动管理)**
    - 这个集合由 `uni-id-pages` 公共模块自动创建和维护，用于存储用户信息。
    - **主要字段 (部分)**：
      - `_id` (String): 用户唯一标识，系统自动生成。
      - `username` (String): 用户名。
      - `nickname` (String): 用户昵称。
      - `avatar_file` (Object): 用户头像文件信息 (包含 `url`, `name` 等)。
      - `wx_openid` (Object): 微信平台对应的 openid 等信息。
      - `register_date` (Timestamp): 注册时间。
      - ... (其他 `uni-id` 标准字段)
    - **用途**: 存储和管理小程序的用户账户信息，实现登录、用户信息展示等功能。
    
2.  **`images` 集合**

    - 这个集合用于存储 AI 生成的图片及其相关信息。
    - **建议字段**:

      - `_id` (String): 图片记录的唯一标识，系统自动生成。
      - `user_id` (String): 创建该图片的用户 `_id`，关联到 `users` 集合。**用途**: 标识图片的创建者。 (必需)
      - `prompt` (String): 生成该图片所使用的完整提示词文本 (可能包含风格描述)。 **用途**: 记录生成图片的关键输入信息。 (必需)
      - `file_id` (String): 图片文件在云存储中的唯一 ID。 **用途**: 用于管理和访问云存储中的实际图片文件。 (可选，但推荐，方便管理)
      - `url` (String): 图片的访问地址 (通常是云存储的 CDN 地址或临时链接)。 **用途**: 在小程序前端展示图片。 (必需)
      - `size` (String): 生成图片的尺寸，例如 '1024\*1024'。用途: 记录图片规格。
      - `create_time` (Timestamp): 图片记录的创建时间。 **用途**: 排序、展示等。 (必需)

    - **用途**: 存储 AI 生成的图片信息，包括谁创建的、用什么提示词、图片在哪里以及何时创建。

### 2. 云对象设计

项目中设计了一个名为 `ai-gallery` 的云对象，包含了处理 AI 画廊核心业务的所有后端逻辑。

- **云对象名称**: `ai-gallery`
- **前置处理 (`_before` 钩子)**:
  - **功能**: 在执行任何方法之前运行，用于统一处理鉴权逻辑。它会获取客户端信息，初始化 `uni-id-common` 实例，并调用 `checkToken` 验证用户的登录状态。如果验证失败，会抛出错误；如果成功，会将当前用户的 `uid` 存储在 `this.context.currentUser` 中，供后续方法使用。
- **方法**:
  1.  `generateImage(params)`
      - **功能**: 核心的图片生成方法。接收前端传递的参数（包含提示词 `prompt` 和尺寸 `size`），从 `uni-config-center` 获取阿里云 Damo Vision API Key，调用其文本到图像合成接口创建异步任务，轮询任务状态，成功后下载图片，将图片上传到 uniCloud 云存储，最后在 `images` 数据库集合中创建一条记录。
      - **输入参数**:
        - `params` (Object | String):
          - 如果为 Object: `{ prompt: String, size: String }` (例如 '1024\*1024')
          - 如果为 String: 直接为 `prompt` 文本 (兼容旧版，尺寸使用默认值 '1024\*1024')
      - **返回**:
        - 成功: `{ success: true, imageId: String, url: String }` (注意：这里的 `url` 返回的是阿里云临时的图片 URL，而不是云存储的 `fileID`)
        - 失败: 抛出包含 `errCode` 和 `errMsg` 的错误。
  2.  `getUserImages(params)`
      - **功能**: 获取当前登录用户创建的图片列表，按创建时间降序排列，支持分页。
      - **输入参数**:
        - `params` (Object, 可选): `{ page: Number, limit: Number }` (分页参数，默认为 page=1, limit=10)
      - **返回**:
        - 成功: `{ success: true, data: Array<Object> }` (包含图片记录的数组)
        - 失败: 抛出错误。
  3.  `getPublicImages(params)`
      - **功能**: 获取用于公共画廊展示的图片列表。使用聚合查询 (`aggregate`, `lookup`) 关联 `uni-id-users` 集合，获取每张图片的创建者昵称和头像信息。按创建时间降序排列，支持分页。
      - **输入参数**:
        - `params` (Object, 可选): `{ page: Number, limit: Number, filter: Object }` (分页和筛选参数，filter 当前未使用)
      - **返回**:
        - 成功: `{ success: true, data: Array<Object> }` (包含图片记录及关联创建者信息的数组)
        - 失败: 抛出错误。
  4.  `deleteImage(params)`
      - **功能**: 删除指定 ID 的图片。先查询数据库确认图片存在且属于当前登录用户，然后尝试删除云存储中的对应文件，最后删除数据库记录。
      - **输入参数**:
        - `params` (Object): `{ imageId: String }` (要删除的图片 `_id`)
      - **返回**:
        - 成功: `{ success: true }`
        - 失败 (例如无权限): `{ success: false, errMsg: String }`
        - 其他错误: 抛出错误。
  5.  `getImageDetail(params)`
      - **功能**: 获取单张图片的详细信息。
      - **输入参数**:
        - `params` (Object): `{ imageId: String }` (要查询的图片 `_id`)
      - **返回**:
        - 成功: `{ success: true, data: Object }` (包含单张图片记录)
        - 失败 (例如图片不存在): 抛出错误。

### 3. 云对象编写规范

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

### 4. 云存储配置

根据 `pdd.md` 的设计，你需要在 uniCloud 的 Web 控制台进行以下操作：

- **开通云存储**: 确保你的服务空间已经开通了云存储功能。
- **目录结构 (建议)**: 虽然云存储是扁平结构，但为了方便管理和可能的权限控制，文档建议将图片按用户和图片 ID 存放。逻辑上的目录结构是：
  ```
  /gallery/{user_id}/{image_id}.jpg
  ```
  你**不需要**在控制台手动创建 `gallery` 或 `{user_id}` 目录。当你通过 `uniCloud.uploadFile` API 上传文件并指定 `cloudPath` 为 `gallery/xxx/yyy.jpg` 时，如果目录不存在，系统通常会自动创建。
- **CDN 加速**: 为了提升图片加载速度，建议在 uniCloud Web 控制台为你的云存储配置 CDN 加速域名。`images` 表中的 `url` 字段应存储 CDN 加速后的地址。
- **读写权限**: 默认情况下，云存储的文件可能是私有的。你需要根据需求配置合适的读写权限规则：
  - 图片上传 (`ImageGenerator` 云函数): 需要有写入权限。通常云函数运行时拥有管理员权限，可以直接写入。
  - 图片读取 (前端展示): 需要让前端能够访问图片 URL。可以设置为“公开读”，或者在需要时通过云函数 `uniCloud.getTempFileURL` 获取临时访问链接。考虑到画廊是公开展示，将 `gallery` 目录下的文件设置为“公开读，私有写”可能是比较合适的策略。你可以在 uniCloud 控制台的“云存储” -> “规则”中配置。

### 4. 公共模块与配置

根据文档描述，主要使用到：

- **公共模块**:
  - `uni-id-pages`: 用于快速实现用户账户体系，包括微信登录、用户信息管理等。它会自动创建和管理 `users` 集合。
  - `uni-config-center`: 用于读取云函数配置。
- **配置**:
  - **uniCloud 相关配置**: 在 `manifest.json` 中配置 uniCloud 的服务空间 ID 等基本信息。
  - **第三方 AI 服务配置**: `ImageGenerator` 云对象需要调用外部 AI 图像生成服务。你需要将该服务的 API 地址、密钥 (API Key/Secret Key) 等配置信息存储在安全的地方，例如 uniCloud 的配置中心或云函数的环境变量中，而不是硬编码在代码里。
  - **云存储配置**: 如第 3 点所述，可能涉及 CDN 配置和权限配置。

### 5. 数据关系与业务流程

- **数据关系**:

  - 核心实体是 **用户 (`users`)** 和 **图片 (`images`)**。
  - 它们之间是 **一对多** 的关系：一个用户可以创建多张图片 (`images` 表中的 `user_id` 字段关联到 `users` 表的 `_id`)。
  - `images` 记录关联到 **云存储文件**: `images` 表中的 `url` (或 `file_id`) 指向云存储中的实际图片文件。

- **AI 画廊业务流程 (Mermaid 流程图)**:

  **图片创建流程:**

  ```mermaid
  sequenceDiagram
    participant User as 用户端
    participant Cloud as 云对象
    participant DB as 数据库
    participant Storage as 云存储
  
    User->>+Cloud: 调用generateImage(prompt, size)
    Cloud->>Cloud: 鉴权检查
    Cloud->>Cloud: 调用AI服务生成图片
    Cloud->>+Storage: 上传图片
    Storage-->>-Cloud: 返回fileID
    Cloud->>+DB: 创建图片记录
    DB-->>-Cloud: 返回记录ID
    Cloud-->>-User: 返回结果
  ```

  **首页画廊展示流程:**

  ```mermaid
  sequenceDiagram
    participant User as 用户端
    participant Cloud as 云对象
    participant DB as 数据库
  
    User->>+Cloud: 调用getPublicImages(page, limit)
    Cloud->>Cloud: 鉴权检查
    Cloud->>+DB: 聚合查询图片和用户信息
    DB-->>-Cloud: 返回图片列表
    Cloud-->>-User: 返回结果
    User->>User: 渲染瀑布流
  ```
