var express = require('express');
var router = express.Router();
var request = require('request');
var db = require('../models');
var async = require('async');

router.get('/index',function(req,res){
  var user = req.getUser();
  if(req.getUser()){
    var times = [];
    db.checkin.findAll().then(function(list){
      list.forEach(function(time){
        times.push({time:Date.parse(time.createdAt),parkid:time.parkId,userid:time.userId});
      // }).then(function(){
      //   db.checkin.findAll()
      })
    }).then(function(){
      db.parksusers.findAll({where: {userId: req.session.user.id}}).then(function(joins){
      console.log("data is", joins);
      var parkids = [];
      for(var i = 0; i < joins.length;i++){
        parkids.push(joins[i].parkId);
      }
      var dogParks = []
      async.each(parkids,function(parkid,callback){
        db.park.find({where:{id:parkid}}).then(function(park){
          dogParks.push(park)
          callback();
        }).catch(function(error){
          callback(error);
        })
      },function(error){
        if(error){
          console.log('error',error);
        }else{
          res.render('favorites/index',{parks:dogParks,user:user,times:times})
        }
      })
      })
    })
  }else{
    res.redirect('/');
  }
})

router.post('/add',function(req,res){
  console.log('***********************user.id = ',req.session.user.id)
  db.user.find({where:{id:req.session.user.id}}).then(function(user){
    db.park.findOrCreate({where:{name:req.body.name,lat:req.body.lat,long:req.body.long,address:req.body.address}}).spread(function(favorite,created){
        favorite.addUser(user).then(function(join){
        res.send({add:true})
        })
      })
    })
  })

router.post('/checkin',function(req,res){
  var park = parseInt(req.body.parkid);
  var id = parseInt(req.body.userid);
  console.log('...!!!!!!!',park,id)
  db.checkin.create({parkId:park,userId:id}).then(function(check){
    res.redirect('/favorites/index');
  }).catch(function(err){
    throw err;
    res.send(err);
  })
})

router.post('/checkout',function(req,res){
  var park = parseInt(req.body.parkid);
  var id = parseInt(req.body.userid);
  console.log('...!!!!!!!',park,id)
  db.checkin.destroy({where:{userId:id}}).then(function(){
    res.redirect('/favorites/index');
  })
})

router.post('/remove',function(req,res){
  var park = parseInt(req.body.parkid);
  var id = parseInt(req.body.userid);
  console.log('...!!!!!!!',park,id);
  db.parksusers.destroy({where:{parkId:park,userId:id}}).then(function(){
    res.send({deleted:true});
  })
})









module.exports = router;