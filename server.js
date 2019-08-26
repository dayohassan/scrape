const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 8000;
const axios = require('axios');
const cheerio = require('cheerio');
const exhbs = require('express-handlebars');
const db = require('./modules');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.engine("handlebars", exhbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(express.static('public'))

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI);

app.get("/", (req, res) => {
    db.Article.find().then(function(articles){
        res.render("index", { articles })
    })
});
app.get("/scrape", (req, res) => {
    axios.get("http://www.autoblog.com")
        .then(function (response) {
            const $ = cheerio.load(response.data);
            console.log("here")
            $("div div .record_body").each(function (i, element) {
                if(i < 10){
                    const result = {};
                    result.title = $(this).find('.record-heading').find('span').text();
                    result.link = $(this).find('.record-heading').find('a').attr("href");
                   if(result.link && result.title){

                       db.Article.create(result).catch(err => console.log("err"))
                   }
                }
            })
            res.redirect("/")
        })
})
app.get("/remove/:id", (req, res)=> {
    db.Article.findOneAndDelete(req.params.id)
        .then(function(result){
            res.redirect("/")
        })
        .catch(function(err){
            res.status(400)
        })
})
app.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`))