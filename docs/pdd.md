# AI画廊小程序数据设计文档

## 数据实体关系

### 主要实体
1. **用户(User)** - 来自uni-id-pages的用户数据
2. **图片(Image)** - AI生成的图片，包含提示词信息

### 关联关系
- 用户 ⟷ 图片：一对多（一个用户可创建多张图片）

## 云开发资源设计

### 云数据库集合

1. **users** (由uni-id-pages自动创建和管理)
   - _id: String (自动生成)
   - username: String
   - nickname: String
   - avatar_file: Object {url, name}
   - ...其他uni-id用户字段

2. **images**
   - _id: String (自动生成)
   - user_id: String (关联用户ID)
   - prompt: String (生成图片的提示词文本)
   - file_id: String (云存储文件ID)
   - url: String (图片访问地址)
   - create_time: Date (创建时间)

### 云存储结构
```
/gallery/
  /{user_id}/
    /{image_id}.jpg  // 生成的图片按用户和图片ID存储
```

### 云对象（云函数）

1. **ImageGenerator**
   - 方法：generate(prompt, userId)
   - 功能：调用AI模型API生成图片，保存到云存储，创建images记录

2. **UserImagesManager**
   - 方法：getUserImages(userId, page, limit)
   - 方法：deleteImage(imageId, userId)
   - 功能：管理用户创建的图片

3. **GalleryManager**
   - 方法：getPublicImages(page, limit, filter)
   - 功能：获取首页展示的图片列表

## 数据流程

1. **创建图片流程**
   - 用户登录（uni-id-pages）获取user_id
   - 用户输入提示词（包含风格描述）
   - 前端调用ImageGenerator.generate
   - 云函数处理生成请求：
     1. 调用AI模型API生成图片
     2. 上传图片到云存储目录 `/gallery/{user_id}/{image_id}.jpg`
     3. 创建image记录，包含完整prompt
   - 返回生成结果给前端

2. **首页展示流程**
   - 前端调用GalleryManager.getPublicImages
   - 云函数查询images集合中的记录（可按创建时间倒序）
   - 关联查询创建者信息（用户头像、昵称）
   - 返回瀑布流所需的图片数据

3. **用户"我的"页面**
   - 用户登录后，前端调用UserImagesManager.getUserImages
   - 云函数根据user_id查询该用户创建的所有图片
   - 返回用户创建的图片列表

## 风格处理方式

风格选项在前端定义，用户选择风格后将其描述文本追加到提示词中，作为完整prompt的一部分发送给后端。

```javascript
// 前端定义的风格选项
const styleOptions = [
  { id: 'realistic', name: '写实', text: '写实风格，高度逼真' },
  { id: 'anime', name: '动漫', text: '动漫风格，二次元' },
  { id: 'oilpainting', name: '油画', text: '油画风格，浓郁质感' },
  { id: 'watercolor', name: '水彩', text: '水彩画风格，清新淡雅' },
  { id: 'sketch', name: '素描', text: '素描风格，黑白线条' },
  { id: 'pixel', name: '像素', text: '像素艺术风格，8-bit复古' },
  { id: 'photo', name: '照片', text: '摄影风格，真实照片效果' },
  { id: '3d', name: '3D渲染', text: '3D渲染风格，立体感强' },
];
```

## 实施方案

### 云数据库表结构详细设计（schema）

**images表：**
```json
{
  "bsonType": "object",
  "required": ["user_id", "prompt", "url", "create_time"],
  "properties": {
    "_id": {
      "description": "ID，系统自动生成"
    },
    "user_id": {
      "bsonType": "string",
      "description": "创建用户ID"
    },
    "prompt": {
      "bsonType": "string",
      "description": "生成图片的提示词"
    },
    "file_id": {
      "bsonType": "string",
      "description": "云存储中的文件ID"
    },
    "url": {
      "bsonType": "string",
      "description": "图片访问地址"
    },
    "create_time": {
      "bsonType": "timestamp",
      "description": "创建时间"
    }
  }
}
```

### 云对象（云函数）实现概览

**ImageGenerator：**
```javascript
module.exports = {
  async generate(prompt, userId) {
    // 1. 调用AI生成API
    const imageResult = await this.callAIService(prompt);
    
    // 2. 获取图片数据
    const imageBuffer = imageResult.imageData;
    
    // 3. 上传到云存储
    const imageId = Date.now().toString();
    const uploadResult = await uniCloud.uploadFile({
      cloudPath: `gallery/${userId}/${imageId}.jpg`,
      fileContent: imageBuffer
    });
    
    // 4. 创建图片记录
    const db = uniCloud.database();
    const imageRecord = {
      user_id: userId,
      prompt: prompt,
      file_id: uploadResult.fileID,
      url: uploadResult.fileID, // 可能需要通过uniCloud.getTempFileURL转换
      create_time: new Date()
    };
    
    const result = await db.collection('images').add(imageRecord);
    
    // 5. 返回结果
    return {
      success: true,
      imageId: result.id,
      url: imageRecord.url
    };
  },
  
  async callAIService(prompt) {
    // 调用第三方AI图像生成API
    // 返回生成的图像数据
    // 具体实现取决于您选择的AI服务
  }
}
```

**GalleryManager：**
```javascript
module.exports = {
  async getPublicImages(page = 1, limit = 10) {
    const db = uniCloud.database();
    const $ = db.command.aggregate;
    
    // 聚合查询，关联用户信息
    const result = await db.collection('images')
      .aggregate()
      .lookup({
        from: 'uni-id-users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'creator'
      })
      .project({
        _id: 1,
        prompt: 1,
        url: 1,
        create_time: 1,
        creator: {
          $arrayElemAt: ['$creator', 0]
        }
      })
      .project({
        _id: 1,
        prompt: 1,
        url: 1,
        create_time: 1,
        'creator._id': 1,
        'creator.nickname': 1,
        'creator.avatar_file': 1
      })
      .sort({
        create_time: -1
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .end();
      
    return result.data;
  }
}
```

**UserImagesManager：**
```javascript
module.exports = {
  async getUserImages(userId, page = 1, limit = 10) {
    const db = uniCloud.database();
    
    const result = await db.collection('images')
      .where({
        user_id: userId
      })
      .orderBy('create_time', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get();
      
    return result.data;
  },
  
  async deleteImage(imageId, userId) {
    const db = uniCloud.database();
    
    // 1. 查询图片记录，确认所有权
    const imageRecord = await db.collection('images')
      .where({
        _id: imageId,
        user_id: userId
      })
      .get();
      
    if (imageRecord.data.length === 0) {
      return {
        success: false,
        message: '图片不存在或无权删除'
      };
    }
    
    const fileId = imageRecord.data[0].file_id;
    
    // 2. 删除云存储文件
    try {
      await uniCloud.deleteFile({
        fileList: [fileId]
      });
    } catch (error) {
      console.error('删除云存储文件失败:', error);
    }
    
    // 3. 删除数据库记录
    await db.collection('images')
      .doc(imageId)
      .remove();
      
    return {
      success: true
    };
  }
}
```

这个设计直接将提示词作为图片记录的一部分，风格选项在前端维护并作为提示词的辅助输入，简化了后端实现。
