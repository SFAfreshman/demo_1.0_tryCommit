//app.js
const util = require('./utils/util.js');  
App({
  onLaunch: function () {
    var that = this
    wx.clearStorage()

    //Delete Start
    //初始化云开发能力，需要删除
    wx.cloud.init({
      env:'sfa-81192',
      traceUser: true
    })

    wx.cloud.callFunction({
      name: 'get_openid',   
      complete: res => {
            console.log('云函数获取到的openid: ', res.result.openId)   
            var openid = res.result.openId;
            that.globalData.wechatOpenid=openid
   console.log('全局openid: ', that.globalData.wechatOpenid) 
 },
//结束符1.0
})

    
    //Delete End
  },

  globalData: {
    userInfo: 'StorageUserInfo',
    wechatNickName: '',
    wechatAvatarUrl: '',
    wechatOpenid:''
  }
  
})