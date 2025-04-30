# 轻量级记工时小程序 - 技术设计方案

## 一、云数据库设计

### 1. 集合设计

#### 1.1 sites（工地集合）
- `_id`: String - 唯一标识符
- `name`: String - 工地名称（必填）
- `address`: String - 工地地址（可选）
- `remark`: String - 备注（可选）
- `user_id`: String - 创建者用户ID（必填，关联uni-id-users._id）
- `createTime`: Date - 创建时间
- `updateTime`: Date - 更新时间

#### 1.2 workers（工人集合）
- `_id`: String - 唯一标识符
- `name`: String - 工人姓名（必填）
- `phone`: String - 联系电话（可选）
- `remark`: String - 备注信息（可选）
- `user_id`: String - 创建者用户ID（必填，关联uni-id-users._id）
- `createTime`: Date - 创建时间
- `updateTime`: Date - 更新时间

#### 1.3 site_worker（工地-工人关联集合）
- `_id`: String - 唯一标识符
- `siteId`: String - 工地ID（关联sites._id）
- `workerId`: String - 工人ID（关联workers._id）
- `user_id`: String - 创建者用户ID（必填，关联uni-id-users._id）
- `createTime`: Date - 创建时间
- `updateTime`: Date - 更新时间

#### 1.4 work_hours（工时记录集合）
- `_id`: String - 唯一标识符
- `siteId`: String - 工地ID（关联sites._id）
- `workerId`: String - 工人ID（关联workers._id）
- `date`: Date - 工作日期
- `hours`: Number - 工作小时数（支持小数）
- `user_id`: String - 创建者用户ID（必填，关联uni-id-users._id）
- `createTime`: Date - 创建时间
- `updateTime`: Date - 更新时间

### 2. 数据关系

1. 用户(User) - 工地(Site): 一对多关系，一个用户可以创建多个工地
2. 用户(User) - 工人(Worker): 一对多关系，一个用户可以创建多个工人
3. 工地(Site) - 工人(Worker): 多对多关系，通过site_worker集合关联
4. 工地(Site) - 工时记录(WorkHour): 一对多关系
5. 工人(Worker) - 工时记录(WorkHour): 一对多关系

### 3. 权限设置

为所有集合设置以下权限：
- 读取权限：`"read": "doc.user_id == auth.uid"`（仅创建者可读）
- 创建权限：`"create": "auth.uid != null"`（登录用户可创建）
- 更新权限：`"update": "doc.user_id == auth.uid"`（仅创建者可更新）
- 删除权限：`"delete": "doc.user_id == auth.uid"`（仅创建者可删除）

### 4. 索引设计

为提高查询效率，需要在各集合中添加以下索引：

#### sites 集合索引
- `user_id`：单字段索引
- `{user_id, name}`：复合索引，提高按名称搜索性能

#### workers 集合索引
- `user_id`：单字段索引
- `{user_id, name}`：复合索引，提高按名称搜索性能

#### site_worker 集合索引
- `user_id`：单字段索引
- `{user_id, siteId}`：复合索引，提高工地关联工人查询效率
- `{user_id, workerId}`：复合索引，提高工人关联工地查询效率
- `{siteId, workerId, user_id}`：唯一复合索引，确保同一用户下工地-工人关联不重复

#### work_hours 集合索引
- `user_id`：单字段索引
- `{user_id, siteId}`：复合索引，提高按工地筛选效率
- `{user_id, workerId}`：复合索引，提高按工人筛选效率
- `{user_id, date}`：复合索引，提高按日期筛选效率

## 二、云对象设计

### 0. 通用前置处理（所有云对象共用）

所有云对象都需要在 `_before` 方法中实现用户身份验证和上下文传递：

```javascript
_before: async function() {
  // 获取客户端信息和token
  const clientInfo = this.getClientInfo();
  const token = this.getUniIdToken();
  
  if (!token) {
    throw new Error('用户未登录，请先登录');
  }
  
  // 校验token
  const uniIDCommon = require('uni-id-common');
  const uniID = uniIDCommon.createInstance({
    clientInfo
  });
  
  // 校验token
  const checkTokenRes = await uniID.checkToken(token);
  if (checkTokenRes.errCode) {
    throw new Error('登录状态无效，请重新登录');
  }
  
  // 将用户ID存入上下文
  this.context = {
    uid: checkTokenRes.uid,
    role: checkTokenRes.role,
    permission: checkTokenRes.permission
  };
  
  this.startTime = Date.now();
}
```

### 1. site-service（工地管理云对象）

#### 方法列表：

