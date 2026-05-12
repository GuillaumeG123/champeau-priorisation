const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Base de données SQLite
const db = new Database('champeau.db');

// Créer la table si elle n'existe pas
db.exec(`
  CREATE TABLE IF NOT EXISTS projets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    etat TEXT DEFAULT 'Actif',
    resp TEXT DEFAULT '',
    impact REAL DEFAULT 0,
    hrs REAL DEFAULT 0,
    sst INTEGER,
    arret INTEGER,
    strat INTEGER,
    jours INTEGER,
    prog INTEGER DEFAULT 0,
    datev TEXT DEFAULT '',
    datec TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    bc TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

// Insérer les données initiales si la table est vide
const count = db.prepare('SELECT COUNT(*) as n FROM projets').get();
if (count.n === 0) {
  const insert = db.prepare(`
    INSERT INTO projets (nom,etat,resp,impact,hrs,sst,arret,strat,jours,prog,datev,datec,notes,bc)
    VALUES (@nom,@etat,@resp,@impact,@hrs,@sst,@arret,@strat,@jours,@prog,@datev,@datec,@notes,@bc)
  `);
  const insertMany = db.transaction((projets) => {
    for (const p of projets) insert.run(p);
  });
  insertMany([
    {nom:'Inspection Goujons',etat:'Actif',resp:'Charles.G',impact:300000,hrs:12000,sst:2,arret:0,strat:5,jours:4,prog:60,datev:'2026-06-14',datec:'',notes:'Conceptromec: ingénierie pratiquement terminée\nComact: Nouvelle version 6 caméras en ingénierie',bc:'1237'},
    {nom:'Empilement robot/scie 1000',etat:'Actif',resp:'Guillaume.G',impact:0,hrs:2000,sst:2,arret:0,strat:5,jours:2,prog:90,datev:'2026-05-08',datec:'2026-05-08',notes:'Projitech: mandat terminé\nRobond: livraison 4 semaines\nInstallation 1 mai',bc:''},
    {nom:'Projet palette — Phase 1',etat:'Actif',resp:'Charles.G',impact:0,hrs:240,sst:1,arret:3,strat:5,jours:4,prog:50,datev:'2026-06-30',datec:'',notes:'Piché en commande — livraison fin mai\nVibrotech en commande — livraison fin mai',bc:''},
    {nom:'Contrôle central séchoirs',etat:'Actif',resp:'Guillaume.G',impact:100000,hrs:50,sst:0,arret:5,strat:5,jours:4,prog:10,datev:'2026-08-30',datec:'',notes:'Soumission Genisys reçue — en validation\nInclus contrôle IDRY',bc:''},
    {nom:'Robot Stenner — Phase 2',etat:'Actif',resp:'Guillaume.G',impact:25000,hrs:3900,sst:2,arret:0,strat:5,jours:4,prog:20,datev:'2026-08-30',datec:'',notes:'Soumission en correction\nHansweber — commande à finaliser',bc:''},
    {nom:'Membrane séchoir',etat:'Actif',resp:'Charles.G',impact:60000,hrs:600,sst:0,arret:5,strat:1,jours:3,prog:15,datev:'2026-06-30',datec:'',notes:'Rapport analyse déposé vendredi 13 mars',bc:'2612'},
    {nom:'Planeur 4 faces OSI',etat:'Actif',resp:'Guillaume.G',impact:0,hrs:3150,sst:0,arret:0,strat:4,jours:5,prog:30,datev:'2026-09-30',datec:'',notes:'Contrat accepté — conception OSI en cours\nTests à venir',bc:'2295'},
    {nom:'Séchoir #10',etat:'Actif',resp:'Charles.G',impact:150000,hrs:0,sst:0,arret:0,strat:4,jours:3,prog:10,datev:'2026-07-15',datec:'',notes:'IDRY: ingénierie en cours\nGenisys: soumission à venir',bc:''},
    {nom:'Convoyeur SC217_RA',etat:'Actif',resp:'Guillaume.G',impact:0,hrs:0,sst:0,arret:3,strat:2,jours:3,prog:70,datev:'',datec:'2026-05-03',notes:'En fabrication — installation 1 au 3 mai',bc:''},
    {nom:'Alimenteur moulurière',etat:'Actif',resp:'Guillaume.G',impact:0,hrs:0,sst:0,arret:3,strat:0,jours:4,prog:60,datev:'2026-03-31',datec:'',notes:'Installation M1 vendredi 13 mars\nSuite selon tests',bc:'338'},
    {nom:'Buté de coupe tronçonnage',etat:'Actif',resp:'Guillaume.G',impact:0,hrs:0,sst:0,arret:0,strat:0,jours:4,prog:20,datev:'2026-03-31',datec:'',notes:'Commande matériel électrique en cours',bc:'1043'},
    {nom:'Table hydraulique laminage',etat:'Actif',resp:'Charles.G',impact:0,hrs:0,sst:3,arret:0,strat:0,jours:2,prog:0,datev:'',datec:'',notes:'Demande de spécification au 2x David',bc:'1719'},
    {nom:'Décanteur déligneuse Lico',etat:'Actif',resp:'Guillaume.G',impact:0,hrs:0,sst:0,arret:0,strat:1,jours:3,prog:0,datev:'',datec:'',notes:'Revalider avec Piché',bc:'1856'},
    {nom:'Passerelle préparation de rang',etat:'Actif',resp:'Guillaume.G',impact:0,hrs:0,sst:2,arret:1,strat:0,jours:1,prog:80,datev:'',datec:'',notes:'Matériel reçu — prêt pour installation',bc:'2899'},
    {nom:'Conduit ferblanterie compresseurs',etat:'Actif',resp:'Vincent.T',impact:0,hrs:0,sst:null,arret:null,strat:null,jours:null,prog:0,datev:'',datec:'',notes:'En soumission — 1 reçue, 1 à venir',bc:''},
    {nom:'Botteur double laminage',etat:'Actif',resp:'',impact:0,hrs:0,sst:null,arret:null,strat:null,jours:null,prog:0,datev:'',datec:'',notes:'À revoir',bc:''},
    {nom:'Réduire sortie sciure déligneuse',etat:'Actif',resp:'Charles.G',impact:0,hrs:0,sst:null,arret:null,strat:null,jours:null,prog:0,datev:'',datec:'',notes:'Constat et évaluation préliminaire à faire',bc:''},
    {nom:'Projet Séchoir 19-25',etat:'Attente',resp:'Charles.G',impact:0,hrs:0,sst:0,arret:0,strat:4,jours:5,prog:0,datev:'',datec:'',notes:'En pause selon projection IDRY',bc:''},
    {nom:'Upgrade Joulin séchoirs sous vide',etat:'Attente',resp:'Charles.G',impact:0,hrs:0,sst:0,arret:4,strat:4,jours:5,prog:0,datev:'',datec:'',notes:'Test: dépiler 2 rangs sans plaque',bc:''},
    {nom:'Arcadeuse et robot — Phase 3',etat:'Attente',resp:'Guillaume.G',impact:0,hrs:0,sst:1,arret:0,strat:5,jours:4,prog:0,datev:'2026-06-30',datec:'',notes:'STAND BY — attente résultats Stenner',bc:''},
    {nom:'Serre Doucet',etat:'Attente',resp:'Médéric.G',impact:0,hrs:0,sst:3,arret:0,strat:0,jours:3,prog:0,datev:'',datec:'',notes:'Lemieux non-conforme — analyse en cours',bc:'1244'},
  ]);
  console.log('✅ Données initiales insérées');
}

app.use(express.json());
app.use(express.static('public'));

// ── API REST ──────────────────────────────────────────
app.get('/api/projets', (req, res) => {
  const projets = db.prepare('SELECT * FROM projets ORDER BY id').all();
  res.json(projets);
});

app.post('/api/projets', (req, res) => {
  const p = req.body;
  const result = db.prepare(`
    INSERT INTO projets (nom,etat,resp,impact,hrs,sst,arret,strat,jours,prog,datev,datec,notes,bc,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
  `).run(p.nom,p.etat,p.resp,p.impact,p.hrs,p.sst,p.arret,p.strat,p.jours,p.prog,p.datev,p.datec,p.notes,p.bc);
  const nouveau = db.prepare('SELECT * FROM projets WHERE id=?').get(result.lastInsertRowid);
  res.json(nouveau);
});

app.put('/api/projets/:id', (req, res) => {
  const p = req.body;
  db.prepare(`
    UPDATE projets SET nom=?,etat=?,resp=?,impact=?,hrs=?,sst=?,arret=?,strat=?,jours=?,prog=?,datev=?,datec=?,notes=?,bc=?,updated_at=datetime('now')
    WHERE id=?
  `).run(p.nom,p.etat,p.resp,p.impact,p.hrs,p.sst,p.arret,p.strat,p.jours,p.prog,p.datev,p.datec,p.notes,p.bc,req.params.id);
  const updated = db.prepare('SELECT * FROM projets WHERE id=?').get(req.params.id);
  res.json(updated);
});

app.delete('/api/projets/:id', (req, res) => {
  db.prepare('DELETE FROM projets WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`✅ Champeau app → http://localhost:${PORT}`));
