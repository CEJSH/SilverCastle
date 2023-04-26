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
var flightsSchema = mongoose.Schema(
  {
    flight: String,
    departtime: String,
    depart: String,
    arrivetime: String,
    arrive: String,
    maxseat: Number,
    ddate: String,
    price:Number
  },
   {
    versionKey: false
}
);
var buySchema = mongoose.Schema(
  {
    buyid: String,
    customerid: String,
    flight: String,
    ddate: Date,
    amount: Number,
    buydate: Date,
    passengers: String,
    note: Boolean,
  },
  {
    versionKey: false,
  }
);

var Buy = mongoose.model("buy", buySchema);
var flight = mongoose.model("flights", flightsSchema);

app.get("/Hello", function (req, res) {
  res.send("Hello World~!!");
});

// mongoose에서 조건검색을 위한 함수.. 매우 중요
 function escapeRegExp(string) {
   return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
 }

app.get("/buysuccess", function(req,res) {

})

app.get("/search", function (req, res, next) {
    let depart_v = req.query.depart;
    let arrive_v = req.query.arrive;
    let date_v = new Date(req.query.date);
    date_v = date_v.toISOString().substring(0,10);
    // var month = date_v.getUTCMonth()+1; //months from 1-12
    // var day = date_v.getUTCDate();
    // var year = date_v.getUTCFullYear();
    // if (month<10){
    //   month="0"+month;
    // }
    // date_v = year + "-" + month + "-" + day;
    // console.log(month);

    let response = {
      ok: {},
      result: {},
    };
 
    flight.find(
      { depart: { $regex: escapeRegExp(depart_v) }, ddate: date_v,arrive: { $regex: escapeRegExp(arrive_v) }},{ _id: 0 },function (err, docs) {
        if (err) {
          console.log("err");
          response["ok"] = "error occured";
          res.send(JSON.stringify(response["ok"]));
        } else {      
                response["result"] = JSON.parse(JSON.stringify(docs));
                if (response["result"].length <= 0) {
                  response["ok"] = "운항중인 항공편이 없습니다.";
                  console.log(response["ok"]);
                  res.send(response["ok"]);
                  } else {
                    response["ok"] = "항공편을 조회합니다.";
                    console.log(response)
                    template_result(response['result'], res);
                    // res.send(response["result"]);
        }
      }}
    );
});
app.get("/select", async function (req, res) {
  const [rows, fields] = await pool.query("SELECT * FROM customerTBL");
  let response = {
    ok: true,
    result: {},
  };
  if (rows.length > 0) {
    response["result"] = rows;
    res.send(JSON.stringify(response));
  } else {
    response["ok"] = false;
    res.send(JSON.stringify(response));
  }
});
app.get("/dupId", async (req, res) => {
  const id = req.query.id;
  const [rows, fields] = await pool.query(
    "SELECT * FROM customerTBL where customerid= ?",
    [id]
  );
  let response = {
    ok: true,
    result: {},
    service: "select",
  };
  if (rows.length > 0) {
    console.log("이미존재하는 아이디입니다.");
    response["result"] = rows;
    res.send(JSON.stringify(response));
  }
});

// search id
app.get("/searchid", async (req, res) => {
  const email = req.query.email;
  const phone = req.query.phone;

  const [rows, fields] = await pool.query(
    "SELECT * FROM customerTBL where email = ? and phoneNumber = ?",
    [email, phone]
  );
  let response = {
    ok: true,
    result: {},
    service: "select",
  };
  console.log(rows);
  if (rows.length > 0) {
    response["result"] = rows;
    res.send(JSON.stringify(response));
  } else {
    response["ok"] = false;
    console.log("가입된 내역이 없는 이메일입니다.");
    res.send(JSON.stringify(response));
  }
});

app.post("/updatePw", async (req, res) => {
  const { id, phone, pw } = req.body;
  // console.log(id, phone);
  let [rows, fields] = await pool.query(
    "SELECT * FROM customerTBL where customerid = ? and phoneNumber= ?",
    [id, phone]
  );
  let response = {
    ok: true,
    result: {},
    service: "update",
  };
  if (rows.length > 0) {
    result = await pool.query(
      "update customerTBL set passwd=? where customerId=? and phoneNumber=?",
      [pw, id, phone]
    );
    response["result"] = result;
    res.send(JSON.stringify(response));
  } else {
    response["ok"] = false;
    res.send(JSON.stringify(response));
  }
});

app.post("/register", async (req, res) => {
  const userInfo = req.body;
  console.log(userInfo);
  const [rows, fields] = await pool.query(
    "insert into customerTBL values (?,?,?,?,?,?,?,?)",
    [
      userInfo.id,
      userInfo.pw,
      userInfo.name,
      userInfo.birth,
      userInfo.phone,
      userInfo.email,
      userInfo.addr,
      userInfo.pnum,
    ]
  );
  console.log(rows);
  let response = {
    ok: true,
    result: {},
    service: "insert",
  };
  if (rows) {
    response["result"] = userInfo;
    res.send(JSON.stringify(response));
  } else {
    response["ok"] = false;
    res.send(JSON.stringify(response));
  }
});

