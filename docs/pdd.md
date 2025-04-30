# 轻量级记工时小程序 - 技术设计方案

## 一、云数据库设计

### 1. 集合设计

#### 1.1 sites（工地集合）
- `_id`: String - 唯一标识符
- `name`: String - 工地名称（必填）
- `address`: String - 工地地址（可选）
- `remark`: String - 备注（可选）
- `createTime`: Date - 创建时间
- `updateTime`: Date - 更新时间

#### 1.2 workers（工人集合）
- `_id`: String - 唯一标识符
- `name`: String - 工人姓名（必填）
- `phone`: String - 联系电话（可选）
- `remark`: String - 备注信息（可选）
- `createTime`: Date - 创建时间
- `updateTime`: Date - 更新时间

#### 1.3 site_worker（工地-工人关联集合）
- `_id`: String - 唯一标识符
- `siteId`: String - 工地ID（关联sites._id）
- `workerId`: String - 工人ID（关联workers._id）
- `createTime`: Date - 创建时间
- `updateTime`: Date - 更新时间

#### 1.4 work_hours（工时记录集合）
- `_id`: String - 唯一标识符
- `siteId`: String - 工地ID（关联sites._id）
- `workerId`: String - 工人ID（关联workers._id）
- `date`: Date - 工作日期
- `hours`: Number - 工作小时数（支持小数）
- `createTime`: Date - 创建时间
- `updateTime`: Date - 更新时间

### 2. 数据关系

1. 工地(Site) - 工人(Worker): 多对多关系，通过site_worker集合关联
2. 工地(Site) - 工时记录(WorkHour): 一对多关系
3. 工人(Worker) - 工时记录(WorkHour): 一对多关系

### 3. 权限设置

建议为所有集合设置以下权限：
- 默认设置为"所有用户可读，仅创建者可写"
- 或者更严格的"仅管理端可读写"（如果所有操作都通过云对象进行）

## 二、云对象设计

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

## 三、云存储配置

目前应用场景不需要云存储，如未来需要上传工地照片或工人证件照等功能，可添加以下云存储目录结构：

```
/site-images/  - 存放工地相关图片
/worker-images/ - 存放工人相关图片
/documents/ - 存放其他文档资料
```

## 四、配置与初始化

1. **云数据库初始化**
   - 创建上述四个数据集合
   - 设置适当的读写权限
   - 创建索引以提高查询性能（如工人姓名、工地名称、日期等字段）

2. **云对象配置**
   - 创建三个云对象文件夹：site-service, worker-service, work-hour-service
   - 在每个文件夹中实现对应的云对象方法

3. **权限与安全**
   - 设置适当的数据验证规则
   - 确保敏感操作（如删除）有适当的权限控制
   - 所有云对象方法增加必要的参数验证

4. **前端应用集成**
   - 使用uniCloud-db组件连接云数据库
   - 通过uniCloud.callObject方法调用云对象
   - 建议使用uView UI组件库开发前端界面
