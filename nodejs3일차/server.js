const express = require('express');
const app=express();
const bodyParser=require('body-parser')
app.use(bodyParser.urlencoded({extended : true}));

//MongoDB 연동
const MongoClient = require('mongodb').MongoClient;

app.set('view engine','ejs');

var db;
MongoClient.connect('mongodb주소',function(에러,client){
    //연결되면 할일
    if(에러){return console.log(에러)}
    
    db=client.db('todoapp');

    app.listen(8080, function(){
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