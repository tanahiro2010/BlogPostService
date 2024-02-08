const express = require("express");
const app = express();
const fs = require("fs");
const { emitWarning } = require("process");

//variable
let db = {};
let login_user = {};
const dbPath = "DB/DB.json";
const logPath = "Server.log";
const mailsPath = "DB/mails.array";
const code = "utf-8";
let mails = [];
let log = "";
(() =>{
    if (fs.existsSync(logPath)){
        log = fs.readFileSync(logPath, code);
    }else{
        fs.writeFileSync(logPath, "");
    }
});
//function
function AllLoad(){
    db = JSON.parse(fs.readFileSync(dbPath, code));
    mails = JSON.parse(fs.readFileSync(mailsPath, code));
}

function Signin(name, mail, pass){
    AllLoad();
    console.log(`Signin===================\nmail: ${mail}\npass: ${pass}\nname: ${name}\n=============================`);
    mails.push(mail);
    db[mail] = {"name":name, "pass": pass, "Pages": {}};
    console.log(db);
    console.log(JSON.stringify(mails));
    fs.writeFileSync(dbPath, JSON.stringify(db));
    fs.writeFileSync(mailsPath, JSON.stringify(mails))
    AllLoad();
    return true;
}

function Login(mail, pass, ip){
    AllLoad();
    if (Object.keys(db).includes(mail)){
        if (db[mail].pass == pass){
            if (!Object.keys(login_user).includes(ip)){
                login_user[ip] = db[mail];
                login_user[ip].mail = mail;
                console.log(JSON.stringify(login_user));
                return db[mail];
            }else{
                return false;
            }
        }else{
            return false;
        }
    }else{
        return false;
    }
}

function postPage(title, text, mail){
    AllLoad();
    if (!Object.keys(db[mail].Pages).includes(title)){
        db[mail].Pages[Object.keys(db[mail].Pages).length] = {
            "title":title,
            "Text":text,
            "good":0,
            "bad":0,
        };
        fs.writeFileSync(dbPath, JSON.stringify(db));
        return true;
    }else{
        return false;
    }
}

function readPage(title){
    AllLoad();
    const len = mails.length;
    let text = false;

    for (let mail of mails){
        for (let i=0; i<Object.keys(db[mail].Pages).length; i++){
            if (db[mail].Pages[i].title == title){
                text = db[mail].Pages[i];
            }
        }
    }
    if (text != false){
        return text;
    }else{
        return false;
    }
}

//Server
const PORT = 80;
app.listen(PORT, () =>{
    AllLoad();
    console.clear();
    log +=`\n${new Date} >> Start Server PORT: ${PORT}`
    console.log(`Start Server PORT: ${PORT}`);
});

//WebServer
app.get("/", (req, res) =>{
    log +=`\n${new Date} >> Access index`;
    console.log(`${new Date} >> Access index`);
    res.sendFile("index.html", {
        root: "Web"
    });
});

app.get("/page", (req, res) =>{
    log +=`\n${new Date} >> Access page`;
    res.sendFile("page.html", {
        root: "Web"
    });
});

app.get("/loginPage", (req, res) =>{
    log +=`\n${new Date} >> Access loginPage`;
    res.sendFile("login.html", {
        root: "Web"
    });
});

app.get("/signinPage", (req, res) =>{
    log +=`\n${new Date} >> Access signinPage`;
    res.sendFile("signin.html", {
        root: "Web"
    });
});

app.get("/dashboard", (req, res) =>{
    log +=`\n${new Date} >> Access dashboard`;
    res.sendFile("dashboard.html", {
        root: "Web"
    });
});

//Back
app.get("/signin", (req, res) =>{
    const mail = req.query.mail;
    const name = req.query.name;
    const pass = req.query.pass;
    log +=`\nTry Signin. mail: ${mail}, name: ${name}, pass: ${pass}`;
    console.log(`Try Signin. mail: ${mail}, name: ${name}, pass: ${pass}`);
    AllLoad();
    const bool = (Object.keys(db).includes(mail)) ? true:false;
    if (bool){
        res.send("false");
    }else{
        Signin(name, mail, pass);
        console.log("end")
        res.send("true");
    }
});

app.get("/login", (req, res) =>{
    const mail = req.query.mail;
    const pass = req.query.pass;
    const ip = req.query.ip;
    const bool = Login(mail, pass, ip);
    if (bool){
        res.send("true");
    }else{
        res.send("false");
    }
});

app.get("/post", (req, res) =>{
    const mail = req.query.mail;
    const title = req.query.title;
    const text = req.query.text;

    const bool = postPage(title, text, mail);
    res.send(bool ? "true":"false");
});

app.get("/read", (req, res)=>{
    const title = req.query.title;
    res.send(readPage(title));
});

app.get("/authentication", (req, res) =>{
    AllLoad();
    const ip = req.query.ip;
    console.log(ip);
    console.log(JSON.stringify(login_user[ip]));
    if (Object.keys(login_user).includes(ip)){
        console.log(JSON.stringify(login_user[ip]));
        delete login_user[ip].pass;
        res.send(JSON.stringify(login_user[ip]));
        delete login_user[ip];
        console.log(JSON.stringify(login_user));
    }else{
        res.send("false");
    }
});

app.get("/list", (req, res) =>{
    AllLoad();
    let temp = [];
    for (let mail of mails){
        temp.push(db[mail].Pages);
    }
    temp = JSON.stringify(temp);
    console.log(temp);
    res.send(temp);
});

app.get("/evaluation", (req, res) =>{
    const evaluation = req.query.evaluation;
    const title = req.query.title;
    console.log("evaluation");
    AllLoad();
    for (let mail of mails){
        const len = Object.keys(db[mail].Pages).length;
        for (let i=0; i<len; i++){
            if (db[mail].Pages[i].title == title){
                if (evaluation == "good"){
                    db[mail].Pages[i].good = db[mail].Pages[i].good + 1;
                }else{
                    db[mail].Pages[i].bad = db[mail].Pages[i].bad + 1;
                }
                fs.writeFileSync(dbPath, JSON.stringify(db));
                res.send("true");
                break;
                return;
            }
        }
    }
    res.send("false");
});

setInterval(() =>{
    console.clear();
    fs.writeFileSync(logPath, log);
    log = fs.readFileSync(logPath, code);
}, 60000);