function f(){
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            resolve();
        })
    },1000);
}

async function test(){
    try{
        await f1();
        await f2();

    }
    catch(err){
        console.log("erroe")
    }
}