1. **getSiteList**
   - 功能：获取工地列表，支持按名称搜索
   - 输入参数：
     ```
     {
       keyword: String, // 可选，搜索关键词
       page: Number, // 可选，页码，默认1
       pageSize: Number // 可选，每页数量，默认20
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: {
         list: Array, // 工地列表
         total: Number, // 总数
         page: Number, // 当前页
         pageSize: Number // 每页数量
       }
     }
     ```
   - 实现说明：在查询条件中增加 `user_id: this.context.uid` 条件

2. **saveSite**
   - 功能：添加/修改工地基本信息
   - 输入参数：
     ```
     {
       _id: String, // 可选，有则为修改，无则为新增
       name: String, // 必填，工地名称
       address: String, // 可选，工地地址
       remark: String // 可选，备注
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: Object // 保存后的工地信息
     }
     ```
   - 实现说明：
     - 新增时自动添加 `user_id: this.context.uid`
     - 修改时验证记录所属用户是否为当前用户

3. **deleteSite**
   - 功能：删除工地
   - 输入参数：
     ```
     {
       siteId: String // 必填，工地ID
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String // 消息
     }
     ```
   - 实现说明：删除前验证记录所属用户是否为当前用户

4. **getSiteDetail**
   - 功能：获取工地基本信息
   - 输入参数：
     ```
     {
       siteId: String // 必填，工地ID
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: Object // 工地详细信息
     }
     ```
   - 实现说明：查询条件中增加 `_id: siteId, user_id: this.context.uid`

5. **getSiteWorkers**
   - 功能：获取工地工人列表
   - 输入参数：
     ```
     {
       siteId: String, // 必填，工地ID
       keyword: String, // 可选，搜索关键词
       page: Number, // 可选，页码，默认1
       pageSize: Number // 可选，每页数量，默认20
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: {
         list: Array, // 工人列表
         total: Number, // 总数
         page: Number, // 当前页
         pageSize: Number // 每页数量
       }
     }
     ```
   - 实现说明：聚合查询中增加 `match({siteId, user_id: this.context.uid})`

6. **getAvailableWorkers**
   - 功能：获取可以添加到工地的工人列表（尚未关联到该工地的工人）
   - 输入参数：
     ```
     {
       siteId: String, // 必填，工地ID
       keyword: String, // 可选，搜索关键词
       page: Number, // 可选，页码，默认1
       pageSize: Number // 可选，每页数量，默认20
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: {
         list: Array, // 可添加的工人列表
         total: Number, // 总数
         page: Number, // 当前页
         pageSize: Number // 每页数量
       }
     }
     ```
   - 实现说明：
     - 查询当前用户创建的、且未关联到指定工地的工人
     - 添加 `user_id: this.context.uid` 条件限制

7. **addWorkersToSite**
   - 功能：批量添加工人到工地
   - 输入参数：
     ```
     {
       siteId: String, // 必填，工地ID
       workerId: String // 必填，工人ID，多个ID用逗号分隔
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: {
         successCount: Number // 成功添加的工人数量
       }
     }
     ```
   - 实现说明：
     - 验证工地和工人是否为当前用户所有
     - 添加关联时设置 `user_id: this.context.uid`

8. **removeWorkerFromSite**
   - 功能：从工地移除工人（支持批量移除）
   - 输入参数：
     ```
     {
       siteId: String, // 必填，工地ID
       workerId: String // 必填，工人ID，多个ID用逗号分隔
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: {
         successCount: Number // 成功移除的工人数量
       }
     }
     ```
   - 实现说明：
     - 在查询和删除条件中增加 `user_id: this.context.uid`

### 2. worker-service（工人管理云对象）

#### 方法列表：

1. **getWorkerList**
   - 功能：获取工人列表，支持按名称搜索
   - 输入参数：
     ```
     {
       keyword: String, // 可选，搜索关键词
       page: Number, // 可选，页码，默认1
       pageSize: Number // 可选，每页数量，默认20
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: {
         list: Array, // 工人列表
         total: Number, // 总数
         page: Number, // 当前页
         pageSize: Number // 每页数量
       }
     }
     ```
   - 实现说明：在查询条件中增加 `user_id: this.context.uid` 条件

2. **saveWorker**
   - 功能：添加/修改工人基本信息
   - 输入参数：
     ```
     {
       _id: String, // 可选，有则为修改，无则为新增
       name: String, // 必填，工人姓名
       phone: String, // 可选，联系电话
       remark: String // 可选，备注
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: Object // 保存后的工人信息
     }
     ```
   - 实现说明：
     - 新增时自动添加 `user_id: this.context.uid`
     - 修改时验证记录所属用户是否为当前用户

