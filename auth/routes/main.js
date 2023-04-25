const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("sync-mysql");
const env = require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const async = require("async");
const { isBuffer } = require("util");
const app = express.Router();

var connection = new mysql({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
});




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//define schema
var flightSchema = mongoose.Schema(
  {
    flight: String,
    line: Number,
    departtime: String,
    depart: String,
    arrivetime: String,
    arrive: String,
    distancelevel: Number,
    maxseat: Number,
    date: Date,
  }
);

var userSchema = mongoose.Schema({
  userid: String,
  name: String,
  city: String,
  sex: String,
  age: Number,
});

var flight = mongoose.model("flights", flightSchema);
var User = mongoose.model("users", userSchema);

app.get("/Hello", function (req, res) {
  res.send("Hello World~!!");
});

// app.post("/selectQuery", (req, res, next) => {
//   let depart_v = req.query.depart;
//   let arrive_v = req.query.arrive;

//   flight.find({'depart': depart_v, 'arrive': arrive_v }, (err, doc) => {
//     if (err) console.log("err");
//     console.log(doc)
//     res.send(doc);
//   });
// });
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

app.get("/selectQuery", function (req, res, next) {
  let depart_v = req.query.depart;
  let arrive_v = req.query.arrive;
  console.log(depart_v)
  flight.find(
    { depart: depart_v, arrive: { $regex: escapeRegExp(arrive_v) } },
    function (err, docs) {
      if (err) console.log("err");
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      res.send(docs);
    }
  );
});

function template_nodata(res) {
  res.writeHead(200);
  var template = `
    <!doctype html>
    <html>
    <head>
        <title>Result</title>
        <meta charset="utf-8">
        <link type="text/css" rel="stylesheet" href="mystyle.css" />
    </head>
    <body>
        <h3>데이터가 존재하지 않습니다.</h3>
    </body>
    </html>
    `;
  res.end(template);
}

function template_result(result, res) {
  res.writeHead(200);
  var template = `
    <!doctype html>
    <html>
    <head>
        <title>Result</title>
        <meta charset="utf-8">
        <link type="text/css" rel="stylesheet" href="mystyle.css" />
    </head>
    <body>
    <table border="1" style="margin:auto;">
    <thead>
        <tr><th>Depart</th><th>DepartTime</th><th>Arrive</th><th>ArriveTime</th></tr>
    </thead>
    <tbody>
    `;
  for (var i = 0; i < result.length; i++) {
    template += `
    <tr>
        <td>${result[i]["depart"]}</td>
        <td>${result[i]["departtime"]}</td>
        <td>${result[i]["arrive"]}</td>
        <td>${result[i]["arrivetime"]}</td>

    </tr>
    `;
  }
  template += `
    </tbody>
    </table>
    </body>
    </html>
    `;
  res.end(template);
}

app.get("/hello", (req, res) => {
  res.send("Hello World~!!");
});

app.get("/login", (req, res) => {
  res.redirect("login.html");
});

// request 1, query 0
app.get("/select", (req, res) => {
  let result = connection.query("select * from flight");
  console.log(result);
  // res.send(result);
  if (result.length == 0) {
    template_nodata(res);
  } else {
    res.send(result);
  }
});

//request 1, query 0
app.post("/select", (req, res) => {
  let result = connection.query("select * from flight");
  console.log(result);
  // res.send(result);
  if (result.length == 0) {
    template_nodata(res);
  } else {
    template_result(result, res);
  }
});

// request 1, query 1
// app.get("/selectQuery", (req, res) => {
//   let depart = req.query.depart;
//   let arrive = req.query.arrive;
//   arrive += "%";
//   if (depart == "") {
//     //res.send('User-id를 입력하세요.')
//     res.write("<script>alert('도착지를 입력하세요')</script>");
//   } else {
//     const result = connection.query(
//       "select * from flight where depart=? AND arrive like ?",
//       [depart, arrive]
//     );
//     console.log(result);
//     // res.send(result);
//     if (result.length == 0) {
//       template_nodata(res);
//     } else {
//       template_result(result, res);
//     }
//   }
// });

// //request 1, query 1
// app.post("/selectQuery", (req, res) => {
//   let depart = req.body.depart;
//   let arrive = req.body.arrive;
//   arrive += "%";
//   if (depart == "") {
//     //res.send('User-id를 입력하세요.')
//     res.write("<script>alert('도착지를 입력하세요')</script>");
//   } else {
//     const result = connection.query(
//       "select * from flight where depart=? AND arrive like ?",
//       [depart, "_" + arrive]
//     );
//     console.log(result);
//     // res.send(result);
//     if (result.length == 0) {
//       template_nodata(res);
//     } else {
//       template_result(result, res);
//     }
//   }
// });

// request 1, query 1
app.post("/insert", (req, res) => {
  let { id, pw } = req.body;
  if (id == "" || pw == "") {
    res.send("User-id와 Password를 입력하세요.");
  } else {
    let result = connection.query("select * from user where userid=?", [id]);
    if (result.length > 0) {
      res.writeHead(200);
      var template = `
        <!doctype html>
        <html>
        <head>
            <title>Error</title>
            <meta charset="utf-8">
        </head>
        <body>
            <div>
                <h3 style="margin-left: 30px">Registrer Failed</h3>
                <h4 style="margin-left: 30px">이미 존재하는 아이디입니다.</h4>
            </div>
        </body>
        </html>
        `;
      res.end(template);
    } else {
      result = connection.query("insert into user values (?, ?)", [id, pw]);
      console.log(result);
      res.redirect("/selectQuery?id=" + req.body.id);
    }
  }
});

app.post("/login", (req, res) => {
  const { id, pw } = req.body;
  const result = connection.query(
    "select * from customerTBL where customerid=? and passwd=?",
    [id, pw]
  );
  if (result.length == 0) {
    res.redirect("error.html");
  }
  if (id == "admin" || id == "root") {
    console.log(id + "=> Administrator Logined");
    res.redirect("member.html?id=" + id);
  } else {
    console.log(id + " => User Logined");
    res.redirect("user.html?id=" + id);
  }
});

app.post("/insert2", (req, res) => {
  const id = req.body.id;
  if (id == "") {
    res.send("User-id를 입력하세요.");
  } else {
    const result = connection.query("select * from user where userid=?", [id]);
    console.log(result);
    // res.send(result);
    if (result.length == 0) {
      template_nodata(res);
    } else {
      template_result(result, res);
    }
  }
});

app.post("/update", (req, res) => {
  const { id, pw } = req.body;
  if (id == "" || pw == "") {
    res.send("User-id와 Password를 입력하세요.");
  } else {
    const result = connection.query("select * from user where userid=?", [id]);
    console.log(result);
    // res.send(result);
    if (result.length == 0) {
      template_nodata(res);
    } else {
      const result = connection.query(
        "update user set passwd=? where userid=?",
        [pw, id]
      );
      console.log(result);
      res.redirect("/selectQuery?id=" + id);
    }
  }
});

app.post("/delete", (req, res) => {
  const id = req.body.id;
  if (id == "") {
    //res.send('User-id를 입력하세요.')
    res.write("<script>alert('User-id를 입력하세요')</script>");
  } else {
    const result = connection.query("select * from user where userid=?", [id]);
    console.log(result);
    // res.send(result);
    if (result.length == 0) {
      template_nodata(res);
    } else {
      const result = connection.query("delete from user where userid=?", [id]);
      console.log(result);
      res.redirect("/select");
    }
  }
});

module.exports = app;
