# 增强型Storage

## 终端类型

- PC Web端
- 移动 Web端

## 功能

- expires机制
- 内容过滤
- 数据加密、解密

## 功能点

1. 提供配置选项（设置超时时间）
2. 对数据进行加密
3. 在单独调用的时候可进行单独配置
4. 提供清除所有数据的方法
5. 提供清除所有超时数据的方法
6. 浏览器兼容性判断
7. 添加数据
8. 更新数据超时时间
9. 更新数据值
10. 删除数据
11. 删除超时数据
12. 删除所有数据
13. 获取数据（获取超时数据时，返回的为超时提示并移除该数据）
14. 获取所有数据（获取超时数据时，返回的为超时提示并移除该数据）

## 存储格式

参照[web-storage-cache](https://github.com/WQTeam/web-storage-cache)的存储方式

```
{'key', {'c': 123, 'e': 123, 'v': 'value'}}
```

1. `'c'`：该数据创建的时间
2. `'e'`：该数据超时的时间
3. `'v'`：该数据具体的值

## 调用方法

### setItem(key, value, opt)

设置单独项

- key：必填项；key值
- value：必填项；要存储的数据
- opt：非必填；配置项，`{exp: 1000}`
  - exp: 超时时间，number 型
  - baseTime：设置基准时间
  - crypt: 加密方式；默认及目前仅支持为"base64"，值为“null”则不加密

### getItem(key)

获取项

- key：必填项；key值

### getAll()

获取全部存储的数据，只返回数据的具体值，不返回创建时间和超时时间

### updateItem(key, value, opt)

更新某一项

- key：必填项；key值
- value：必填项；要存储的数据
- opt：非必填；配置项，`{exp: 1000}`
  - exp: 超时时间，number 型

### updateExp(key, exp)

更新超时时间

- key：必填项；key值
- exp：必填项；超时时间

### deleteItem(key)

删除某一项

- key：必填项；key值

### deleteAllExp()

删除全部超时项

### deleteAll()

删除全部数据

## 例子

```
// 设置基准时间
var baseTime = function(){
	return new Date().valueOf();
}

// 实例化对象
var exStorage = new ExtendStorage({baseTime: baseTime}); // 设置全局的基准时间

// 设置项
exStorage.setItem('test', {'name':'www','array': [1,2,3,"a"]},{baseTime: baseTime});
exStorage.setItem('test2', {'name':'www','array': [1,2,3,"abc"]},{exp: 1000});

// 获取某一项
console.log(exStorage.getItem('test2'));

// 获取全部项
console.log(exStorage.getAll());

// 更新超时时间
exStorage.updateExp('test', 1000);

// 更新某一项
exStorage.updateItem('test', {name:'ccc',age:12})

// 删除某一项
exStorage.deleteItem('test');

// 删除超时项
exStorage.deleteAllExp();

// 删除全部
exStorage.deleteAll();

```

## Feture

## Bugs

## Logs

### 2017.03.10

1. 添加项、删除项、更新项、更新超时时间、删除单个项、删除超时项、获取单个项的功能开发
2. 增加字符串、json互相转换的单元测试

### 2017.03.13

1. 增加base64加解密
2. 增加异常处理