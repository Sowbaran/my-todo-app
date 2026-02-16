function globalMiddlware(err,req,res,next){
    console.log(' i caught the error as a global middleware ');
    res.status(500).send("Saved by the global middleware not the application is safe ")

}

module.exports = globalMiddlware;


