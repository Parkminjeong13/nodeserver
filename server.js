const express = require('express');
const app = express();
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MongoStore = require('connect-mongo');

dotenv.config();
app.use(express.json());
app.use(express.urlencoded({extended: true}))

const url = `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PW}@cluster0.azui0ns.mongodb.net/`

app.use(passport.initialize());
app.use(session({
    secret : '암호화에쓸비번', // 세션 문서의 암호화
    resave : false, // 유저가 서버로 요청할 때마다 갱신할건지
    saveUninitialized : false, // 로그인 안해도 세션 만들건지
    cookie: {maxAge: 60 * 60 * 1000},
    store : MongoStore.create({
        mongoUrl : url,
        dbName: "board"
    })
}))
app.use(passport.session());



const methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
const {MongoClient, ObjectId} = require('mongodb');

app.use(express.static(__dirname + '/public'))

let db;
let sample;


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

    const result = await db.collection("notice").find().limit(5).toArray()
    // console.log(result[0])

    res.render("list.ejs", {
        data : result
    })
})
app.get('/list/:id', async (req,res)=>{

    const result = await db.collection("notice").find().skip((req.params.id-1)*5).limit(5).toArray()
    // console.log(result[0])

    res.render("list.ejs", {
        data : result
    })
})

app.get('/view/:id', async (req,res)=>{
    const result = await db.collection("notice").findOne({
        _id : new ObjectId(req.params.id)
    })
    // console.log(result)
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
    // console.log(req.body)
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
    // console.log(req.body)
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

app.get('/delete/:id', async (req,res)=>{    
    await db.collection("notice").deleteOne({
        _id : new ObjectId(req.params.id)
    })
    res.redirect('/list')
})

passport.use(new LocalStrategy({
    usernameField : 'userid',
    passwordField : 'password'
},async (userid,password,cb)=>{
    let result = await db.collection("users").findOne({
        userid : userid
    })

    if(!result){
        return cb(null, false, {message: '아이디나 비밀번호가 일치 하지 않음'})
    }
    const passChk = await bcrypt.compare(password, result.password);
    console.log(passChk)
    if(passChk){
        return cb(null, result);
    }else{
        return cb(null, false, {message: '아이디나 비밀번호가 일치 하지 않음'})
    }
}))

passport.serializeUser((user,done)=>{
    process.nextTick(()=>{
        // done(null, 세션에 기록할 내용)
        done(null, {id: user._id, userid: user.userid})
    })
})

passport.deserializeUser(async (user,done)=>{
    let result = await db.collection("users").findOne({
        _id: new ObjectId(user.id)
    })
    delete result.password
    // console.log(result)
    process.nextTick(()=>{
        done(null, result);
    })
})

app.get('/login', (req,res)=>{
    res.render('login.ejs')
})
app.post('/login', async(req,res,next)=>{
    // console.log(req.body);
    passport.authenticate('local', (error, user, info)=>{
        // console.log(error, user, info);
        if(error) return res.status(500).json(error);
        if(!user) return res.status(401).json(info.message)
        req.logIn(user, (error)=>{
            if(error) return next(error);
            res.redirect('/')
        })
    })(req,res,next)
})

app.get('/register', (req,res)=>{
    res.render("register.ejs")
})
app.post('/register', async(req,res)=>{

    let hashPass = await bcrypt.hash(req.body.password, 10);

    // console.log(hashPass)
    try{
        await db.collection("users").insertOne({
            userid: req.body.userid,
            password: hashPass
        })
    }catch(error){
        console.log(error)
    }
    // res.send("성공!")
    res.redirect('/')
})

// app.delete('/delete', async (req,res)=>{
//     await db.collection("notice").deleteOne({
//         _id : new ObjectId(req.body._id)
//     })
//     res.redirect('/list')
// })
