const express = require('express')
const app = express();
const dotenv = require('dotenv')

dotenv.config();
app.use(express.json());
app.use(express.urlencoded({extended: true}))

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

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

app.get('/write', (req,res)=>{
    res.render('write.ejs')
})

app.get('/qna', (req,res)=>{
    res.send("qna 페이지2");
})

app.post('/add', async (req,res)=>{
    console.log(req.body)
    try{
        await db.collection("notice").insertOne({
            title: req.body.title,
            content: req.body.content
        })
    }catch(error){
        console.log(error)
    }
    // res.send("성공!")
    res.redirect('/list')
})

app.put('/edit', async (req,res)=>{
    console.log(req.body)
    await db.collection("notice").updateOne({
        _id : new ObjectId(req.body._id)
    }, {
        $set : {
            title: req.body.title,
            content: req.body.content
        }
    })
    // const result = "";
    // res.send(result)
    res.redirect('/list')
})

app.get('/edit/:id', async (req,res)=>{
    const result = await db.collection("notice").findOne({
        _id : new ObjectId(req.params.id)
    })
    res.render('edit.ejs', {
        data: result
    })
})

app.delete('/delete', async (req,res)=>{
    await db.collection("notice").deleteOne({
        _id : new ObjectId(req.body._id)
    })
    res.redirect('/list')
})
