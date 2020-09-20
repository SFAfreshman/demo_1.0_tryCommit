// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  //删除帖子：需要传入帖子id
  console.log(event.postid)
    return await db.collection('post_collection').where({_id:event.postid}).remove({
      success(res){
        console.log("数据删除成功",res)
      },
      fail(res){
        console.log("数据删除失败",res)
      }}
      )
  
  console.log
}