/**
 * 通用uni-app网络请求
 * 基于 Promise 对象实现更简单的 request 使用方式，支持请求和响应拦截
 */

/*
// 开放的接口
import http from './interface'

http.config.baseUrl = "http://localhost:8080/api/"

http.request(url:'user/list',method:'GET').then((res)=>{
	console.log(JSON.stringify(res))
})
http.get('user/list').then((res)=>{
	console.log(JSON.stringify(res))
})
http.get('user/list', {status: 1}).then((res)=>{
	console.log(JSON.stringify(res))
})
http.post('user', {id:1, status: 1}).then((res)=>{
	console.log(JSON.stringify(res))
})
http.put('user/1', {status: 2}).then((res)=>{
	console.log(JSON.stringify(res))
})
http.delete('user/1').then((res)=>{
	console.log(JSON.stringify(res))
}) 

*/
import store from '@/store'
import md5 from 'js-md5'

module.exports = {
	config: {
		baseUrl: process.env.NODE_ENV === 'development' ? "https://mini.withsunny.fun/" : "https://mini.vlianquan.com/",
		header: {
			'Content-Type':'application/json;charset=UTF-8',
			'Content-Type':'application/x-www-form-urlencoded'
		},  
		data: {},
		method: "GET",
		dataType: "json",  /* 如设为json，会对返回的数据做一次 JSON.parse */
		responseType: "text",
		success() {},
		fail() {},
		complete() {}
	},
	interceptor: {
		request(config) {
      // console.log(config)
      if (store.state.token) {
        config.header.token = store.state.token;
      }
      const getSign = (obj) => {
        // 获取接口签名 sign
        let keys = Object.keys(obj).sort();
        // console.log(keys)
        let b = {};
        keys.forEach((item) => {
          b[item] = obj[item]
        })
        // console.log(b);
        let value = Object.values(b);
        // console.log(value);
        let str = value.join('');
        // console.log(str);
        let sign = md5(str);
        // console.log(sign);
        return sign;
      };
      const sign = getSign(config.data);
      config.data.sign = sign;
    },
		response(response) {
      // 返回成功则提取有用数据
      // console.log(response)
      if (response.statusCode === 200) {
        if (response.data.ret === 200) {
          // 数据返回成功则只要数据
          return response.data.data;          
        } else if (response.data.ret === 301) {
          // 游客身份登录
          return response.data;
        } else if (response.data.ret === 404) {
          // 新用户注册失败
          return response.data;
        } else if (response.data.ret === 405) {
          // token 已过期
          uni.showModal({
            title: 'token 已过期',
            content: '请在首页下拉刷新，以重新登录',
            showCancel: false,
            success() {
              uni.switchTab({
                url: '/pages/homepage/homepage'
              })
            }
          });
          return Promise.reject(response.data.msg);
        } else {
          uni.showModal({
            title: '提示',
            content: response.data.msg,
            showCancel: false
          });
          return Promise.reject(response.data.msg);
        }
      }
      return response;
    }
	},
	request(options) {
		if (!options) {
			options = {}
		}
		options.baseUrl = options.baseUrl || this.config.baseUrl
		options.dataType = options.dataType || this.config.dataType
		options.url = options.baseUrl + options.url
		options.data = options.data || {}
		options.method = options.method || this.config.method
		//TODO 加密数据
		
		//TODO 数据签名
		/* 
		_token = {'token': getStorage(STOREKEY_LOGIN).token || 'undefined'},
		_sign = {'sign': sign(JSON.stringify(options.data))}
		options.header = Object.assign({}, options.header, _token,_sign) 
		*/
	   
		return new Promise((resolve, reject) => {
			let _config = null
			
			options.complete = (response) => {
				let statusCode = response.statusCode
				response.config = _config
				if (process.env.NODE_ENV === 'development') {
					if (statusCode === 200) {
						// console.log("【" + _config.requestId + "】 结果：" + JSON.stringify(response.data))
					}
				}
				if (this.interceptor.response) {
					let newResponse = this.interceptor.response(response)
					if (newResponse) {
						response = newResponse
					}
				}
				// 统一的响应日志记录
				// _reslog(response)
				if (statusCode === 200) { //成功
					resolve(response);
				} else {
					reject(response)
				}
			}

			_config = Object.assign({}, this.config, options)
			_config.requestId = new Date().getTime()

			if (this.interceptor.request) {
				this.interceptor.request(_config)
			}
			
			// 统一的请求日志记录
			// _reqlog(_config)

			// if (process.env.NODE_ENV === 'development') {
			// 	console.log("【" + _config.requestId + "】 地址：" + _config.url)
			// 	if (_config.data) {
			// 		console.log("【" + _config.requestId + "】 参数：" + JSON.stringify(_config.data))
			// 	}
			// }

			uni.request(_config);
		});
	},
	get(url, data, options) {
		if (!options) {
			options = {}
		}
		options.url = url
		options.data = data
		options.method = 'GET'  
		return this.request(options)
	},
	post(url, data, options) {
		if (!options) {
			options = {}
		}
		options.url = url
		options.data = data
		options.method = 'POST'
		return this.request(options)
	},
	put(url, data, options) {
		if (!options) {
			options = {}
		}
		options.url = url
		options.data = data
		options.method = 'PUT'
		return this.request(options)
	},
	delete(url, data, options) {
		if (!options) {
			options = {}
		}
		options.url = url
		options.data = data
		options.method = 'DELETE'
		return this.request(options)
	}
}


/**
 * 请求接口日志记录
 */
/* function _reqlog(req) {
	if (process.env.NODE_ENV === 'development') {
		console.log("【" + req.requestId + "】 地址：" + req.url)
		if (req.data) {
			console.log("【" + req.requestId + "】 请求参数：" + JSON.stringify(req.data))
		}
	}
	//TODO 调接口异步写入日志数据库
} */

/**
 * 响应接口日志记录
 */
/* function _reslog(res) {
	let _statusCode = res.statusCode;
	if (process.env.NODE_ENV === 'development') {
		console.log("【" + res.config.requestId + "】 地址：" + res.config.url)
		if (res.config.data) {
			console.log("【" + res.config.requestId + "】 请求参数：" + JSON.stringify(res.config.data))
		}
		console.log("【" + res.config.requestId + "】 响应结果：" + JSON.stringify(res))
	}
	//TODO 除了接口服务错误外，其他日志调接口异步写入日志数据库
	switch(_statusCode){
		case 200:
			break;
		case 401:
			break;
		case 404:
			break;
		default:
			break;
	}
} */

