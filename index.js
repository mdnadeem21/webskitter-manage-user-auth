require('dotenv').config()
const express=require("express")
const cors=require('cors')
const path=require('path')
const cookieParser=require('cookie-parser')
const connectDB=require("./app/config/db")
const UserRoute=require('./app/routes/user.routes')


connectDB()
const app=express();

//middleware
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended:true}))

//static folder
app.use(express.static('public'))
app.use('uploads',express.static(path.join(__dirname,'/uploads')))
app.use('/uploads',express.static('uploads'))

app.use(cookieParser())


app.get('/',(req,res) => {
    res.send("Welcome to user auth manage app... ")
})
app.use('/api',UserRoute)

const PORT=process.env.PORT


app.listen(PORT,(error)=>{
    if(error){
        console.log(error);
    }else{
        console.log("server is running on port ",`http://localhost:${PORT}`);
    }
})