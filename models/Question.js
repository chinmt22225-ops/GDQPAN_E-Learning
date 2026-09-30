const mongoose=require('mongoose');
const schema=new mongoose.Schema({text:{type:String,required:true},choices:{A:String,B:String,C:String,D:String},correct:{type:String,enum:['A','B','C','D'],required:true},active:{type:Boolean,default:true}},{timestamps:true});
module.exports=mongoose.model('Question',schema);
