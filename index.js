const express = require('express')
const app = express()
const path = require('path');

//app.set('view engine', 'ejs');

app.use('/public', express.static(path.join(__dirname, '/public')));

app.get('/',  (req, res) => {
    //File paths are relative to the view folder. IE: 'index' points to 'views/index.ejs'
    res.sendFile(path.join(__dirname + '/public/index.html'));
    //res.send("Hello World!")
})



app.listen(5000)