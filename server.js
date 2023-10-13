const express = require('express')
const app = express();
const dotenv = require('dotenv')

dotenv.config();

app.set('view engine', 'ejs');
const {MongoClient, ObjectId} = require('mongodb');

app.use(express.static(__dirname + '/public'))

let db;
let sample;
const url = `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PW}@cluster0.azui0ns.mongodb.net/`

new MongoClient(url).connect().then((client)=>{
    db = client.db("board");
    sample = client.db("sample_weatherdata")
    console.log("DB 연결 완료!!")
    app.listen(process.env.SERVER_PORT, ()=>{
        console.log(`${process.env.SERVER_PORT}번호에서 서버 실행 중`)
    })
}).catch((error)=>{
    console.log(error)
})





app.get('/', (req,res)=>{
    // res.send("Hello World");
    res.sendFile(__dirname + '/page/index.html')
})
app.get('/about', (req,res)=>{
    res.send("어바웃 페이지");
    // db.collection("notice").insertOne({
    //     title: "첫번째 글",
    //     content: "두번째 글"
    // })
})
app.get('/list', async (req,res)=>{

    const result = await db.collection("notice").find().toArray()
    // console.log(result[0])

    res.render("list.ejs", {
        data : result
    })
})

app.get('/view/:id', async (req,res)=>{
    const result = await db.collection("notice").findOne({
        _id : new ObjectId(req.params.id)
    })
    console.log(result)
    res.render("view.ejs", {
        data : result
    })
})

app.get('/qna', (req,res)=>{
    res.send("qna 페이지2");
})
