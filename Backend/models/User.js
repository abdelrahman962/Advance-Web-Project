

const mongoose=require("mongoose");
const {Schema}=mongoose;
const userSchema=new Schema({
    name:{
        type:String,
        required:[true,"Name is required"], 
        trim:true, 
        unique:true, 
    },
    password:{
        type:String,
        required:[true,"Password is required"], 
        minlength:[6,"Password must be at least 6 characters long"], 
    select: false 
    },
    role:{
        type:String,
        required:[true,"Role is required"], 
        enum: ['Student', 'Admin'], 
        default: 'Student' 
    },
    UniId:{
        type:Number,
         required: function() { return this.role === 'Student'; },
    sparse: true, 
    trim: true
    }
});

const User=mongoose.model("User",userSchema);
module.exports=User;