app.post("/login", async (req, res) => {
  const { id, pw } = req.body;
  const [row, fields] = await pool.query(
    "select * from customerTBL where customerid=? and passwd=?",
    [id, pw]
  );
  let response = {
    ok: true,
    result: {},
    service: "select",
  };
  if (row.length === 0) {
    console.log("로그인 실패");
    response["ok"] = false;
    res.send(JSON.stringify(response));
  } else {
    console.log(row);
    response["result"] = row;
    res.send(JSON.stringify(response));
    // if (id === 'root' || id === 'admin') {
    //     console.log(id + " => Administrator Logined");
    //     res.redirect('admin.html?id=' + id);
    // } else {
    //     console.log(id + " => User Logined");
    //     res.redirect('user.html?id=' + id);
    // }
  }
});

// mongodb
// buy collection insert
app.post("/buy", function (req, res, next) {
  const id = req.body.id;
  const buyId = "SC2001200313";
  const flight = req.body.flight;
  const amount = req.body.amount;
  const passengers = req.body.passengers;
  const note = req.body.note;

  let response = {
    ok: true,
    result: {},
    service: "insert",
  };
  var buy = new Buy({
    buyId: buyId,
    customerid: id,
    amount: amount,
    passengers: passengers,
  });
  buy.save(function (err, silence) {
    if (err) {
      console.log("err");
      response["ok"] = false;
      res.send(JSON.stringify(response));
      return;
    }
    console.log("silence :", silence);
    response["result"] = silence;
    res.send(JSON.stringify(response));
  });
});

// buylist find
app.post("/buylist", (req, res, next) => {
  const input = req.body.input;

  let response = {
    ok: true,
    result: {},
    service: "find",
  };

  Buy.find({ buyId: input }, (err, doc) => {
    if (err) {
      console.log("err");
      response["ok"] = false;
      res.send(JSON.stringify(response));
      return;
    }
    // console.log("silence :", silence);
    response["result"] = doc;
    res.send(JSON.stringify(response));
  });
});

// refund

app.post("/refund", function (req, res, next) {
  const id = req.body.id;
  const buyid = req.body.buyid;
  const flight = req.body.flight;
  const amount = req.body.amount;
  const passengers = req.body.passengers;
  const note = req.body.note;
  let response = {
    ok: true,
    result: {},
    service: "insert",
  };
  var buy = new Buy({
    buyId: buyid,
    customerid: id,
    amount: amount,
    note: note,
  });
  buy.save(function (err, silence) {
    if (err) {
      console.log("err");
      response["ok"] = false;
      res.send(JSON.stringify(response));
      return;
    }
    // console.log("silence :", silence);
    response["result"] = silence;
    res.send(JSON.stringify(response));
  });
});

app.post("/deleteMany", function (req, res, next) {
  var userid = req.body.input;
  var user = Buy.find({ id: userid });
  user.remove(function (err) {
    if (err) {
      console.log("err");
      res.status(500).send("delete error");
      return;
    }
    res.status(200).send("Removed");
  });
  // user.deleteOne(function (err) {
  //     if (err) {
  //         console.log('err');
  //         res.status(500).send('delete error');
  //         return;
  //     }
  //     res.status(200).send('Removed');
  // })
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
        <tr><th>편명</th><th>Depart</th><th>DepartTime</th><th>Arrive</th><th>ArriveTime</th><th>price</th></tr>
    </thead>
    <tbody>
    `;
  for (var i = 0; i < result.length; i++) {
    template += `
    <tr>
        <td>${result[i]["flight"]}</td>
        <td>${result[i]["depart"]}</td>
        <td>${result[i]["departtime"]}</td>
        <td>${result[i]["arrive"]}</td>
        <td>${result[i]["arrivetime"]}</td>
        <td>${result[i]["price"]}</td>

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

// app.post("/login", (req, res) => {
//   const { id, pw } = req.body;
//   const result = connection.query(
//     "select * from customerTBL where customerid=? and passwd=?",
//     [id, pw]
//   );
//   if (result.length == 0) {
//     res.redirect("error.html");
//   }
//   if (id == "admin" || id == "root") {
//     console.log(id + "=> Administrator Logined");
//     res.redirect("member.html?id=" + id);
//   } else {
//     console.log(id + " => User Logined");
//     res.redirect("user.html?id=" + id);
//   }
// });

// app.post("/insert2", (req, res) => {
//   const id = req.body.id;
//   if (id == "") {
//     res.send("User-id를 입력하세요.");
//   } else {
//     const result = connection.query("select * from user where userid=?", [id]);
//     console.log(result);
//     // res.send(result);
//     if (result.length == 0) {
//       template_nodata(res);
//     } else {
//       template_result(result, res);
//     }
//   }
// });

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
