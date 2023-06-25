const express = require('express');
const axios = require('axios');
const moment = require('moment');
const router = express.Router();
const redis = require('redis');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

let config = require('../config');
console.log('Target Host : ' + config.redis.host);
const redisClient = redis.createClient(config.redis.port, config.redis.host);

// 2020.10.19 - Redis Hash 사용 추가. Redis Set 관련 Lock 로직 제거.
router.get('/:id', function(req, res) {
  console.log(req.params.id + ' : START : ' + req.query.p1);
  updateRedisValue(req.params.id, req);
  res.send(req.params.id);
});

const updateRedisValue = (paramKey, req) => {
  const key = '#1#' + paramKey;
  const field = req.query.p1;
  const impType = req.query.it ? req.query.it : 'imp';

  redisClient.hgetall(key, (err, result) => {
    if (err) {
      console.log(paramKey + ' : ERROR!!!!!!! : ' + err);
      return;
    }

    let rVal = {};
    let isKeyInc = true;
    let isClkKeyInc = true;
    if (result === null) {  // key(uuid)가 없으면 전체 field를 추가
      rVal = {
        '@class' : 'net.spotv.common.domain.ImpHistory',
        'key' : key,
        'date': moment().format('YYYY-MM-DD HH:mm:ss'),
        'id1' : req.query.id1,
        'id2' : req.query.id2,
        'id3' : req.query.id3,
        'bf': req.query.bf,
        'prod_id': req.query.prod_id,
        'page_id': req.query.page_id,
        'play_time': req.query.play_time,
        'pf': req.query.pf, // platform
        'sid': req.query.sid, // site_id
        'mc': req.query.mc, // media_code
        'req': 0,
        's': 0,
        'q1': 0,
        'q2': 0,
        'q3': 0,
        'comp': 0,
        'skip': 0,
        'view': 0,
        'click': 0,
        'error': 0,
      };
      
      // 2분 ~ 7분 이 후 온 메시지에 대해서는 로그를 출력한다.
      console.log(paramKey + ' : INSERT Redis : ', rVal);
    } else {  // 이미 추가된 key(uuid)가 있다면 특정 field(req.query.p1) 값만 1로 업데이트
      if (field === 's' && result.s === '1') {
        isKeyInc = false;
        console.log(paramKey + " : Duplicate Start Message");
      }
      
      if (impType === 'clk' && field === 'click' && result.click === '1') {
        isClkKeyInc = false;
        console.log(paramKey + " : Duplicate Click Message");
      }
    }

    if (field === 's' && isKeyInc) {
      let callUrl = req.query.o;
      if (callUrl !== '' && callUrl !== undefined) {
        sendRequest(callUrl);
      }

      if (impType === 'imp') {
        let redisKey = '#0#' + req.query.id1 + ':' + req.query.id2 + '.impCnt15m';
        redisClient.incr(redisKey);
        console.log(paramKey + ' : inc : ' + redisKey);
  
        redisKey = '#0#' + req.query.id1 + ':' + req.query.id2 + '.impCnt1d';
        redisClient.incr(redisKey);
        console.log(paramKey + ' : inc : ' + redisKey);

        redisKey = '#6#' + req.query.id1 + ':' + req.query.id2 + ':' + req.query.sid + '.impCnt15m';
        redisClient.incr(redisKey);
        console.log(paramKey + ' : inc : ' + redisKey);
  
        redisKey = '#6#' + req.query.id1 + ':' + req.query.id2 + ':' + req.query.sid + '.impCnt1d';
        redisClient.incr(redisKey);
        console.log(paramKey + ' : inc : ' + redisKey);
      }

      if (req.query.u && req.query.u !== '') {
        const uid = decodeURIComponent(req.query.u);
        redisKey = '#7#' + req.query.id2 + ':' + uid + '.imp';
        redisClient.incr(redisKey);
        console.log(paramKey + ' : inc : ' + redisKey);
      }
    }

    if (impType === 'clk' & field === 'click' && isClkKeyInc) {
      let redisKey = '#0#' + req.query.id1 + ':' + req.query.id2 + '.clkCnt15m';
      redisClient.incr(redisKey);
      console.log(paramKey + ' : inc : ' + redisKey);

      redisKey = '#0#' + req.query.id1 + ':' + req.query.id2 + '.clkCnt1d';
      redisClient.incr(redisKey);
      console.log(paramKey + ' : inc : ' + redisKey);
    }

    rVal[field] = 1;
    redisClient.hmset(key, rVal, (err, reply) => {
      if (err) console.log('Redis Field Set Error: ' + err);      
    });
  });
};

const sendRequest = async(url) => {
  try {
    decodeUrl = decodeURI(url);
    console.log('send GET : ' + decodeUrl);
    let response = await axios.get(decodeUrl);
    console.log('response : ' + response.status);
    return await axios.get(decodeUrl);
  } catch(error) {
    console.error(error);
  }
};


module.exports = router;