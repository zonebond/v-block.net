##Installation
```
# via Npm
npm install v-block.net -S
```
or
```
# via Yarn
yarn add v-block.net -S
```

## 拦截器、Mock系统与Demo机制

## FakeBackend (Fake-Http-Backend)
**包 : v-block/net**

FakeBackend是一个可以拦截http请求与响应的组件。它是在浏览器上工作的，不依赖于后台真实的API服务。此组件能够修改原始请求与响应结果，所以，在很多需要对http统一处理的业务场景非常有用(如：请求header统一加token等)。并且，此组件可以与其它任何ajax组件配合使用(如：fetch、axios、requrest...)。
由于组件拦截是基于底层XmlHttpRequest原始能力进行封装的，所以能很轻易的植入任何JS前端系统。几乎不需要写任何代码。
FakeBackend还设计了基于RESTful规范的http请求匹配规则Scheme匹配。能很好的完成Mock与数据Demo等工作。并且没有侵入性，也不影响原有正式的业务代码。还能与Proxy代码系统协同完成API联调等工作。

```
// 在主入口文件引入，使拦截器第一时间工作。
import 'v-block/net'
```

**配置与方法**

引入工具库
```
import { FakeBackend } from 'v-block/net'
```

**Interception**
```
FakeBackend.interception({options});
```

**options: <object>**
**request: <function | generator | sync function>**
**response: <function | generator | sync function>**

eg.
```
import { FakeBackend } from 'v-block/net'

FakeBackend.interception({
  request: function (ctx) {
    // todos before request
  },
  response: function (ctx) {
    // todos after response
  }
});
```

**Scheme**
```
FakeBackend.scheme({api:String, schemeMap:Object});
```

**api:<string>**
**schemeMap: <object | map>**

```
import { FakeBackend } from 'v-block/net'

// api服务资源 <REST类型API>
const api_uri = '/api-service/:param-a/action/:param-b';

// 配置模拟匹配方案
FakeBackend.scheme(api_uri, {
  null: './mocks/mock-data.json',
  "@param-a:*,@param-b:*": "/mocks/mock-data-params.json"
});
```

**Scheme配置规则**
服务API使用的是RESTful风格。通过:(冒号)+参数名称，如 :username 来表示这是一个参数变量。
schemeMap配置规则也是通过对参数的匹配规则映射来完成具体的API结果模拟的。 基本上是 键值对 key 是规则 value 是处理方式。

key的规则如果：
1. **null、""（空字符串）:匹配值**   ->  匹配没有参数的所有模拟结果。
2. **@name:匹配值**                            ->  匹配指定参数的指定结果，如果想匹配指定参数的所有结果(也就是只要出现目标参数时就匹配成功)。使用@参数名:*。使用，号隔开多个参数。多个参数是以and匹配的，也就是多个参数同时匹配成功，才是匹配成功。
*（星号）表示匹配参数的任意结果。

value的规则：
1. 匹配值可以是 静态模拟数据文件的相对位置。
2. 匹配值也可以是function函数，用于模拟更复杂的结果或流程。

如：匹配 
```
api:   /xxx/:username/xx/:class/xxxx
```

eg.
```
FakeBackend.scheme(api, {
  // 规则 + 静态结果
  null:                   '/mocks/username.json', 
  "":                     '/mocks/username.json',
  "@username:*":          '/mocks/username-*.json',
  "@class:*":             '/mocks/class-*.json',
  "@username:xiaoming":   '/mocks/username-xiaoming.json',
  "@username:*,@class:*": '/mocks/username-class-*.json',

  // 规则 + 处理函数
  "@username:*": function(ctx, resolve, reject){
      // todo process datas
      // resolve :: result  
  }
});
```

**注意**
我们推荐使用RESTful风格API。也主是说，匹配规则不能匹配?后的参数。
```
如：
xxx/xxx/xxx/xxx?username=xiaoming  // 非RESTful 不可匹配！
```
特殊情况。如果一定要匹配?后的参数。就必须显示声明所有的参数可能出现的位置。
```
如：
const api = "xxx/xxx/:aaa/xxx?bbb=:bbb-b&ccc=:ccc"

规则：
FakeBackend.scheme(api, {
  "@aaa:*,@bbb:*,@ccc:*": 匹配值 
});   // 非RESTful 不可匹配！
```

**关闭Scheme**
出于设计原因，有些项目需要在服务缺失的情况下运行。然而，有些项目则不需要这样的功能。所以可以使用以下方式关闭Scheme匹配功能。
**关闭Scheme功能，不会影响拦截器功能**
```
import {FakeBackend} from 'v-block/net'
//彻底关闭Scheme匹配功能。但不影响拦截器功能。
FakeBackend.Shotdown();
```
或者，可以使用工程化方式直接去掉不希望出现的Scheme代码。
```
// 只在开发模式下注册scheme匹配。
if(process.env.NODE_ENV === 'development') {
  // 配置模拟匹配方案
  FakeBackend.scheme(api_uri, {
    null: './mocks/mock-data.json',
    "@param-a:*,@param-b:*": "/mocks/mock-data-params.json"
  });
}
```

**DEMO机制的使用**
在系统中引入FakeBackend组件，并配置了Scheme匹配后。就能根据业务逻辑模拟后台数据响应交互。
如果只是纯粹的页面效果展示，只要做到每种API有响应结果就可以了。就能使用户感受到系统的大部分特性。
如果需要高保真交互，也就是能对数据进行交互式响应的形式。推荐使用函数形式做Scheme匹配。
```
FakeBackend.scheme(api_uri, {
  "匹配规则": function(context, resolve, reject) {
    // todo something
  }
});
```
这样就能完全真实的对请求做出合乎业务交互的响应结果，甚至可以用延迟响应的方式来模拟网络拥塞的场景。

- - - -

作者 **zonebond**  

**zonebond@126.com**

更多技术文章，请关注：[知乎专栏](https://www.zhihu.com/people/zonebond)