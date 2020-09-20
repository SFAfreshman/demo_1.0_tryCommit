const util = require('../../utils/util.js');
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    contentLoaded: false,
    imagesLoaded: false,
    commentLoaded: false,
    detail: {},
    imageUrls: [],
    collected: false,
    inputBoxShow: true,
    maxContentLength: 300,
    comment: '',
    comments: [],
    postid: '',
    comment_value: '',
    openid: ''
  },
  //刷新评论
  refreshComment: function (postid) {
    var that = this
    //调用获取评论函数
    wx.cloud.callFunction({
      name: 'get_comment_for_post',
      data: {
        postid: postid,
      },
      //查询成功：控制台打印信息，var commentList接受数据库返回结果，格式化时间字符串
      success: function (res) {
        console.log(res.result.comment_list.data)
        var commentList = res.result.comment_list.data
        for (let i = 0; i < commentList.length; i++) {
          commentList[i].time = util.formatTime(new Date(commentList[i].time))
        }
        //通过setdata传递数据到视图层：标记评论加载状态true
        that.setData({
          comments: res.result.comment_list.data,
          commentLoaded: true
        })
        that.checkLoadFinish()
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中',
    })
    var that = this
    console.log('postid', options.postid)
    const db = wx.cloud.database()
    const _ = db.command
    db.collection('post_collection').doc(options.postid).get({
      success: function (res) {
        console.log(res.data)
      }
    })
    //console.log(app.globalData.wechatOpenid)
    // 更新浏览次数，TODO本地如何及时同步
    wx.cloud.callFunction({
      name: 'update_watch_count',
      data: {
        postid: options.postid
      },
      success: function (res) {
        console.log('更新成功')
      }
    })
    //获取openid

    // 获取内容
    wx.cloud.callFunction({
      // 云函数名称 
      name: 'get_post_detail',
      data: {
        postid: options.postid
      },
      success: function (res) {
        var postdetail = res.result.postdetail.data[0];
        postdetail.publish_time = util.formatTime(new Date(postdetail.publish_time))
        //

        //拟实现收藏功能：未解决异步产生的获取openid延迟问题,改用gobalopenid
        if (postdetail.collecter.length == 0) {
          //console.log('0123')
          that.setData({
            collected: false
          })
        } else {
          console.log('2345')
          if ((postdetail.collecter.indexOf(app.globalData.wechatOpenid)) >= 0) {
            console.log('该贴被收藏')
            that.setData({
              collected: true
            })

          }

        }

        that.setData({
          detail: postdetail,
          contentLoaded: true,
          openid: app.globalData.wechatOpenid
        }) //data初始化时直接赋值为app.globalData.wechatOpenid失败，只有云函数能这么用？
        //直接控制台打印打印成功
        that.downloadImages(postdetail.image_url)
      },
      fail: console.error
    })
    this.setData({
      postid: options.postid
    })
    //结束符2.0
    //})
    // 获取评论
    this.refreshComment(options.postid)

  },
  /**
   * 从数据库获取图片的fileId，然后去云存储下载，最后加载出来
   */
  downloadImages: function (image_urls) {
    var that = this
    if (image_urls.length == 0) {
      that.setData({
        imageUrls: [],
        imagesLoaded: true
      })
    } else {
      var urls = []
      for (let i = 0; i < image_urls.length; i++) {
        wx.cloud.downloadFile({
          fileID: image_urls[i],
          success: res => {
            // get temp file path
            console.log(res.tempFilePath)
            urls.push(res.tempFilePath)
            if (urls.length == image_urls.length) {
              console.log(urls)
              that.setData({
                imageUrls: urls,
                imagesLoaded: true
              })
              this.checkLoadFinish()
            }
          },
          fail: err => {
            // handle error
          }
        })

      }
    }
    this.checkLoadFinish()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {


  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  sendComment: function () {
    var that = this
    if (this.data.comment.length < 1) {
      wx.showToast({
        image: '../../images/warn.png',
        title: '评论不能为空',
      })

      return
    }
    wx.showLoading({
      title: '发布中',
    })
    wx.cloud.callFunction({
      // 云函数名称 
      name: 'add_comment',
      data: {
        postid: this.data.detail._id,
        name: app.globalData.wechatNickName,
        avatarUrl: app.globalData.wechatAvatarUrl,
        content: this.data.comment
      },
      success: function (res) {
        //评论成功后隐藏加载
        wx.hideLoading()
        that.refreshComment(that.data.postid)
        that.setData({
          comment_value: ''
        })
      }
    })

  },
  input: function (e) {
    if (e.detail.value.length >= this.data.maxContentLength) {
      wx.showToast({
        title: '已达到最大字数限制',
      })
    }
    this.setData({
      comment: e.detail.value
    })
  },
  //如果所有数据加载完毕，隐藏加载弹窗
  checkLoadFinish: function () {
    const that = this
    if (that.data.contentLoaded &&
      that.data.imagesLoaded &&
      that.data.commentLoaded) {
      wx.hideLoading()
    }
  },
  delclick: function () {
    var that = this

    wx.cloud.callFunction({
      name: 'del_post',
      data: {
        postid: this.data.postid
      },
      success: function (res) {
        var pages = getCurrentPages(); //  获取页面栈
        var prevPage = pages[pages.length - 2]; // 上一个页面
        prevPage.setData({
          update: true
        })
        wx.navigateBack({
          delta: 1
        })
      }
    }, )
    // console.log('1234')
  }

})