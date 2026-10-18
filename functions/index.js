// functions/index.js — خادم المعالجة (Firebase Cloud Functions v2)
// npm i firebase-admin firebase-functions   |   firebase functions:secrets:set ANTHROPIC_API_KEY
const {onRequest}=require("firebase-functions/v2/https");
const {defineSecret}=require("firebase-functions/params");
const admin=require("firebase-admin");admin.initializeApp();
const KEY=defineSecret("ANTHROPIC_API_KEY");
exports.ai=onRequest({secrets:[KEY],region:"europe-west1",cors:["https://YOUR-USERNAME.github.io"],maxInstances:5,timeoutSeconds:120,memory:"512MiB"},async(req,res)=>{
  try{
    if(req.method!=="POST")return res.status(405).end();
    await admin.auth().verifyIdToken((req.get("Authorization")||"").replace("Bearer ",""));
    const {prompt,images=[]}=req.body||{};
    if(typeof prompt!=="string"||prompt.length>120000||!Array.isArray(images)||images.length>10)return res.status(400).end();
    const content=[...images.map(d=>({type:"image",source:{type:"base64",media_type:"image/jpeg",data:d}})),{type:"text",text:prompt}];
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":KEY.value(),"anthropic-version":"2023-06-01","content-type":"application/json"},body:JSON.stringify({model:"claude-sonnet-5-5",max_tokens:8000,messages:[{role:"user",content}]})});
    if(r.status===429)return res.status(429).end();
    if(!r.ok)return res.status(502).end();
    const j=await r.json();
    res.json({text:(j.content||[]).map(b=>b.text||"").join("")});
  }catch(e){res.status(401).end()}
});
