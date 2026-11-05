// Express REST API for TEENA THANMAY FITNESS.
const express = require('express');
const path = require('path');
const pool = require('./db');
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
const route = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const validDate = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime());

app.get('/api/health', route(async (req,res) => { await pool.query('SELECT 1'); res.json({ok:true,database:'connected'}); }));
app.get('/api/dashboard', route(async (req,res) => {
  const [[m]] = await pool.query('SELECT COUNT(*) total FROM members');
  const [[p]] = await pool.query('SELECT COUNT(*) total FROM membership_plans');
  const [[s]] = await pool.query('SELECT COUNT(*) total FROM subscriptions');
  const [[r]] = await pool.query("SELECT COALESCE(SUM(amount_paid),0) total FROM subscriptions WHERE payment_status='Paid'");
  const [recent] = await pool.query(`SELECT s.id,s.start_date,s.end_date,s.payment_status,s.amount_paid,
    CONCAT(m.first_name,' ',m.last_name) member_name,p.name plan_name
    FROM subscriptions s JOIN members m ON m.id=s.member_id JOIN membership_plans p ON p.id=s.plan_id
    ORDER BY s.created_at DESC LIMIT 5`);
  res.json({members:m.total,plans:p.total,subscriptions:s.total,revenue:Number(r.total),recent});
}));

app.get('/api/members', route(async (req,res) => { const [rows]=await pool.query('SELECT * FROM members ORDER BY created_at DESC'); res.json(rows); }));
app.post('/api/members', route(async (req,res) => {
  const {first_name,last_name,email,phone,gender,joining_date}=req.body;
  if (![first_name,last_name,email,phone,gender,joining_date].every(v=>String(v||'').trim())) return res.status(400).json({error:'Please complete every member field.'});
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:'Enter a valid email address.'});
  if (!validDate(joining_date)) return res.status(400).json({error:'Enter a valid joining date.'});
  const [result]=await pool.execute('INSERT INTO members(first_name,last_name,email,phone,gender,joining_date) VALUES(?,?,?,?,?,?)',
    [first_name.trim(),last_name.trim(),email.trim().toLowerCase(),phone.trim(),gender,joining_date]);
  const [rows]=await pool.execute('SELECT * FROM members WHERE id=?',[result.insertId]); res.status(201).json(rows[0]);
}));
app.delete('/api/members/:id', route(async (req,res) => {
  const [r]=await pool.execute('DELETE FROM members WHERE id=?',[req.params.id]);
  if(!r.affectedRows) return res.status(404).json({error:'Member not found.'});
  res.json({message:'Member deleted. Their subscriptions were also removed.'});
}));

app.get('/api/plans', route(async (req,res) => { const [rows]=await pool.query('SELECT * FROM membership_plans ORDER BY price,id'); res.json(rows); }));
app.post('/api/plans', route(async (req,res) => {
  const {name,duration_days,price,access_level,description,status}=req.body;
  const days=Number(duration_days), cost=Number(price);
  if (![name,access_level,description,status].every(v=>String(v||'').trim()) || !Number.isInteger(days)||days<1||!Number.isFinite(cost)||cost<0)
    return res.status(400).json({error:'Provide a name, positive duration, valid price, access level, description and status.'});
  if(!['Active','Inactive'].includes(status)) return res.status(400).json({error:'Choose a valid plan status.'});
  const [r]=await pool.execute('INSERT INTO membership_plans(name,duration_days,price,access_level,description,status) VALUES(?,?,?,?,?,?)',
    [name.trim(),days,cost,access_level.trim(),description.trim(),status]);
  const [rows]=await pool.execute('SELECT * FROM membership_plans WHERE id=?',[r.insertId]); res.status(201).json(rows[0]);
}));
app.delete('/api/plans/:id', route(async (req,res) => {
  try { const [r]=await pool.execute('DELETE FROM membership_plans WHERE id=?',[req.params.id]);
    if(!r.affectedRows) return res.status(404).json({error:'Plan not found.'}); res.json({message:'Plan deleted.'});
  } catch(e) { if(e.code==='ER_ROW_IS_REFERENCED_2') return res.status(409).json({error:'This plan is used by a subscription. Delete those subscriptions first.'}); throw e; }
}));

app.get('/api/subscriptions', route(async (req,res) => {
  const [rows]=await pool.query(`SELECT s.*,CONCAT(m.first_name,' ',m.last_name) member_name,m.email,
    p.name plan_name,p.duration_days FROM subscriptions s JOIN members m ON m.id=s.member_id
    JOIN membership_plans p ON p.id=s.plan_id ORDER BY s.created_at DESC`); res.json(rows);
}));
app.post('/api/subscriptions', route(async (req,res) => {
  const {member_id,plan_id,start_date,payment_status,amount_paid}=req.body;
  const mid=Number(member_id), pid=Number(plan_id), amount=Number(amount_paid);
  if(!Number.isInteger(mid)||mid<1||!Number.isInteger(pid)||pid<1||!validDate(start_date)||
    !['Paid','Pending','Failed'].includes(payment_status)||!Number.isFinite(amount)||amount<0)
    return res.status(400).json({error:'Check member, plan, start date, payment status and amount.'});
  const [plans]=await pool.execute('SELECT duration_days FROM membership_plans WHERE id=? AND status="Active"',[pid]);
  if(!plans.length) return res.status(400).json({error:'Select an active membership plan.'});
  const [members]=await pool.execute('SELECT id FROM members WHERE id=?',[mid]);
  if(!members.length) return res.status(400).json({error:'Select a registered member.'});
  const end=new Date(`${start_date}T00:00:00Z`); end.setUTCDate(end.getUTCDate()+Number(plans[0].duration_days));
  const endDate=`${end.getUTCFullYear()}-${String(end.getUTCMonth()+1).padStart(2,'0')}-${String(end.getUTCDate()).padStart(2,'0')}`;
  const [r]=await pool.execute('INSERT INTO subscriptions(member_id,plan_id,start_date,end_date,payment_status,amount_paid) VALUES(?,?,?,?,?,?)',
    [mid,pid,start_date,endDate,payment_status,amount]);
  const [rows]=await pool.execute(`SELECT s.*,CONCAT(m.first_name,' ',m.last_name) member_name,p.name plan_name
    FROM subscriptions s JOIN members m ON m.id=s.member_id JOIN membership_plans p ON p.id=s.plan_id WHERE s.id=?`,[r.insertId]);
  res.status(201).json(rows[0]);
}));
app.delete('/api/subscriptions/:id', route(async (req,res) => {
  const [r]=await pool.execute('DELETE FROM subscriptions WHERE id=?',[req.params.id]);
  if(!r.affectedRows) return res.status(404).json({error:'Subscription not found.'}); res.json({message:'Subscription deleted.'});
}));

app.use((err,req,res,next) => {
  console.error('[API error]',err.code||err.message);
  if(res.headersSent) return next(err);
  if(err.code==='ER_DUP_ENTRY') return res.status(409).json({error:'That email or plan name already exists.'});
  if(['ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR','ER_BAD_DB_ERROR'].includes(err.code))
    return res.status(503).json({error:'Cannot connect to MySQL. Check that MySQL is running, the database exists, and DB_USER / DB_PASSWORD match your setup.'});
  res.status(500).json({error:'Something went wrong on the server. Check the terminal for details.'});
});
app.listen(PORT,()=>console.log(`TEENA THANMAY FITNESS running at http://localhost:${PORT}`));
