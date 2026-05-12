const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database('champeau.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS projets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL, etat TEXT DEFAULT 'Actif', resp TEXT DEFAULT '',
    impact REAL DEFAULT 0, hrs REAL DEFAULT 0,
    sst INTEGER, arret INTEGER, strat INTEGER, jours INTEGER,
    prog INTEGER DEFAULT 0, datev TEXT DEFAULT '', datec TEXT DEFAULT '',
    notes TEXT DEFAULT '', bc TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  )`);

  db.get('SELECT COUNT(*) as n FROM projets', (err, row) => {
    if (row && row.n === 0) {
      const stmt = db.prepare(`INSERT INTO projets (nom,etat,resp,impact,hrs,sst,arret,strat,jours,prog,datev,datec,notes,bc) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
      [
        ['Inspection Goujons','Actif','Charles.G',300000,12000,2,0,5,4,60,'2026-06-14','','Conceptromec: ingénierie pratiquement terminée\nComact: Nouvelle version 6 caméras en ingénierie','1237'],
        ['Empilement robot/scie 1000','Actif','Guillaume.G',0,2000,2,0,5,2,90,'2026-05-08','2026-05-08','Projitech: mandat terminé\nRobond: livraison 4 semaines\nInstallation 1 mai',''],
        ['Projet palette — Phase 1','Actif','Charles.G',0,240,1,3,5,4,50,'2026-06-30','','Piché en commande — livraison fin mai\nVibrotech en commande',''],
        ['Contrôle central séchoirs','Actif','Guillaume.G',100000,50,0,5,5,4,10,'2026-08-30','','Soumission Genisys reçue — en validation\nInclus contrôle IDRY',''],
        ['Robot Stenner — Phase 2','Actif','Guillaume.G',25000,3900,2,0,5,4,20,'2026-08-30','','Soumission en correction\nHansweber — commande à finaliser',''],
        ['Membrane séchoir','Actif','Charles.G',60000,600,0,5,1,3,15,'2026-06-30','','Rapport analyse déposé vendredi 13 mars','2612'],
        ['Planeur 4 faces OSI','Actif','Guillaume.G',0,3150,0,0,4,5,30,'2026-09-30','','Contrat accepté — conception OSI en cours\nTests à venir','2295'],
        ['Séchoir #10','Actif','Charles.G',150000,0,0,0,4,3,10,'2026-07-15','','IDRY: ingénierie en cours\nGenisys: soumission à venir',''],
        ['Convoyeur SC217_RA','Actif','Guillaume.G',0,0,0,3,2,3,70,'','2026-05-03','En fabrication — installation 1 au 3 mai',''],
        ['Alimenteur moulurière','Actif','Guillaume.G',0,0,0,3,0,4,60,'2026-03-31','','Installation M1 vendredi 13 mars\nSuite selon tests','338'],
        ['Buté de coupe tronçonnage','Actif','Guillaume.G',0,0,0,0,0,4,20,'2026-03-31','','Commande matériel électrique en cours','1043'],
        ['Table hydraulique laminage','Actif','Charles.G',0,0,3,0,0,2,0,'','','Demande de spécification au 2x David','1719'],
        ['Décanteur déligneuse Lico','Actif','Guillaume.G',0,0,0,0,1,3,0,'','','Revalider avec Piché','1856'],
        ['Passerelle préparation de rang','Actif','Guillaume.G',0,0,2,1,0,1,80,'','','Matériel reçu — prêt pour installation','2899'],
        ['Conduit ferblanterie compresseurs','Actif','Vincent.T',0,0,null,null,null,null,0,'','','En soumission — 1 reçue, 1 à venir',''],
        ['Botteur double laminage','Actif','',0,0,null,null,null,null,0,'','','À revoir',''],
        ['Réduire sortie sciure déligneuse','Actif','Charles.G',0,0,null,null,null,null,0,'','','Constat et évaluation préliminaire à faire',''],
        ['Projet Séchoir 19-25','Attente','Charles.G',0,0,0,0,4,5,0,'','','En pause selon projection IDRY',''],
        ['Upgrade Joulin séchoirs sous vide','Attente','Charles.G',0,0,0,4,4,5,0,'','','Test: dépiler 2 rangs sans plaque',''],
        ['Arcadeuse et robot — Phase 3','Attente','Guillaume.G',0,0,1,0,5,4,0,'2026-06-30','','STAND BY — attente résultats Stenner',''],
        ['Serre Doucet','Attente','Médéric.G',0,0,3,0,0,3,0,'','','Lemieux non-conforme — analyse en cours','1244'],
      ].forEach(d => stmt.run(...d));
      stmt.finalize();
      console.log('✅ Données initiales insérées');
    }
  });
});

app.use(express.json());

// Servir index.html depuis la racine ET depuis public/
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// Route fallback — envoie index.html peu importe où il se trouve
app.get('/', (req, res) => {
  const fs = require('fs');
  const publicPath = path.join(__dirname, 'public', 'index.html');
  const rootPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(publicPath)) res.sendFile(publicPath);
  else if (fs.existsSync(rootPath)) res.sendFile(rootPath);
  else res.status(404).send('index.html introuvable');
});

const dbAll = (sql, p=[]) => new Promise((res,rej) => db.all(sql,p,(e,r)=>e?rej(e):res(r)));
const dbRun = (sql, p=[]) => new Promise((res,rej) => db.run(sql,p,function(e){e?rej(e):res(this)}));

app.get('/api/projets', async (req,res) => {
  try { res.json(await dbAll('SELECT * FROM projets ORDER BY id')); }
  catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/projets', async (req,res) => {
  const p=req.body;
  try {
    const r=await dbRun(`INSERT INTO projets (nom,etat,resp,impact,hrs,sst,arret,strat,jours,prog,datev,datec,notes,bc,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`,
      [p.nom,p.etat,p.resp,p.impact,p.hrs,p.sst,p.arret,p.strat,p.jours,p.prog,p.datev,p.datec,p.notes,p.bc]);
    res.json((await dbAll('SELECT * FROM projets WHERE id=?',[r.lastID]))[0]);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.put('/api/projets/:id', async (req,res) => {
  const p=req.body;
  try {
    await dbRun(`UPDATE projets SET nom=?,etat=?,resp=?,impact=?,hrs=?,sst=?,arret=?,strat=?,jours=?,prog=?,datev=?,datec=?,notes=?,bc=?,updated_at=datetime('now') WHERE id=?`,
      [p.nom,p.etat,p.resp,p.impact,p.hrs,p.sst,p.arret,p.strat,p.jours,p.prog,p.datev,p.datec,p.notes,p.bc,req.params.id]);
    res.json((await dbAll('SELECT * FROM projets WHERE id=?',[req.params.id]))[0]);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.delete('/api/projets/:id', async (req,res) => {
  try { await dbRun('DELETE FROM projets WHERE id=?',[req.params.id]); res.json({ok:true}); }
  catch(e) { res.status(500).json({error:e.message}); }
});

app.listen(PORT, () => console.log(`✅ Champeau app → http://localhost:${PORT}`));
