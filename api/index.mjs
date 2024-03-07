import express from "express";
import { conn } from "./DB/conn.mjs";
import bcript from "bcryptjs";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import cors from "cors";
import { authToken } from "./Middleware/auth.mjs";
import Razorpay from "razorpay";

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

app.get("", (req, res) => {
  res.send("server live");
});

app.post("/v1/user/register", async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    const bpassword = await bcript.hash(password, 10);
    conn.query(
      "insert into users (name,email,username,password) values(?,?,?,?)",
      [name, email, username, bpassword],
      (err, result) => {
        if (err) {
          console.log(err);
          res
            .status(409)
            .json({ message: "duplicate resource or resource already exists" });
        } else {
          //   res.status(201).json({ message: result });
          const payload = {
            id: result.insertId,
          };
          jwt.sign(
            payload,
            process.env.jwtsecret,
            { expiresIn: "4h" },
            (err, token) => {
              if (err) {
                throw err;
              } else {
                res.status(201).json({ token });
              }
            }
          );
        }
      }
    );
  } catch (e) {
    res.status(500).json({ message: "user not register" });
  }
});

app.post("/v1/user/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    conn.query(
      "select * from users where username = ?",
      username,
      async (err, result) => {
        if (err || result =='') {
          res.status(401).json({ status : 1 ,message: "invalid credential" });
        } else {
          const isvalid = await bcript.compare(password, result[0].password);
          if (isvalid) {
            const payload = {
              id: result[0].id,
            };
            jwt.sign(
              payload,
              process.env.jwtsecret,
              { expiresIn: "4h" },
              (err, token) => {
                if (err) {
                  throw err;
                } else {
                  res.status(201).json({ status : 0 , token });
                }
              }
            );
          } else {
            res.status(401).json({ status : 1 , message: "invalid credential" });
          }
        }
      }
    );
  } catch (e) {}
});

app.get("/v1/user", authToken, (req, res) => {
  const id = req.user.id;
  conn.query("select * from users where id = ?", id, (err, result) => {
    if (err || result =='') {
      res.status("404").json({ message: "User not found" });
    } else {
      res.status(200).json({ result });
    }
  });
});

app.get("/v1/foods", (req, res) => {
  conn.query("select * from food", (err, result) => {
    if (err || result =='') {
      res.status(404).json({ message: "Food not found" });
    } else {
      res.status(200).json({ result });
    }
  });
});

app.get("/v1/foods/:id", (req, res) => {
  const id = req.params.id;
  conn.query("select * from food where id = ?", id, (err, result) => {
    if (err || result =='') {
      res.status(404).json({ message: "Food not found" });
    } else {
      res.status(200).json({ result });
    }
  });
});

app.post("/v1/payment", (req, res) => {
  const { price } = req.body;
  const instance = new Razorpay({
    key_id: process.env.Key_Id,
    key_secret: process.env.Key_Secret,
  });
  const options = {
    amount: price * 100,
    currency: "INR",
  };
  instance.orders.create(options, (err, order) => {
    if (err) {
      res.status(500).json({ message: "server error" });
    } else {
      res.status(200).json({ order });
    }
  });
});

app.post("/v1/food/order", (req, res) => {
  const {
    order_id,
    name,
    username,
    payment_id,
    product_id,
    quantity,
    phone,
    locality,
    address,
    city,
    state,
    signature,
  } = req.body;
  conn.query(
    "insert into foodorder(order_id,name,username,payment_id,product_id,quantity,phone,locality,address,city,state,signature) values(?,?,?,?,?,?,?,?,?,?,?,?)",
    [order_id,name,username,payment_id,product_id,quantity,phone,locality,address,city,state,signature],
    (err, result) => {
      if (err) {
        res.status(500).json({ message: "server error" });
      } else {
        res.status(201).json({ result });
      }
    }
  );
});

app.get("/v1/food/byname",(req,res)=>{
    const name= req.query.q
    conn.query("SELECT * FROM food WHERE FIND_IN_SET(?, type)",name,(err,result)=>{
      if(err){
        res.status(404).json({ message: "Food not found" });
      }
      else{
        res.status(200).json({result})
      }
    })
})

app.get("/v1/food/orders",(req,res)=>{
    const username=req.query.q
    conn.query("SELECT foodorder.*, food.* FROM foodorder  JOIN food  ON foodorder.product_id = food.id WHERE foodorder.username = ? ",username,(err,result)=>{
      if(err){
        res.status(404).json({message:"No such Order"})
      }
      else{
        res.status(200).json({result})
      }
    })
})

app.post("/v1/food/register", (req, res) => {
  const { name, brand, location, price, img, img1, img2, img3, img4 } =
    req.body;
  conn.query(
    "insert into food (name,brand,location,price,img,img1,img2,img3,img4) values(?,?,?,?,?,?,?,?,?)",
    [name, brand, location, price, img, img1, img2, img3, img4],
    (err, result) => {
      if (err) {
        console.log(err);
        res.send(err);
      } else {
        console.log(result);
        res.send(result);
      }
    }
  );
});

app.listen(port, () => {
  console.log(`server run at http://localhost:${port}`);
});
