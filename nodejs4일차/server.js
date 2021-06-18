const express = require('express');
const app=express();
const bodyParser=require('body-parser')
app.use(bodyParser.urlencoded({extended : true}));

require('dotenv').config()
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

//MongoDB 연동
const MongoClient = require('mongodb').MongoClient;

app.set('view engine','ejs');

var db;
MongoClient.connect(process.env.DB_URL,function(에러,client){
    //연결되면 할일
    if(에러){return console.log(에러)}
    
    db=client.db('todoapp');

    app.listen(process.env.PORT, function(){
        console.log('listening on 8080')
    });
});


//8080포트로 서버를 열어서 function을 실행해주세요
app.get('/pet',function(req,res){
    res.send('펫용품 쇼핑페이지입니다');
});

app.get('/beauty',function(req,res){
    res.send('뷰티용품 쇼핑페이지입니다');
});


//GET요청시 인덱스.html 파일 보내줌
app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html')
});
//GET요청시 write.html 파일 보내줌
app.get('/write',function(req,res){
    res.sendFile(__dirname+'/write.html')
});
//경로로 POST 전송
app.post('/add',function(req,res){
    res.send('전송완료')
    //console.log(req.body.title)
    //console.log(req.body.date)

    //새로운 데이터가 추가될때마다 카운터 증가
    db.collection('counter').findOne({name:'게시물갯수'},function(에러,결과){
        console.log(결과.totalPost);
        var 총게시물갯수=결과.totalPost;

        //db에 post 값 삽입
        db.collection('post').insertOne({_id:총게시물갯수+1,제목:req.body.title,날짜:req.body.date},function(err,res){
            console.log('저장완료');
            //counter라는 콜렉션에 있는 totalPost라는 항목도 1증가 시켜야함 $inc:{기존에 더해줄 값}
            db.collection('counter').updateOne({name:'게시물갯수'},{$inc : {totalPost:1}},function(에러,결과){
                if(에러){return console.log(에러)}
            })
        });
    });  
});

//리스트로 get요청하면 html을 보여줌
// 실제 DB에 저장된 데이터들을 보여줌
app.get('/list',function(req,res){
    //db데이터 출력
    db.collection('post').find().toArray(function(err,result){
        console.log(result);
        res.render('list.ejs',{posts:result});
    });
});

app.delete('/delete', function(req,res){
    console.log(req.body);
    req.body._id=parseInt(req.body._id);
    //db에서 게시물 삭제
    db.collection('post').deleteOne(req.body,function(에러,결과){
        console.log('삭제완료');
        res.status(200).send({message:'성공했습니다'});
        //200:요청성공

        //400:고객문제로 요청실패
        //500:서버문제로 요청실패
    });
});

//detail/어쩌구 로 get요청을 하면~ url Parameter
app.get('/detail/:id',function(req,res){
    //url파라미터중 id라는 값을 기준으로 찾음
    req.params.id=parseInt(req.params.id);
    db.collection('post').findOne({_id:req.params.id},function(에러,결과){
        console.log(결과)
        res.render('detail.ejs',{data:결과});
    });
});

app.get('/edit/:id',function(req,res){
    req.params.id=parseInt(req.params.id);
    db.collection('post').findOne({_id:req.params.id},function(에러,결과){
        console.log(결과)
        res.render('edit.ejs',{post:결과});
    });
});

app.put('/edit',function(req,res){
    //폼에 담긴 데이터를 가지고 db에 업데이트함
    db.collection('post').updateOne({_id: parseInt(req.body.id) },{$set:{ 제목:req.body.title,날짜:req.body.date }},function(에러,결과){
        console.log('수정완료')
        res.redirect('/list')
    });
});

//로그인 관련 미들웨어 
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret:'비밀코드',resave:true,saveUninitialized:false}));
app.use(passport.initialize());
app.use(passport.session());

//로그인페이지제작&라우팅
app.get('/login',function(req,res){
    res.render('login.ejs');
});

app.post('/login', passport.authenticate('local',{
    failureRedirect:'/fail' //인증실패하면 이쪽으로
}), function(req,res){
    res.redirect('/')
});

app.get('/mypage',로그인했니,function(req,res){
    console.log(req.user);
    res.render('mypage.ejs',{사용자:req.user});
});

//마이페이지 접속 전 실행할 미드웨어
function 로그인했니(요청,응답,next){
    if(요청.user){
        next()
    }else{
        응답.send('로그인 안하셨어요')
    }
}



passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));

    //id를 이용하여 세션을 저장하는 코드(로그인성공시)
  passport.serializeUser(function(user, done){
    done(null,user.id) //id를 가지고 세션저장,쿠키로보냄
  });
  //이 세션 데이터를 가진 사람을 db에서 찾아주세요(마이페이지접속)
  passport.deserializeUser(function(아이디, done){
      //db에서 위에있는 user.id로 유저를 찾아서 done함수에 넣음
      db.collection('login').findOne({id:아이디},function(에러,결과){
        done(null,결과);
      })    
  });