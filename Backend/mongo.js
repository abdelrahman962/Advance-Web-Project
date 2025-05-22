
//mongodb+srv://Abdelrahman:<db_password>@abdelrahman.v3kl9.mongodb.net/?retryWrites=true&w=majority&appName=Abdelrahman

const express=require("express");

const app=express();
const mongoose=require("mongoose");
const User=require("./models/User");
const Project=require("./models/Project");
const Task=require("./models/Task");                        

mongoose.connect("mongodb+srv://Abdelrahman:Abood1842003@abdelrahman.v3kl9.mongodb.net/?retryWrites=true&w=majority&appName=Abdelrahman")
.then(()=>{
console.log("connecting succesfully");
}).catch(()=>{
    console.log("error connecting with Database");
})
app.use(express.json());

