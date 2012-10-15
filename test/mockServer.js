var express = require('express');
var app = express();

var authCheck = function(req, res) {
  if(req.param.authToken !== 'TESTTOKEN') {
    req.send(JSON.stringify({
      errors : [{ id : 'TEST_AUTH', message : 'Test Error'}]
    }));
    return false;
  }
  return true;
};

app.use(express.bodyParser());

app.get('/user/:id', function(req, res) {
  if(!authCheck(req, res)) { return; }
  res.send(JSON.stringify({
    id : 999,
    created_datetime : "Fri, 21 Sep 2012 00:00:00 GMT",
    email : "test@example.com",
    email_lower : "test@example.com",
    firstName : "Test",
    lastName : "Test",
    level : "NORMAL",
    password : "testpasshash",
    projectLimit : 1,
    servoLimit : 1,
    status : "BETA_LOCKED",
    username : "test",
    username_lower : "test"
  }));
});

app.post('/user/create', function(req, res) {
  if(!req.body.username || !req.body.email || !req.body.password) {
    req.send(JSON.stringify({
      errors : [{ id : 'TEST', message : 'Test Error'}]
    }));
    return;
  }
  res.send(JSON.stringify({
    username : req.body.username,
    email : req.body.email
  }));
});

app.post('/user/authenticate', function(req, res) {
  if(!req.body.login || !req.body.password) {
    req.send(JSON.stringify({
      errors : [{ id : 'TEST', message : 'Test Error'}]
    }));
    return;
  }
  res.send(JSON.stringify({
    login : req.body.login,
    password : req.body.password,
    authToken : 'TESTTOKEN'
  }));
});

app.post('/user/:id/unlock', function(req, res) {
  if(!authCheck(req, res)) { return; }
  if(!req.body.key) {
    req.send(JSON.stringify({
      errors : [{ id : 'TEST', message : 'Test Error'}]
    }));
    return;
  }
  res.send(JSON.stringify({
    result : 'Success!'
  }));
});

app.get('/user/:id/projects', function(req, res) {
  if(!authCheck(req, res)) { return; }
  res.send(JSON.stringify([{
    id : 999,
    created_date : "2012-01-01T00:00:00.000Z",
    creator : 999,
    customDomains : [],
    domain : "test.onmodulus.net",
    filesId : "test-files",
    name : "Test Project",
    puCount : 1,
    puIds : [],
    status : "RUNNING",
    storageLocation : "mod.project.storage:/232/"
  }]));
});

app.post('/user/password-reset', function(req, res) {
  if(!req.body.email) {
    req.send(JSON.stringify({
      errors : [{ id : 'TEST', message : 'Test Error'}]
    }));
    return;
  }
  res.send(JSON.stringify({
    result : 'Success!'
  }));
});

app.post('/project/create', function(req, res) {
  if(!authCheck(req, res)) { return; }
  if(!req.body.login || !req.body.password) {
    req.send(JSON.stringify({
      errors : [{ id : 'TEST', message : 'Test Error'}]
    }));
    return;
  }
  res.send(JSON.stringify({
    id : 999,
    created_date : "2012-01-01T00:00:00.000Z",
    creator : 999,
    customDomains : [],
    domain : "test.onmodulus.net",
    filesId : "test-files",
    name : "Test Project",
    puCount : 1,
    puIds : [],
    status : "RUNNING",
    storageLocation : "mod.project.storage:/232/"
  }));
});

app.post('/project/:id/env-vars', function(req, res) {
  if(!authCheck(req, res)) { return; }
  res.send(JSON.stringify({
    result : 'Success!'
  }));
});

module.exports = app;