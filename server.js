const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion PostgreSQL via variable d'environnement DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// Initialiser les tables et données de base
async function initDB() {
  const client = await pool.connect();
  try {
    // Migration: ajouter parent_id si absent
    await client.query(`ALTER TABLE projets ADD COLUMN IF NOT EXISTS parent_id INTEGER DEFAULT NULL`);

  // Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS projets (
        id SERIAL PRIMARY KEY,
        nom TEXT NOT NULL,
        etat TEXT DEFAULT 'Actif',
        resp TEXT DEFAULT '',
        impact NUMERIC DEFAULT 0,
        hrs NUMERIC DEFAULT 0,
        sst INTEGER,
        arret INTEGER,
        strat INTEGER,
        jours INTEGER,
        prog INTEGER DEFAULT 0,
        datev TEXT DEFAULT '',
        datec TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        bc TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS intervenants (
        id SERIAL PRIMARY KEY,
        nom TEXT NOT NULL UNIQUE,
        role TEXT DEFAULT '',
        actif INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Données initiales projets
    const { rows: p } = await client.query('SELECT COUNT(*) as n FROM projets');
    if (parseInt(p[0].n) === 0) {
      const projetsData = [
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
      ];
      for (const d of projetsData) {
        await client.query(
          `INSERT INTO projets (nom,etat,resp,impact,hrs,sst,arret,strat,jours,prog,datev,datec,notes,bc) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          d
        );
      }
      console.log('✅ Projets initiaux insérés');
    }

    // Données initiales intervenants
    const { rows: i } = await client.query('SELECT COUNT(*) as n FROM intervenants');
    if (parseInt(i[0].n) === 0) {
      const intervenantsData = [
        ['Charles.G',   'Ingénieur senior'],
        ['Guillaume.G', 'Ingénieur'],
        ['Vincent.T',   'Ingénieur'],
        ['Médéric.G',   'Ingénieur'],
        ['Mathis.T',    'Technicien'],
        ['Igor.N',      'Technicien'],
        ['Louis_David', 'Technicien'],
        ['Stéphane.V',  'Technicien'],
        ['Jacob',       'Technicien'],
      ];
      for (const d of intervenantsData) {
        await client.query('INSERT INTO intervenants (nom,role) VALUES ($1,$2)', d);
      }
      console.log('✅ Intervenants initiaux insérés');
    }

    console.log('✅ Base de données PostgreSQL initialisée');
  } finally {
    client.release();
  }
}

app.use(express.json());

const publicPath = path.join(__dirname, 'public', 'index.html');
const rootPath   = path.join(__dirname, 'index.html');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
  if (fs.existsSync(publicPath)) res.sendFile(publicPath);
  else if (fs.existsSync(rootPath)) res.sendFile(rootPath);
  else res.status(404).send('index.html introuvable');
});

// ── PROJETS ──────────────────────────────────────────
app.get('/api/projets', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projets ORDER BY id');
    res.json(rows);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/projets', async (req, res) => {
  const p = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO projets (nom,etat,resp,impact,hrs,sst,arret,strat,jours,prog,datev,datec,notes,bc,parent_id,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW()) RETURNING *`,
      [p.nom,p.etat,p.resp,p.impact,p.hrs,p.sst,p.arret,p.strat,p.jours,p.prog,p.datev,p.datec,p.notes,p.bc,p.parent_id||null]
    );
    res.json(rows[0]);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.put('/api/projets/:id', async (req, res) => {
  const p = req.body;
  try {
    // Verrouillage optimiste
    if (p._opened_at) {
      const { rows } = await pool.query('SELECT updated_at FROM projets WHERE id=$1', [req.params.id]);
      if (rows[0] && rows[0].updated_at) {
        const dbTime = new Date(rows[0].updated_at).getTime();
        const openTime = new Date(p._opened_at).getTime();
        if (dbTime > openTime) {
          return res.status(409).json({
            conflict: true,
            message: 'Ce projet a été modifié par quelqu\'un d\'autre depuis que vous l\'avez ouvert.',
            updated_at: rows[0].updated_at
          });
        }
      }
    }
    const { rows } = await pool.query(
      `UPDATE projets SET nom=$1,etat=$2,resp=$3,impact=$4,hrs=$5,sst=$6,arret=$7,strat=$8,
       jours=$9,prog=$10,datev=$11,datec=$12,notes=$13,bc=$14,parent_id=$15,updated_at=NOW()
       WHERE id=$16 RETURNING *`,
      [p.nom,p.etat,p.resp,p.impact,p.hrs,p.sst,p.arret,p.strat,p.jours,p.prog,p.datev,p.datec,p.notes,p.bc,p.parent_id||null,req.params.id]
    );
    res.json(rows[0]);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.delete('/api/projets/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projets WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({error:e.message}); }
});

// ── INTERVENANTS ─────────────────────────────────────
app.get('/api/intervenants', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM intervenants ORDER BY nom');
    res.json(rows);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/intervenants', async (req, res) => {
  const { nom, role } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO intervenants (nom,role) VALUES ($1,$2) RETURNING *',
      [nom, role||'']
    );
    res.json(rows[0]);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.put('/api/intervenants/:id', async (req, res) => {
  const { nom, role, actif } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE intervenants SET nom=$1,role=$2,actif=$3 WHERE id=$4 RETURNING *',
      [nom, role||'', actif??1, req.params.id]
    );
    res.json(rows[0]);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.delete('/api/intervenants/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM intervenants WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({error:e.message}); }
});


// ── BACKUP / RESTORE ─────────────────────────────────
app.get('/api/backup', async (req, res) => {
  try {
    const { rows: projets } = await pool.query('SELECT * FROM projets ORDER BY id');
    const { rows: intervenants } = await pool.query('SELECT * FROM intervenants ORDER BY id');
    const backup = {
      version: 1,
      date: new Date().toISOString(),
      projets,
      intervenants
    };
    res.setHeader('Content-Disposition', `attachment; filename="champeau-backup-${new Date().toISOString().substring(0,10)}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
    console.log(`✅ Backup exporté — ${projets.length} projets, ${intervenants.length} intervenants`);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/restore', async (req, res) => {
  const { projets, intervenants } = req.body;
  if (!projets || !intervenants) return res.status(400).json({error:'Fichier invalide'});
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Vider les tables
    await client.query('DELETE FROM projets');
    await client.query('DELETE FROM intervenants');
    // Réimporter projets
    for (const p of projets) {
      await client.query(
        `INSERT INTO projets (nom,etat,resp,impact,hrs,sst,arret,strat,jours,prog,datev,datec,notes,bc,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [p.nom,p.etat,p.resp,p.impact,p.hrs,p.sst,p.arret,p.strat,p.jours,p.prog,p.datev||'',p.datec||'',p.notes||'',p.bc||'',p.updated_at||new Date()]
      );
    }
    // Réimporter intervenants
    for (const i of intervenants) {
      await client.query(
        'INSERT INTO intervenants (nom,role,actif) VALUES ($1,$2,$3)',
        [i.nom, i.role||'', i.actif??1]
      );
    }
    await client.query('COMMIT');
    console.log(`✅ Restore — ${projets.length} projets, ${intervenants.length} intervenants`);
    res.json({ ok: true, projets: projets.length, intervenants: intervenants.length });
  } catch(e) {
    await client.query('ROLLBACK');
    res.status(500).json({error:e.message});
  } finally {
    client.release();
  }
});

// Démarrage
initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Champeau app → http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ Erreur DB:', err.message);
    process.exit(1);
  });
