import mysql from 'mysql'
import 'dotenv/config'
export const conn =mysql.createConnection({
    user:process.env.user,
    password:process.env.password,
    host:process.env.host,
    database:process.env.database
})

conn.connect((err)=>{
    if(err){
        console.log("Not Connected");
    }
    else{
        console.log("Connected");
    }
})