3. **deleteWorker**
   - 功能：删除工人
   - 输入参数：
     ```
     {
       workerId: String // 必填，工人ID
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String // 消息
     }
     ```
   - 实现说明：
     - 删除前验证记录所属用户是否为当前用户
     - 在查询关联记录时增加 `user_id: this.context.uid` 条件

4. **getWorkerDetail**
   - 功能：获取工人详细信息
   - 输入参数：
     ```
     {
       workerId: String // 必填，工人ID
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: Object // 工人详细信息
     }
     ```
   - 实现说明：查询条件中增加 `_id: workerId, user_id: this.context.uid`

### 3. work-hour-service（工时记录云对象）

#### 方法列表：

1. **saveWorkHours**
   - 功能：工时记录/修改，工人可以多选，但为每个工人创建独立记录
   - 输入参数：
     ```
     {
       _id: String, // 可选，有则为修改单条记录
       siteId: String, // 必填，工地ID
       workerId: String, // 必填，工人ID，新增时支持多个ID用逗号分隔，修改时只能是单个ID
       date: Date, // 必填，工作日期
       hours: Number // 必填，工作小时数
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: {
         successCount: Number, // 成功添加/修改的记录数
         records: Array // 保存的记录列表
       }
     }
     ```
   - 实现说明：
     - 验证工地和工人是否为当前用户所有
     - 新增时添加 `user_id: this.context.uid`
     - 修改时验证记录所属用户是否为当前用户

2. **getWorkHourList**
   - 功能：工时列表，支持按工地、工人、日期范围筛选
   - 输入参数：
     ```
     {
       siteId: String, // 可选，工地ID
       workerId: String, // 可选，工人ID
       startDate: Date, // 可选，开始日期
       endDate: Date, // 可选，结束日期
       page: Number, // 可选，页码，默认1
       pageSize: Number // 可选，每页数量，默认20
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: {
         list: Array, // 工时记录列表
         total: Number, // 总数
         page: Number, // 当前页
         pageSize: Number // 每页数量
       }
     }
     ```
   - 实现说明：在聚合查询中添加 `match({...whereCondition, user_id: this.context.uid})`

3. **deleteWorkHour**
   - 功能：工时删除（单条记录）
   - 输入参数：
     ```
     {
       workHourId: String // 必填，工时记录ID
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String // 消息
     }
     ```
   - 实现说明：
     - 删除前验证记录是否存在且属于当前用户
     - 查询条件中增加 `_id: workHourId, user_id: this.context.uid`

4. **getWorkHourStats**
   - 功能：工时统计列表，支持按工地、工人、日期范围筛选
   - 输入参数：
     ```
     {
       siteId: String, // 可选，工地ID
       workerId: String, // 可选，工人ID
       startDate: Date, // 可选，开始日期
       endDate: Date // 可选，结束日期
     }
     ```
   - 返回数据：
     ```
     {
       code: Number, // 状态码，0表示成功
       message: String, // 消息
       data: {
         list: Array, // 按工人分组的工时统计列表
         total: {
           totalHours: Number, // 总工时
           workerCount: Number // 工人数量
         }
       }
     }
     ```
   - 实现说明：在聚合查询的match阶段添加 `user_id: this.context.uid` 条件

## 三、云存储配置

目前应用场景不需要云存储，如未来需要上传工地照片或工人证件照等功能，可添加以下云存储目录结构：

```
/{user_id}/site-images/  - 存放工地相关图片，按用户ID隔离
/{user_id}/worker-images/ - 存放工人相关图片，按用户ID隔离
/{user_id}/documents/ - 存放其他文档资料，按用户ID隔离
```

## 四、配置与初始化

1. **云数据库初始化**
   - 创建上述四个数据集合
   - 设置基于用户ID的读写权限
   - 为user_id字段创建索引，以及其他必要的复合索引

2. **云对象配置**
   - 创建三个云对象文件夹：site-service, worker-service, work-hour-service
   - 统一实现_before方法进行用户验证和上下文传递
   - 在所有方法实现中添加用户隔离逻辑

3. **权限与安全**
   - 设置严格的数据验证规则
   - 所有查询和修改操作都基于用户ID进行隔离
   - 确保敏感操作前验证数据归属权

4. **前端应用集成**
   - 使用uni-id-pages提供的登录组件进行用户认证
   - 通过uniCloud.callObject方法调用云对象
   - 建议使用uView UI组件库开发前端界面
