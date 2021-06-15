const express = require('express');
const app=express();
const bodyParser=require('body-parser')
app.use(bodyParser.urlencoded({extended : true}));

//8080포트로 서버를 열어서 function을 실행해주세요
app.listen(8080, function(){
    console.log('listening on 8080')
});

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
    console.log(req.body)
});