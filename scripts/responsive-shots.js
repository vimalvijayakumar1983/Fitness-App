const http=require('http'),fs=require('fs'),path=require('path');
const puppeteer=require('puppeteer-core');
const CHROME=fs.readFileSync('/tmp/chromepath','utf8').trim();
const DIST=path.join(process.cwd(),'dist');const OUT=path.join(process.cwd(),'screenshots');const PORT=4127;
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.map':'application/json','.ico':'image/x-icon'};
http.createServer((q,r)=>{let f=path.join(DIST,decodeURIComponent(q.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(DIST,'index.html');r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(PORT);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const seed=JSON.stringify({profile:{name:'You',goal:'lose',diet:'balanced',calorieTarget:2000,macroTargets:{protein:150,carbs:200,fat:60},waterGoalMl:2500,units:'metric',weightKg:78,heightCm:176,age:34,sex:'male',activityLevel:1.45,onboarded:true},
 meals:[{id:'m1',date:new Date().toISOString().slice(0,10),loggedAt:new Date().toISOString(),type:'breakfast',items:[{name:'Greek yogurt',calories:320,protein:24,carbs:34,fat:8}]}],
 exercises:[{id:'e1',date:new Date().toISOString().slice(0,10),loggedAt:new Date().toISOString(),activity:'Walk',durationMinutes:38,caloriesBurned:210,steps:8240,avgHeartRate:104,source:'apple_health'}],
 moods:[],sleep:[],water:[],weights:[{id:'w',date:new Date().toISOString().slice(0,10),loggedAt:new Date().toISOString(),weightKg:78}],glucose:[],assessment:null,labs:[],family:[],favoriteFoodIds:[],customFoods:[],customExercises:[],plan:null});
(async()=>{
 const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-setuid-sandbox']});
 const sizes=[['sm-phone',360,780],['tablet',768,1024],['desktop',1280,800]];
 for(const [name,w,h] of sizes){
   const p=await b.newPage();
   await p.setViewport({width:w,height:h,deviceScaleFactor:1});
   await p.evaluateOnNewDocument(s=>localStorage.setItem('fitnessapp:data:v1',s),seed);
   await p.goto(`http://localhost:${PORT}`,{waitUntil:'networkidle0'});await sleep(2500);
   await p.screenshot({path:path.join(OUT,`r-${name}.png`)});console.log('shot',name,w+'x'+h);
   await p.close();
 }
 await b.close();process.exit(0);
})();
