import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { supabase } from './supabaseClients'

// 🌟 引入 3D 套件
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// =========================================================================
// 常數設定 (Constants)
// =========================================================================
const CHESURE_SLEEVE_OPTIONS = ['38x88 mm', '41x63 mm', '43x65 mm', '44x63 mm', '45x68 mm', '50x75 mm', '54x80 mm', '54x86 mm', '56x87 mm', '57.5x89 mm', '59x92 mm', '61x112 mm', '63.5x88 mm', '65x100 mm', '70x100 mm', '70x110 mm', '70x120 mm', '75x105 mm', '75x110 mm', '80x120 mm', '52x52 mm', '65x65 mm', '70x70 mm', '80x80 mm', '免用牌套']
const PLAYER_PALETTE = ['#6366f1', '#059669', '#d97706', '#db2777', '#2563eb', '#7c3aed', '#0d9488', '#ea580c']
const TEAM_CONFIG = [
  { name: '藍隊', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(37, 99, 235, 0.25)' },
  { name: '琥珀隊', color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)', border: 'rgba(217, 119, 6, 0.25)' },
  { name: '綠隊', color: '#059669', bg: 'rgba(5, 150, 105, 0.08)', border: 'rgba(5, 150, 105, 0.25)' },
  { name: '紫隊', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.08)', border: 'rgba(124, 58, 237, 0.25)' }
]
const PLAYER_OPTIONS = [{ key: 'all', label: '不限' }, { key: '2', label: '2 人' }, { key: '3', label: '3 人' }, { key: '4', label: '4 人' }, { key: '5', label: '5 人' }, { key: '6', label: '6 人以上' }]
const BEST_PLAYER_OPTIONS = [{ key: 'all', label: '不限' }, { key: '2', label: '2 人' }, { key: '3', label: '3 人' }, { key: '4', label: '4 人' }, { key: '5', label: '5 人' }, { key: '6', label: '6 人' }, { key: '7', label: '7 人' }, { key: '8', label: '8 人' }]
const TIME_OPTIONS = [{ key: 'all', label: '不限' }, { key: '15', label: '15分內' }, { key: '30', label: '30分內' }]
const SORT_OPTIONS = [{ key: 'rating-desc', label: '⭐ 評分最高' }, { key: 'time-asc', label: '⏱ 時間最短' }, { key: 'time-desc', label: '⏳ 時間最長' }, { key: 'complexity-desc', label: '🔥 燒腦硬核' }, { key: 'name-asc', label: '🔤 名稱順序' }]
const initialGames = [
  { id: 1, name: '地城無雙 Dungeon Mayhem', englishName: 'Dungeon Mayhem', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 15, category: '卡牌對戰', rating: 8.00, complexity: 1.50, emoji: '⚔️', imageUrl: '', tags: ['新手推薦', '快節奏'], description: '極度爽快的卡牌對戰遊戲！', cheatSheet: '1. 每回合抽2張牌。\n2. 攻擊對手血量，歸零者淘汰。', videoUrl: '', bggUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm (120張)', created_at: new Date().toISOString() },
  { id: 2, name: '心靈同步', englishName: 'The Mind', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 20, category: '合作', rating: 6.80, complexity: 1.06, emoji: '🧠', imageUrl: '', tags: ['默契考驗', '靜音遊戲'], description: '不能說話、不能打手勢，靠感覺出牌！', cheatSheet: '1. 牌面由小到大打出。\n2. 全程絕對不能溝通。', videoUrl: '', bggUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '56x87 mm (120張)' }
]
const ADMIN_PASSWORD = '1234'
const emptyForm = { name: '', englishName: '', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 30, category: '派對', rating: '', complexity: '', emoji: '🎲', imageUrl: '', tagsInput: '', description: '', cheatSheet: '', videoUrl: '', bggUrl: '', gameType: 'main', parentId: '' }

// =========================================================================
// 判斷是否為 14 天內新加入的桌遊 (Auto-Expiring Badge 邏輯)
// =========================================================================
const isNewGame = (createdAt) => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = now.getTime() - createdDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 14;
};

// =========================================================================
// 🌟 真實搖骰音效
// =========================================================================
const shakeSound = new Audio('/shake.m4a'); 
shakeSound.preload = 'auto';
let fadeInterval = null;

const playShakeSound = () => {
  try {
    if (fadeInterval) clearInterval(fadeInterval);
    if (shakeSound.readyState >= 2) { shakeSound.currentTime = 0; }
    shakeSound.volume = 1.0; 
    const playPromise = shakeSound.play();
    if (playPromise !== undefined) { playPromise.catch(e => console.warn("音效播放受阻:", e)); }
  } catch (err) {
    console.warn("Audio error:", err);
  }
};

const fadeOutShakeSound = () => {
  let vol = 1.0;
  fadeInterval = setInterval(() => {
    vol -= 0.1; 
    if (vol <= 0) { clearInterval(fadeInterval); shakeSound.pause(); shakeSound.volume = 1.0; } 
    else { shakeSound.volume = vol; }
  }, 30);
};

/* ========================================================================= */
/* 🌟 3D 原生骰子與材質引擎 (高對比、清晰點數版) */
/* ========================================================================= */
const AVAILABLE_DICE_SIDES = [6, 8, 12, 20];

const createLeatherTextures = () => {
  const cvs = document.createElement('canvas'); const bumpCvs = document.createElement('canvas');
  cvs.width = bumpCvs.width = 512; cvs.height = bumpCvs.height = 512;
  const ctx = cvs.getContext('2d'); const bCtx = bumpCvs.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,512,512); 
  bCtx.fillStyle = '#888888'; bCtx.fillRect(0,0,512,512);
  for(let i=0; i<80000; i++) {
     let x = Math.random()*512; let y = Math.random()*512; let r = Math.random()*1.5 + 0.5; 
     bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
     bCtx.beginPath(); bCtx.arc(x, y, r, 0, Math.PI*2); bCtx.fill();
     ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.05})`;
     ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  }
  const map = new THREE.CanvasTexture(cvs); const bump = new THREE.CanvasTexture(bumpCvs);
  map.wrapS = map.wrapT = bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4, 4); bump.repeat.set(4, 4); map.anisotropy = 16; bump.anisotropy = 16;
  return { map, bump };
};

const createWoodTextures = () => {
  const cvs = document.createElement('canvas'); const bumpCvs = document.createElement('canvas');
  cvs.width = bumpCvs.width = 1024; cvs.height = bumpCvs.height = 1024;
  const ctx = cvs.getContext('2d'); const bCtx = bumpCvs.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,1024,1024);
  bCtx.fillStyle = '#888888'; bCtx.fillRect(0,0,1024,1024);
  for(let i=0; i<600; i++) {
     ctx.beginPath(); bCtx.beginPath();
     let startY = Math.random() * 1024; let endY = startY + (Math.random() - 0.5) * 100;
     ctx.moveTo(0, startY); bCtx.moveTo(0, startY);
     ctx.bezierCurveTo(340, startY + (Math.random()-0.5)*50, 680, endY + (Math.random()-0.5)*50, 1024, endY);
     bCtx.bezierCurveTo(340, startY + (Math.random()-0.5)*50, 680, endY + (Math.random()-0.5)*50, 1024, endY);
     let op = Math.random() * 0.15 + 0.05;
     ctx.strokeStyle = `rgba(0,0,0,${op})`; ctx.lineWidth = Math.random() * 3 + 1; ctx.stroke();
     bCtx.strokeStyle = `rgba(0,0,0,${op * 0.5})`; bCtx.lineWidth = ctx.lineWidth; bCtx.stroke();
  }
  const map = new THREE.CanvasTexture(cvs); const bump = new THREE.CanvasTexture(bumpCvs);
  map.wrapS = map.wrapT = bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 3); bump.repeat.set(1, 3); map.anisotropy = 16; bump.anisotropy = 16;
  return { map, bump };
};

const createFeltBump = () => {
  const cvs = document.createElement('canvas'); cvs.width = 512; cvs.height = 512; const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#888888'; ctx.fillRect(0,0,512,512);
  for(let i=0; i<150000; i++) {
     ctx.fillStyle = Math.random()>0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
     ctx.fillRect(Math.random()*512, Math.random()*512, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 6); tex.anisotropy = 16; return tex;
};

const createPremiumMats = (sides) => {
  const mats = [];
  const SIZE = 1024; const CENTER = SIZE / 2;
  for (let i = 1; i <= sides; i++) {
    const cvs = document.createElement('canvas'); cvs.width = SIZE; cvs.height = SIZE; const ctx = cvs.getContext('2d');
    const bumpCvs = document.createElement('canvas'); bumpCvs.width = SIZE; bumpCvs.height = SIZE; const bumpCtx = bumpCvs.getContext('2d');
    ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, 0, SIZE, SIZE); 
    bumpCtx.fillStyle = '#000000'; bumpCtx.fillRect(0, 0, SIZE, SIZE); 
    const grad = bumpCtx.createRadialGradient(CENTER, CENTER, SIZE * 0.25, CENTER, CENTER, CENTER);
    grad.addColorStop(0, '#888888'); grad.addColorStop(0.8, '#888888'); grad.addColorStop(1, '#000000');
    bumpCtx.fillStyle = grad; bumpCtx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = i === sides ? '#ef4444' : '#1e293b'; bumpCtx.fillStyle = '#000000';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; bumpCtx.textAlign = 'center'; bumpCtx.textBaseline = 'middle';
    let fontSize = 400;
    if (sides === 12) fontSize = 320; if (sides === 20) fontSize = 280;
    if (i > 9) fontSize *= 0.85; 
    ctx.font = `900 ${fontSize}px "Segoe UI", Arial, sans-serif`; bumpCtx.font = `900 ${fontSize}px "Segoe UI", Arial, sans-serif`;
    const yOffset = CENTER; const text = i.toString();
    ctx.fillText(text, CENTER, yOffset); bumpCtx.fillText(text, CENTER, yOffset);
    if (sides >= 12 && (i === 6 || i === 9)) {
       const lineY = yOffset + fontSize * 0.45; const lineW = fontSize * 0.6; const lineH = fontSize * 0.1;
       ctx.fillRect(CENTER - lineW/2, lineY, lineW, lineH); bumpCtx.fillRect(CENTER - lineW/2, lineY, lineW, lineH);
    }
    const tex = new THREE.CanvasTexture(cvs); tex.anisotropy = 16; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    const bumpTex = new THREE.CanvasTexture(bumpCvs); bumpTex.anisotropy = 16; bumpTex.generateMipmaps = true; bumpTex.minFilter = THREE.LinearMipmapLinearFilter;
    mats.push(new THREE.MeshPhysicalMaterial({ map: tex, bumpMap: bumpTex, bumpScale: 0.04, roughness: 0.1, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.1, side: THREE.DoubleSide }));
  }
  return mats;
};

// ⚡ 終極 D6 貼圖：加深點數顏色為高對比深藍色，保證超級清晰
const createPremiumD6Mats = () => {
  const mats = [];
  const SIZE = 1024;
  const CENTER = SIZE / 2;
  
  for (let i = 1; i <= 6; i++) {
    const cvs = document.createElement('canvas'); cvs.width = SIZE; cvs.height = SIZE; const ctx = cvs.getContext('2d');
    const bumpCvs = document.createElement('canvas'); bumpCvs.width = SIZE; bumpCvs.height = SIZE; const bumpCtx = bumpCvs.getContext('2d');
    
    // 乾淨純白骰面
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, SIZE, SIZE); 
    bumpCtx.fillStyle = '#888888'; bumpCtx.fillRect(0, 0, SIZE, SIZE); 
    
    const grad = bumpCtx.createRadialGradient(CENTER, CENTER, SIZE * 0.35, CENTER, CENTER, SIZE * 0.5);
    grad.addColorStop(0, '#aaaaaa'); grad.addColorStop(1, '#888888');
    bumpCtx.fillStyle = grad; bumpCtx.fillRect(0, 0, SIZE, SIZE);
    
    // 畫高對比、極清晰的深藍色點數
    const drawDot = (x, y) => { 
        ctx.fillStyle = '#1e293b'; // 加深為極致清晰的高對比深藍色
        ctx.beginPath(); ctx.arc(x, y, 70, 0, Math.PI*2); ctx.fill(); 
        
        // 凹陷陰影
        const dotBumpGrad = bumpCtx.createRadialGradient(x, y, 0, x, y, 80);
        dotBumpGrad.addColorStop(0, '#000000'); 
        dotBumpGrad.addColorStop(0.7, '#444444'); 
        dotBumpGrad.addColorStop(1, 'rgba(136, 136, 136, 0)');
        bumpCtx.fillStyle = dotBumpGrad;
        bumpCtx.beginPath(); bumpCtx.arc(x, y, 80, 0, Math.PI*2); bumpCtx.fill(); 
    }
    
    const c = CENTER, o = 230; 
    if ([1,3,5].includes(i)) drawDot(c, c);
    if ([2,3,4,5,6].includes(i)) { drawDot(c-o, c-o); drawDot(c+o, c+o); }
    if ([4,5,6].includes(i)) { drawDot(c-o, c+o); drawDot(c+o, c-o); }
    if (i === 6) { drawDot(c-o, c); drawDot(c+o, c); }
    
    const tex = new THREE.CanvasTexture(cvs); 
    tex.anisotropy = 16; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    const bumpTex = new THREE.CanvasTexture(bumpCvs); 
    bumpTex.anisotropy = 16; bumpTex.generateMipmaps = true; bumpTex.minFilter = THREE.LinearMipmapLinearFilter;
    
    mats.push(new THREE.MeshPhysicalMaterial({ map: tex, bumpMap: bumpTex, bumpScale: 0.05, roughness: 0.1, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.05 }));
  }
  
  return [mats[0], mats[5], mats[1], mats[4], mats[2], mats[3]]; 
};

const createGroupedRoundedBox = (size, radius, segments) => {
  try {
    const geom = new RoundedBoxGeometry(size, size, size, segments, radius);
    if (!geom.index) {
      const count = geom.attributes.position.count;
      const indices = new Uint16Array(count);
      for(let i=0; i<count; i++) indices[i] = i;
      geom.setIndex(new THREE.BufferAttribute(indices, 1));
    }
    geom.clearGroups();
    const pos = geom.attributes.position;
    const index = geom.index;
    const groups = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[] };
    for(let i=0; i < index.count; i+=3) {
        const a = index.getX(i); const b = index.getX(i+1); const c = index.getX(i+2);
        const cx = (pos.getX(a) + pos.getX(b) + pos.getX(c))/3;
        const cy = (pos.getY(a) + pos.getY(b) + pos.getY(c))/3;
        const cz = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c))/3;
        const absX = Math.abs(cx); const absY = Math.abs(cy); const absZ = Math.abs(cz);
        let faceIndex = 0;
        if (absX >= absY && absX >= absZ) faceIndex = cx > 0 ? 0 : 1;
        else if (absY >= absX && absY >= absZ) faceIndex = cy > 0 ? 2 : 3;
        else faceIndex = cz > 0 ? 4 : 5;
        groups[faceIndex].push(a, b, c);
    }
    const newIndices = []; let start = 0;
    for(let i=0; i<6; i++) {
        const g = groups[i]; newIndices.push(...g);
        geom.addGroup(start, g.length, i); start += g.length;
    }
    geom.setIndex(new THREE.BufferAttribute(new Uint16Array(newIndices), 1));
    geom.computeVertexNormals();
    return geom;
  } catch (err) {
    return new THREE.BoxGeometry(size, size, size);
  }
}

const buildTRPGGeometry = (type, radius) => {
  let geom;
  if (type === 8) geom = new THREE.OctahedronGeometry(radius).toNonIndexed();
  if (type === 12) geom = new THREE.DodecahedronGeometry(radius).toNonIndexed();
  if (type === 20) geom = new THREE.IcosahedronGeometry(radius).toNonIndexed();
  const pos = geom.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const totalTris = pos.count / 3; const trisPerFace = totalTris / type; 
  geom.clearGroups();

  for (let f = 0; f < type; f++) {
    geom.addGroup(f * trisPerFace * 3, trisPerFace * 3, f);
    const centroid = new THREE.Vector3();
    for (let t = 0; t < trisPerFace * 3; t++) centroid.add(new THREE.Vector3().fromBufferAttribute(pos, f * trisPerFace * 3 + t));
    centroid.divideScalar(trisPerFace * 3);
    const normal = centroid.clone().normalize();
    const vFirst = new THREE.Vector3().fromBufferAttribute(pos, f * trisPerFace * 3);
    let upLocal = new THREE.Vector3().subVectors(vFirst, centroid).normalize();
    let rightLocal = new THREE.Vector3().crossVectors(upLocal, normal).normalize();
    upLocal.crossVectors(normal, rightLocal).normalize();
    const projected = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < trisPerFace * 3; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, f * trisPerFace * 3 + i);
      const local = v.clone().sub(centroid);
      const x = local.dot(rightLocal); const y = local.dot(upLocal);
      projected.push({x, y});
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const scale = Math.max(maxX - minX, maxY - minY) * 1.35; 
    for (let i = 0; i < trisPerFace * 3; i++) {
      uv[(f * trisPerFace * 3 + i) * 2] = 0.5 + (projected[i].x / scale);
      uv[(f * trisPerFace * 3 + i) * 2 + 1] = 0.5 + (projected[i].y / scale);
    }
    geom.groups[f].userData = { normal: normal.clone(), upLocal: upLocal.clone() };
  }
  return geom;
};

const alignFaceToUp = (mesh, resultNum) => {
  const group = mesh.geometry.groups.find(g => g.materialIndex === (resultNum - 1));
  if (!group || !group.userData) return;
  const targetNormal = new THREE.Vector3(0, 1, 0);
  const q1 = new THREE.Quaternion().setFromUnitVectors(group.userData.normal.clone(), targetNormal);
  const faceUpWorld = group.userData.upLocal.clone().applyQuaternion(q1);
  faceUpWorld.y = 0; faceUpWorld.normalize();
  const targetFaceUp = new THREE.Vector3(0, 0, -1); 
  const q2 = new THREE.Quaternion().setFromUnitVectors(faceUpWorld, targetFaceUp);
  mesh.quaternion.copy(q2.multiply(q1));
};

const themeStyles = {
  default:   { bg: '#f8fafc', cup: 0x080808, cupR: 0.8, map: 'leatherTex', bump: 'leatherTex', bumpScale: 0.005, tray: 0x080808, felt: 0x0a8f60, metalness: 0.05, clearcoat: 0.05 }, 
  dark:      { bg: '#0b0f19', cup: 0x1e293b, cupR: 0.7, map: 'leatherTex', bump: 'leatherTex', bumpScale: 0.003, tray: 0x0f172a, felt: 0x6366f1, metalness: 0.1,  clearcoat: 0.0 }, 
  forest:    { bg: '#f4efe6', cup: 0x3d1c04, cupR: 0.4, map: 'woodTex',    bump: 'woodTex',    bumpScale: 0.015, tray: 0x3d1c04, felt: 0x2d5a27, metalness: 0.05, clearcoat: 0.3 }, 
  medieval:  { bg: '#1c1917', cup: 0x2d1a11, cupR: 0.9, map: 'leatherTex', bump: 'leatherTex', bumpScale: 0.008, tray: 0x2d1a11, felt: 0x8b1c1c, metalness: 0.0,  clearcoat: 0.0 }, 
  cyberpunk: { bg: '#05050f', cup: 0x1a1a24, cupR: 0.2, map: null,         bump: null,         bumpScale: 0.0,   tray: 0x0a0a12, felt: 0xff007f, metalness: 0.8,  clearcoat: 0.8 }  
};

const RawThreeDice = ({ count, sides, theme, rollTrigger, onRollComplete }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const state = useRef({ count, sides, theme, isAnimating: false, animProgress: 0, finalTotal: 0, finalDetails: [], hasCompleted: true, hasUpdatedDice: false, hasFadedSound: false });
  const onRollCompleteRef = useRef(onRollComplete);

  useEffect(() => { onRollCompleteRef.current = onRollComplete; }, [onRollComplete]);

  const applyLayout = useCallback((c, s) => {
    if (!sceneRef.current) return;
    const { activeDiceGroup, diceGroups, res } = sceneRef.current;
    diceGroups.forEach(g => { 
        activeDiceGroup.remove(g.pivot); 
        if (g.mesh.geometry) g.mesh.geometry.dispose(); 
        if (Array.isArray(g.mesh.material)) {
            g.mesh.material.forEach(m => { if (m.map) m.map.dispose(); if (m.bumpMap) m.bumpMap.dispose(); m.dispose(); });
        } else if (g.mesh.material) {
            g.mesh.material.dispose();
        }
    });
    sceneRef.current.diceGroups = [];

    const maxTrayRadius = 1.45; let sizeMult = 1.0;
    if (s === 20 || s === 12) sizeMult = 1.2; else if (s === 8) sizeMult = 1.1;

    const dieSize = c === 1 ? 0.9 * sizeMult : Math.max(0.15, Math.min(0.7, (maxTrayRadius * 1.15) / Math.sqrt(c))) * sizeMult;
    const yOffset = 0.11 + dieSize / 2; 
    const minDistance = s === 6 ? dieSize * 1.45 : dieSize * 1.2; 
    let layoutPositions = []; let useFallback = false;

    for (let i = 0; i < c; i++) {
      let placed = false;
      for (let attempt = 0; attempt < 2000; attempt++) {
        const r = Math.sqrt(Math.random()) * (maxTrayRadius - dieSize / 2);
        const theta = Math.random() * Math.PI * 2;
        const px = Math.cos(theta) * r; const pz = Math.sin(theta) * r;
        let overlap = false;
        for (let j = 0; j < layoutPositions.length; j++) {
          const dx = px - layoutPositions[j].x; const dz = pz - layoutPositions[j].z;
          if (Math.sqrt(dx * dx + dz * dz) < minDistance) { overlap = true; break; }
        }
        if (!overlap) { layoutPositions.push({ x: px, z: pz }); placed = true; break; }
      }
      if (!placed) { useFallback = true; break; }
    }

    if (useFallback) {
       layoutPositions = [];
       const globalAngleOffset = Math.random() * Math.PI * 2; 
       for (let i = 0; i < c; i++) {
          let finalX = 0, finalZ = 0;
          if (c > 1) {
            const r = (maxTrayRadius - dieSize / 2) * Math.sqrt((i + 0.5) / c);
            const theta = i * 2.39996323 + globalAngleOffset;
            finalX = Math.cos(theta) * r; finalZ = Math.sin(theta) * r;
          }
          layoutPositions.push({ x: finalX, z: finalZ });
       }
    }

    for (let i = 0; i < c; i++) {
      const pivotGroup = new THREE.Group();
      pivotGroup.position.set(layoutPositions[i].x, yOffset, layoutPositions[i].z);

      let geometry, mats;
      if (s === 6) {
        geometry = createGroupedRoundedBox(dieSize, dieSize * 0.18, 5); 
        mats = res.mats[6];
      } else {
        geometry = buildTRPGGeometry(s, dieSize * 0.85); 
        mats = res.mats[s];
      }

      const dieMesh = new THREE.Mesh(geometry, mats);
      dieMesh.castShadow = true; dieMesh.receiveShadow = true; 
      pivotGroup.add(dieMesh); activeDiceGroup.add(pivotGroup); sceneRef.current.diceGroups.push({ pivot: pivotGroup, mesh: dieMesh });
    }
  }, []);

  const applyTheme = useCallback((themeName) => {
    if (!sceneRef.current) return;
    const { scene, cupMat, trayBorderMat, trayFeltMat, res } = sceneRef.current;
    const style = themeStyles[themeName] || themeStyles.default;

    scene.fog.color.set(style.bg);
    cupMat.color.setHex(style.cup); cupMat.roughness = style.cupR; 
    cupMat.map = style.map ? res[style.map].map : null; cupMat.bumpMap = style.bump ? res[style.bump].bump : null; cupMat.bumpScale = style.bumpScale;
    cupMat.metalness = style.metalness; cupMat.clearcoat = style.clearcoat; cupMat.needsUpdate = true;

    trayBorderMat.color.setHex(style.tray); trayBorderMat.roughness = style.cupR;
    trayBorderMat.map = style.map ? res[style.map].map : null; trayBorderMat.bumpMap = style.bump ? res[style.bump].bump : null; trayBorderMat.bumpScale = style.bumpScale;
    trayBorderMat.metalness = style.metalness; trayBorderMat.clearcoat = style.clearcoat; trayBorderMat.needsUpdate = true;

    trayFeltMat.color.setHex(style.felt); trayFeltMat.needsUpdate = true;
  }, []);

  useEffect(() => {
    state.current.count = count; state.current.sides = sides;
    if (!state.current.isAnimating && sceneRef.current) {
      applyLayout(count, sides);
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    }
  }, [count, sides, applyLayout]);

  useEffect(() => {
    if (sceneRef.current) {
      applyTheme(theme);
      if (!state.current.isAnimating) sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    }
  }, [theme, applyTheme]);

  useEffect(() => {
    if (rollTrigger > 0 && sceneRef.current && !state.current.isAnimating) {
      state.current.isAnimating = true; state.current.animProgress = 0; state.current.hasUpdatedDice = false; state.current.hasCompleted = false; state.current.hasFadedSound = false;
      const { cup, masterGroup } = sceneRef.current;
      cup.rotation.set(0, 0, 0); cup.position.set(0, 8, 0);
      masterGroup.rotation.set(0, 0, 0); masterGroup.position.set(0, 0, 0);
    }
  }, [rollTrigger]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;
    
    currentMount.innerHTML = ''; 

    const res = {
      leatherTex: createLeatherTextures(),
      woodTex: createWoodTextures(),
      feltBump: createFeltBump(),
      mats: { 6: createPremiumD6Mats(), 8: createPremiumMats(8), 12: createPremiumMats(12), 20: createPremiumMats(20) }
    };

    const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0xf8fafc, 0.015);
    
    const width = currentMount.clientWidth || 300;
    const height = currentMount.clientHeight || 280;
    
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 7.5, 11.5); camera.lookAt(0, -0.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false); 
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    
    currentMount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 12, 6); dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048; dirLight.shadow.bias = -0.0001; 
    scene.add(dirLight);

    const pLight1 = new THREE.PointLight(0xffffff, 0.5, 20); pLight1.position.set(3, 5, 3); scene.add(pLight1);
    const pLight2 = new THREE.PointLight(0xffffff, 0.3, 20); pLight2.position.set(-3, 4, -3); scene.add(pLight2);

    const masterGroup = new THREE.Group(); scene.add(masterGroup);
    const trayGroup = new THREE.Group(); masterGroup.add(trayGroup);
    
    const trayPts = [ new THREE.Vector2(0, 0.0), new THREE.Vector2(3.0, 0.0), new THREE.Vector2(3.3, 0.3), new THREE.Vector2(3.3, 0.6), new THREE.Vector2(2.9, 0.6), new THREE.Vector2(2.7, 0.1), new THREE.Vector2(0, 0.1) ];
    const trayBorderMat = new THREE.MeshPhysicalMaterial({ color: 0x080808, roughness: 0.8, metalness: 0.05, map: res.leatherTex.map, bumpMap: res.leatherTex.bump, bumpScale: 0.005 });
    const trayBorder = new THREE.Mesh(new THREE.LatheGeometry(trayPts, 128), trayBorderMat); trayBorder.receiveShadow = true; trayBorder.castShadow = true; trayGroup.add(trayBorder);

    const trayFeltMat = new THREE.MeshPhysicalMaterial({ color: 0x0a8f60, roughness: 0.95, metalness: 0.0, bumpMap: res.feltBump, bumpScale: 0.01 });
    const trayFelt = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.65, 0.01, 128), trayFeltMat); trayFelt.position.y = 0.11; trayFelt.receiveShadow = true; trayGroup.add(trayFelt);

    const cupPts = [ new THREE.Vector2(0, 3.2), new THREE.Vector2(1.0, 3.2), new THREE.Vector2(1.6, 2.0), new THREE.Vector2(2.1, 0.4), new THREE.Vector2(2.55, 0.0), new THREE.Vector2(2.68, 0.0), new THREE.Vector2(2.4, 0.4), new THREE.Vector2(1.8, 2.0), new THREE.Vector2(1.1, 3.4), new THREE.Vector2(0.5, 3.5), new THREE.Vector2(1.0, 3.7), new THREE.Vector2(0.9, 4.0), new THREE.Vector2(0, 4.1) ];
    const cupMat = new THREE.MeshPhysicalMaterial({ color: 0x080808, roughness: 0.8, metalness: 0.05, side: THREE.DoubleSide, map: res.leatherTex.map, bumpMap: res.leatherTex.bump, bumpScale: 0.005 });
    const cup = new THREE.Mesh(new THREE.LatheGeometry(cupPts, 128), cupMat); cup.position.y = 8; cup.castShadow = true; cup.receiveShadow = true; masterGroup.add(cup);

    const activeDiceGroup = new THREE.Group(); masterGroup.add(activeDiceGroup);

    sceneRef.current = { scene, camera, renderer, cup, masterGroup, cupMat, trayBorderMat, trayFeltMat, activeDiceGroup, diceGroups: [], res };

    const updateSize = () => {
      if (!currentMount || !renderer || !camera) return;
      const { clientWidth, clientHeight } = currentMount;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      if(!state.current.isAnimating) renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(updateSize); observer.observe(currentMount);

    applyLayout(state.current.count, state.current.sides);
    applyTheme(state.current.theme);

    let animationFrameId; const clock = new THREE.Clock();
    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      const delta = Math.min(clock.getDelta(), 0.1); 

      if (state.current.isAnimating) {
        state.current.animProgress += delta;
        const t = state.current.animProgress;
        const { cup, masterGroup } = sceneRef.current;

        if (t <= 0.3) {
          cup.position.y = THREE.MathUtils.lerp(8, 0.1, Math.pow(t / 0.3, 3));
        } else if (t > 0.3 && t <= 1.3) {
          if (!state.current.hasUpdatedDice) {
            applyLayout(state.current.count, state.current.sides);
            let finalTotal = 0; let finalDetails = [];
            sceneRef.current.diceGroups.forEach(g => {
              const result = Math.floor(Math.random() * state.current.sides) + 1;
              finalTotal += result; finalDetails.push(result);
              if (state.current.sides === 6) {
                switch(result) {
                  case 1: g.mesh.rotation.set(0, 0, Math.PI/2); break;   
                  case 6: g.mesh.rotation.set(0, 0, -Math.PI/2); break;  
                  case 2: g.mesh.rotation.set(0, 0, 0); break;           
                  case 5: g.mesh.rotation.set(Math.PI, 0, 0); break;     
                  case 3: g.mesh.rotation.set(-Math.PI/2, 0, 0); break;  
                  case 4: g.mesh.rotation.set(Math.PI/2, 0, 0); break;   
                }
              } else alignFaceToUp(g.mesh, result);
              g.pivot.rotation.set(0, (Math.random() - 0.5) * Math.PI, 0);
            });
            cup.position.y = 0.1; 
            state.current.hasUpdatedDice = true;
            state.current.finalTotal = finalTotal; state.current.finalDetails = finalDetails;
          }
          const shakeT = (t - 0.3) / 1.0; 
          masterGroup.position.y = Math.abs(Math.sin(shakeT * Math.PI * 3)) * 1.5;
          masterGroup.rotation.x = Math.sin(shakeT * Math.PI * 6) * 0.05;
          masterGroup.rotation.z = Math.cos(shakeT * Math.PI * 6) * 0.03;
        } else if (t > 1.3 && t <= 1.6) {
          masterGroup.position.y = 0; masterGroup.rotation.set(0,0,0);
          if (!state.current.hasFadedSound) { fadeOutShakeSound(); state.current.hasFadedSound = true; }
        } else if (t > 1.6 && t <= 2.2) {
          const easeOut = 1 - Math.pow(1 - (t - 1.6)/0.6, 3);
          cup.position.y = THREE.MathUtils.lerp(0.1, 8, easeOut);
          cup.rotation.x = THREE.MathUtils.lerp(0, -0.2, easeOut); 
        } else if (t > 2.2) {
          state.current.isAnimating = false;
          if (!state.current.hasCompleted) {
             state.current.hasCompleted = true;
             onRollCompleteRef.current(state.current.finalTotal, state.current.finalDetails);
          }
        }
      }
      renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    };
    renderLoop();

    return () => {
      observer.disconnect(); cancelAnimationFrame(animationFrameId);
      renderer.dispose(); 
      if (currentMount && currentMount.contains(renderer.domElement)) {
          currentMount.removeChild(renderer.domElement);
      }
      currentMount.innerHTML = ''; 
    };
  }, [applyLayout, applyTheme]); 

  return <div ref={mountRef} style={{ width: '100%', height: '100%', outline: 'none', overflow: 'hidden' }} />;
};

/* ========================================================================= */
/* 📦 3D 紙箱 (使用 React Three Fiber) */
/* ========================================================================= */
const ThickBoard = ({ w, h, d, faceMat, edgeMat, position, rotation, children }) => {
  const materials = useMemo(() => {
    const mats = [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, faceMat];
    if (w === 0.05) { mats[4] = edgeMat; mats[5] = edgeMat; mats[0] = faceMat; mats[1] = faceMat; }
    if (h === 0.05) { mats[4] = edgeMat; mats[5] = edgeMat; mats[2] = faceMat; mats[3] = faceMat; }
    return mats;
  }, [w, h, d, faceMat, edgeMat])
  return <mesh position={position} rotation={rotation} castShadow receiveShadow material={materials}><boxGeometry args={[w, h, d]} />{children}</mesh>
}

function RealisticMysteryBox({ game, onComplete }) {
  const boxGroupRef = useRef(); const flapLRef = useRef(); const flapRRef = useRef(); const flapFRef = useRef(); const flapBRef = useRef(); const gameMeshRef = useRef();
  const timeRef = useRef(0); const isCompletedRef = useRef(false);
  const [cardSize, setCardSize] = useState([2.5, 3.3])
  const [useFallback, setUseFallback] = useState(false) 

  useEffect(() => { setUseFallback(false) }, [game])

  const { cardboardMat, edgeMat, tapeMat, labelMat } = useMemo(() => {
    const nCanvas = document.createElement('canvas'); nCanvas.width = 512; nCanvas.height = 512; const nCtx = nCanvas.getContext('2d');
    nCtx.fillStyle = '#cca883'; nCtx.fillRect(0, 0, 512, 512);
    for(let i=0; i<15000; i++) { nCtx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)'; nCtx.fillRect(Math.random()*512, Math.random()*512, 2, 2); }
    const cTex = new THREE.CanvasTexture(nCanvas);
    const tMat = new THREE.MeshStandardMaterial({ color: 0xe5d5bc, transparent: true, opacity: 0.7, roughness: 0.4, metalness: 0.1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
    const lCanvas = document.createElement('canvas'); lCanvas.width = 256; lCanvas.height = 256; const lCtx = lCanvas.getContext('2d');
    lCtx.fillStyle = '#ffffff'; lCtx.fillRect(0, 0, 256, 256); lCtx.fillStyle = '#0f172a';
    for(let i=0; i<28; i++) lCtx.fillRect(20 + i*7 + Math.random()*4, 30, Math.random()*4+1, 70);
    lCtx.font = 'bold 22px Arial'; lCtx.fillText('EXPRESS', 20, 130); lCtx.fillRect(20, 145, 216, 4); lCtx.font = '16px Arial'; lCtx.fillText('TO: BOARD GAMER', 20, 175);
    return { cardboardMat: new THREE.MeshStandardMaterial({ map: cTex, roughness: 0.9 }), edgeMat: new THREE.MeshStandardMaterial({ color: 0xe6cda8, roughness: 1.0 }), tapeMat: tMat, labelMat: new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(lCanvas), roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }) }
  }, [])

  const gameTexture = useMemo(() => {
    if (game && game.imageUrl && !useFallback) {
      const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous') 
      return loader.load(game.imageUrl, (loadedTex) => {
          if (loadedTex.image) {
            const aspect = loadedTex.image.width / loadedTex.image.height;
            let targetH = 3.4, targetW = targetH * aspect;
            if (targetW > 2.8) { targetW = 2.8; targetH = targetW / aspect; }
            setCardSize([targetW, targetH]);
          }
        }, undefined, () => { setUseFallback(true); }
      )
    } else {
      setCardSize([2.5, 3.3]); const gCanvas = document.createElement('canvas'); gCanvas.width = 300; gCanvas.height = 400; const gCtx = gCanvas.getContext('2d');
      gCtx.clearRect(0, 0, 300, 400); gCtx.fillStyle = '#4f46e5'; gCtx.beginPath(); gCtx.roundRect(10, 10, 280, 380, 20); gCtx.fill();
      gCtx.fillStyle = '#ffffff'; gCtx.font = 'bold 100px Arial'; gCtx.textAlign = 'center'; gCtx.fillText(game?.emoji || '🎲', 150, 180);
      gCtx.font = 'bold 32px "jf open 粉圓", sans-serif'; const name = game?.name || '神祕桌遊'; gCtx.fillText(name.length > 8 ? name.substring(0, 8) + '...' : name, 150, 280);
      return new THREE.CanvasTexture(gCanvas)
    }
  }, [game, useFallback])

  const boxW = 2.8, boxD = 1.8, boxH = 1.4, thickness = 0.05, flapLen = boxD/2, pivotY = boxH + thickness;

  useFrame((state, delta) => {
    if (isCompletedRef.current) return;
    const box = boxGroupRef.current; const fL = flapLRef.current; const fR = flapRRef.current; const fF = flapFRef.current; const fB = flapBRef.current; const gMesh = gameMeshRef.current;
    if (!box || !fL || !fR || !fF || !fB || !gMesh) return;

    timeRef.current += delta; const t = timeRef.current - 0.3; 
    if (t < 0) { box.position.y = 7; box.rotation.x = 0.1; gMesh.visible = false; return; }
    if (t <= 0.3) { const easeIn = Math.pow(t / 0.3, 3); box.position.y = THREE.MathUtils.lerp(7, 0, easeIn); box.rotation.x = THREE.MathUtils.lerp(0.1, 0, easeIn); } 
    else if (t <= 0.4) { box.position.y = 0; box.rotation.x = 0; }
    if (t > 0.4 && t <= 1.5) {
      const openAngle = Math.PI * 0.72;
      const tOut = Math.min(1, Math.max(0, (t - 0.4) / 0.5)); const easeOut = 1 - Math.pow(1 - tOut, 3); 
      fF.rotation.x = THREE.MathUtils.lerp(0, openAngle, easeOut); fB.rotation.x = THREE.MathUtils.lerp(0, -openAngle, easeOut);
      const tIn = Math.min(1, Math.max(0, (t - 0.6) / 0.5)); const easeInFlap = 1 - Math.pow(1 - tIn, 3);
      fL.rotation.z = THREE.MathUtils.lerp(0, openAngle, easeInFlap); fR.rotation.z = THREE.MathUtils.lerp(0, -openAngle, easeInFlap);
    }
    if (t > 0.8 && t <= 2.2) {
      gMesh.visible = true; const actTime = Math.min(1, Math.max(0, (t - 0.8) / 1.2)); 
      if (actTime <= 0.35) { 
        const liftEase = 1 - Math.pow(1 - (actTime / 0.35), 2); 
        gMesh.position.y = THREE.MathUtils.lerp(0.5, 4.2, liftEase); gMesh.position.z = 0; gMesh.scale.setScalar(THREE.MathUtils.lerp(0.1, 0.75, liftEase)); gMesh.rotation.x = THREE.MathUtils.lerp(0, -0.15, liftEase);
      } else { 
        const placeProgress = (actTime - 0.35) / 0.65; const placeEase = placeProgress < 0.5 ? 4 * Math.pow(placeProgress, 3) : 1 - Math.pow(-2 * placeProgress + 2, 3) / 2;
        gMesh.position.y = THREE.MathUtils.lerp(4.2, 2.5, placeEase); gMesh.position.z = THREE.MathUtils.lerp(0, 4.5, placeEase); gMesh.scale.setScalar(THREE.MathUtils.lerp(0.75, 1.25, placeEase)); gMesh.rotation.x = THREE.MathUtils.lerp(-0.15, 0, placeEase);
      }
    }
    if (t > 2.0 && t <= 2.8) {
      const exitTime = Math.min(1, (t - 2.0) / 0.6); box.position.y = THREE.MathUtils.lerp(0, -8, exitTime * exitTime);
      if (t > 2.2 && !isCompletedRef.current) { isCompletedRef.current = true; onComplete(); }
    }
  })

  return (
    <group>
      <group ref={boxGroupRef} position={[0, 7, 0]} rotation={[0.1, 0, 0]}>
        <ThickBoard w={boxW} h={thickness} d={boxD} faceMat={cardboardMat} edgeMat={edgeMat} position={[0, thickness/2, 0]} />
        <ThickBoard w={boxW} h={boxH} d={thickness} faceMat={cardboardMat} edgeMat={edgeMat} position={[0, boxH/2 + thickness, boxD/2 - thickness/2]} />
        <ThickBoard w={boxW} h={boxH} d={thickness} faceMat={cardboardMat} edgeMat={edgeMat} position={[0, boxH/2 + thickness, -boxD/2 + thickness/2]} />
        <ThickBoard w={thickness} h={boxH} d={boxD - thickness*2} faceMat={cardboardMat} edgeMat={edgeMat} position={[-boxW/2 + thickness/2, boxH/2 + thickness, 0]} />
        <ThickBoard w={thickness} h={boxH} d={boxD - thickness*2} faceMat={cardboardMat} edgeMat={edgeMat} position={[boxW/2 - thickness/2, boxH/2 + thickness, 0]} />
        <mesh position={[0, thickness + 0.1, 0]}><boxGeometry args={[boxW - 0.25, 0.1, boxD - 0.25]} /><meshStandardMaterial color={0x111111} /></mesh>
        <group ref={flapLRef} position={[-boxW/2 + thickness/2, pivotY - 0.005, 0]}><ThickBoard w={flapLen} h={thickness} d={boxD - thickness*2} faceMat={cardboardMat} edgeMat={edgeMat} position={[flapLen/2, thickness/2, 0]} /></group>
        <group ref={flapRRef} position={[boxW/2 - thickness/2, pivotY - 0.005, 0]}><ThickBoard w={flapLen} h={thickness} d={boxD - thickness*2} faceMat={cardboardMat} edgeMat={edgeMat} position={[-flapLen/2, thickness/2, 0]} /></group>
        <group ref={flapFRef} position={[0, pivotY, boxD/2 - thickness/2]}>
          <ThickBoard w={boxW} h={thickness} d={flapLen} faceMat={cardboardMat} edgeMat={edgeMat} position={[0, thickness/2, -flapLen/2]} />
          <mesh material={tapeMat} rotation={[-Math.PI/2, 0, 0]} position={[0, thickness + 0.002, -flapLen + 0.16/2]}><planeGeometry args={[boxW, 0.32/2]} /></mesh>
          <mesh material={labelMat} rotation={[-Math.PI/2, 0, 0]} position={[-0.6, thickness + 0.003, -flapLen/2]}><planeGeometry args={[0.8, 0.6]} /></mesh>
        </group>
        <group ref={flapBRef} position={[0, pivotY, -boxD/2 + thickness/2]}>
          <ThickBoard w={boxW} h={thickness} d={flapLen} faceMat={cardboardMat} edgeMat={edgeMat} position={[0, thickness/2, flapLen/2]} />
          <mesh material={tapeMat} rotation={[-Math.PI/2, 0, 0]} position={[0, thickness + 0.002, flapLen - 0.16/2]}><planeGeometry args={[boxW, 0.32/2]} /></mesh>
        </group>
        <mesh material={tapeMat} position={[-boxW/2 - 0.001, pivotY - 0.25, 0]} rotation={[0, -Math.PI/2, 0]}><planeGeometry args={[0.32, 0.5]} /></mesh>
        <mesh material={tapeMat} position={[boxW/2 + 0.001, pivotY - 0.25, 0]} rotation={[0, Math.PI/2, 0]}><planeGeometry args={[0.32, 0.5]} /></mesh>
      </group>
      <mesh ref={gameMeshRef} position={[0, 0, 0]} visible={false}>
        <planeGeometry args={[cardSize[0], cardSize[1]]} />
        <meshBasicMaterial map={gameTexture} transparent={true} side={THREE.DoubleSide} color="#ffffff" />
      </mesh>
    </group>
  )
}

const getDynamicTitleSize = (name) => {
  if (!name) return '1.7rem'; const len = name.length;
  if (len >= 16) return '1.15rem'; if (len >= 12) return '1.35rem'; if (len >= 8) return '1.5rem';
  return '1.7rem';
}

/* ========================================================================= */
/* 主要 App 元件                                                             */
/* ========================================================================= */
export default function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')
  const [playerFilter, setPlayerFilter] = useState('all')
  const [bestPlayerFilter, setBestPlayerFilter] = useState('all')
  const [maxTimeFilter, setMaxTimeFilter] = useState('all')
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('app_sort_by') || 'rating-desc')
  const [expansionFilter, setExpansionFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('collection')
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('app_view_mode') || 'grid')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const filterRowRef = useRef(null)
  const [isUploadingImg, setIsUploadingImg] = useState(false)
  const [playerGroups, setPlayerGroups] = useState(() => { try { return JSON.parse(localStorage.getItem('app_player_groups')) || [] } catch(e){ return [] } })
  const [newGroupName, setNewGroupName] = useState('')
  const [quickPickPlayers, setQuickPickPlayers] = useState('all')
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'default')
  const [favorites, setFavorites] = useState(() => { try { const saved = localStorage.getItem('bg_favorite_ids'); if (saved) return JSON.parse(saved) } catch (e) {} return [] })
  const [sleeveList, setSleeveList] = useState([{ size: '63.5x88 mm', count: '' }])
  
  // 🌟 新功能：過濾出 14 天內新加入的桌遊
  const [showOnlyNew, setShowOnlyNew] = useState(false)
  
  const [widgetTab, setWidgetTab] = useState('starter')
  const [sharedPlayers, setSharedPlayers] = useState(() => { try { const saved = localStorage.getItem('bg_shared_players'); if (saved) return JSON.parse(saved) } catch (e) {} return [{ id: 1, name: '玩家 1', score: 0 }, { id: 2, name: '玩家 2', score: 0 }, { id: 3, name: '玩家 3', score: 0 }, { id: 4, name: '玩家 4', score: 0 }] })
  const [roundCount, setRoundCount] = useState(1)
  const [editingScoreId, setEditingScoreId] = useState(null)
  const [tempScoreVal, setTempScoreVal] = useState('')
  const [initialTimerDuration, setInitialTimerDuration] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [diceToolTab, setDiceToolTab] = useState('dice')
  
  // 🌟 3D Dice States
  const [diceCount, setDiceCount] = useState(1) 
  const [diceSides, setDiceSides] = useState(6)
  const [diceResults, setDiceResults] = useState([6]) 
  const [isRollingDice, setIsRollingDice] = useState(false)
  const [rollTrigger, setRollTrigger] = useState(0)
  
  const [coinSide, setCoinSide] = useState('👑 正面')
  const [isFlippingCoin, setIsFlippingCoin] = useState(false)
  const [coinDegreeX, setCoinDegreeX] = useState(0) 
  const [targetTeamCount, setTargetTeamCount] = useState(2)
  const [assignedTeams, setAssignedTeams] = useState([])
  const [isShufflingTeams, setIsShufflingTeams] = useState(false)
  const [inputPlayerName, setInputPlayerName] = useState('')
  const [starterWinner, setStarterWinner] = useState(null)
  const [isPickingStarter, setIsPickingStarter] = useState(false)

  const [randomGame, setRandomGame] = useState(null) 
  const [finalGame, setFinalGame] = useState(null)   
  const [isRevealed, setIsRevealed] = useState(false)
  const [showFinalUI, setShowFinalUI] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false) 
  const [drawKey, setDrawKey] = useState(0) 

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [parentSearchInput, setParentSearchInput] = useState('')
  const [viewDetailGame, setViewDetailGame] = useState(null)
  const [detailTab, setDetailTab] = useState('info')
  const fileInputRef = useRef(null)

  // ===================== Effects =====================
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (activeDropdown) setActiveDropdown(null)
        else if (showModal) setShowModal(false)
        else if (viewDetailGame) setViewDetailGame(null)
        else if (isRevealed) { setIsRevealed(false); setIsShuffling(false); }
      }
    }
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeDropdown, showModal, viewDetailGame, isRevealed])

  useEffect(() => { function handleClickOutside(e) { if (filterRowRef.current && !filterRowRef.current.contains(e.target)) setActiveDropdown(null) }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside) }, [])
  useEffect(() => { document.body.className = ''; if (theme !== 'default') document.body.classList.add(`theme-${theme}`); localStorage.setItem('app_theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('app_sort_by', sortBy) }, [sortBy])
  useEffect(() => { localStorage.setItem('app_view_mode', viewMode) }, [viewMode])
  useEffect(() => { localStorage.setItem('app_player_groups', JSON.stringify(playerGroups)) }, [playerGroups])
  useEffect(() => { try { localStorage.setItem('bg_favorite_ids', JSON.stringify(favorites)) } catch (e) {} }, [favorites])
  useEffect(() => { try { localStorage.setItem('bg_shared_players', JSON.stringify(sharedPlayers)) } catch (e) {} }, [sharedPlayers])
  
  useEffect(() => { fetchGamesFromSupabase() }, [])
  useEffect(() => {
    let interval = null
    if (timerRunning && timeLeft > 0) { interval = setInterval(() => { setTimeLeft(prev => prev - 1) }, 1000) } 
    else if (timeLeft === 0 && timerRunning) { setTimerRunning(false); playSound('alarm'); triggerHaptic('heavy') }
    return () => clearInterval(interval)
  }, [timerRunning, timeLeft])

  // ===================== Functions =====================
  async function fetchGamesFromSupabase() {
    const cachedGames = localStorage.getItem('bg_games_cache')
    if (cachedGames) { try { const parsedData = JSON.parse(cachedGames); if (parsedData && parsedData.length > 0 && parsedData[0].name !== '地城無雙 Dungeon Mayhem') { setGames(parsedData); setLoading(false) } else { setLoading(true) } } catch (e) { setLoading(true) } } else { setLoading(true) }
    const { data, error } = await supabase.from('boardgames').select('*').order('id', { ascending: false })
    if (error) { alert('⚠️ 資料庫連線失敗：\n' + error.message + '\n\n(您的遊戲仍安全存於資料庫中。)'); if (!cachedGames || JSON.parse(cachedGames).length === 0) setGames(initialGames); setLoading(false) } 
    else if (data) { if (data.length > 0) { setGames(data); localStorage.setItem('bg_games_cache', JSON.stringify(data)) } else { setGames(initialGames) }; setLoading(false) }
  }

  function triggerHaptic(type = 'light') { if (typeof window !== 'undefined' && 'vibrate' in navigator) { try { if (type === 'light') navigator.vibrate(12); else if (type === 'medium') navigator.vibrate([20, 30, 20]); else if (type === 'heavy') navigator.vibrate([40, 50, 100]) } catch (e) {} } }
  function playSound(type) {
    if (!soundEnabled) return; try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)(); const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime
      if (type === 'coin') { osc.type = 'sine'; osc.frequency.setValueAtTime(900, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2); gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2); osc.start(now); osc.stop(now + 0.2) } 
      else if (type === 'victory') { osc.type = 'triangle'; osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.12); osc.frequency.setValueAtTime(783.99, now + 0.24); osc.frequency.setValueAtTime(1046.50, now + 0.36); gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6); osc.start(now); osc.stop(now + 0.6) } 
      else if (type === 'alarm') { osc.type = 'sine'; osc.frequency.setValueAtTime(880, now); osc.frequency.exponentialRampToValueAtTime(440, now + 0.6); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6); osc.start(now); osc.stop(now + 0.6) }
    } catch (e) {}
  }

  const isBestPlayerMatch = (bestStr, targetNum) => { if (!bestStr) return false; const cleanStr = String(bestStr).replace(/人/g, '').trim(); if (cleanStr.includes('-')) { const [minStr, maxStr] = cleanStr.split('-'); return targetNum >= parseInt(minStr, 10) && targetNum <= parseInt(maxStr, 10) } return parseInt(cleanStr, 10) === targetNum }
  const categories = useMemo(() => { const base = ['派對', '陣營', '吹牛', '合作', '策略', '輕策略', '卡牌對戰']; const catSet = new Set(base); games.forEach(g => { if (g.category) catSet.add(g.category.trim()) }); return ['全部', ...Array.from(catSet)] }, [games])
  
  const filteredGames = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return games.filter((game) => {
      const matchSearch = keyword === '' || (game.name && game.name.toLowerCase().includes(keyword)) || (game.englishName && game.englishName.toLowerCase().includes(keyword))
      const matchCat = category === 'all' || category === '全部' || game.category === category
      let matchP = true; if (playerFilter !== 'all') { const p = parseInt(playerFilter, 10); matchP = p >= (game.minPlayers || 1) && p <= (game.maxPlayers || 99) }
      let matchBest = true; if (bestPlayerFilter !== 'all') matchBest = isBestPlayerMatch(game.bestPlayers, parseInt(bestPlayerFilter, 10))
      let matchTime = true; if (maxTimeFilter !== 'all') matchTime = (game.time || 0) <= parseInt(maxTimeFilter, 10)
      let matchExp = true; if (expansionFilter === 'main') matchExp = !game.isExpansion; else if (expansionFilter === 'expansion') matchExp = !!game.isExpansion; else if (expansionFilter === 'favorite') matchExp = favorites.includes(game.id)
      
      // ✨ 判斷是否開啟「僅顯示新入庫」過濾
      let matchNew = true; if (showOnlyNew) matchNew = isNewGame(game.created_at);
      
      return matchSearch && matchCat && matchP && matchBest && matchTime && matchExp && matchNew
    }).sort((a, b) => {
      if (sortBy === 'rating-desc') return (b.rating || -1) - (a.rating || -1); if (sortBy === 'time-asc') return (a.time || 0) - (b.time || 0); if (sortBy === 'time-desc') return (b.time || 0) - (a.time || 0); if (sortBy === 'complexity-desc') return (b.complexity || -1) - (a.complexity || -1); if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '', 'zh-Hant'); return 0
    })
  }, [games, search, category, playerFilter, bestPlayerFilter, maxTimeFilter, sortBy, expansionFilter, favorites, showOnlyNew])
  
  const availableRandomPoolCount = useMemo(() => { let pool = filteredGames.length > 0 ? filteredGames : games; if (quickPickPlayers !== 'all') { const p = parseInt(quickPickPlayers, 10); pool = pool.filter(g => p >= (g.minPlayers || 1) && p <= (g.maxPlayers || 99)) } return pool.length }, [filteredGames, games, quickPickPlayers])
  const totalCount = games.length; const mainCount = games.filter(g => !g.isExpansion).length; const expansionCount = games.filter(g => g.isExpansion).length; const favoriteCount = games.filter(g => favorites.includes(g.id)).length
  
  // 計算新入庫桌遊數量
  const newGamesCount = useMemo(() => games.filter(g => isNewGame(g.created_at)).length, [games])

  function toggleFavorite(e, gameId) { e.stopPropagation(); triggerHaptic('light'); setFavorites(prev => prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]) }
  function addSleeveRow() { setSleeveList([...sleeveList, { size: '63.5x88 mm', count: '' }]) }
  function removeSleeveRow(idx) { setSleeveList(sleeveList.filter((_, i) => i !== idx)) }
  function updateSleeveRow(idx, field, value) { const next = [...sleeveList]; next[idx][field] = value; setSleeveList(next) }
  function handleClearFavorites() { triggerHaptic('medium'); if (window.confirm('確定要清除所有加入最愛的桌遊嗎？')) setFavorites([]) }
  function handleResetPlayersData() { triggerHaptic('medium'); if (window.confirm('確定要將玩家名單重置為預設，並將所有分數歸零嗎？')) { setSharedPlayers([{ id: 1, name: '玩家 1', score: 0 }, { id: 2, name: '玩家 2', score: 0 }, { id: 3, name: '玩家 3', score: 0 }, { id: 4, name: '玩家 4', score: 0 }]); setRoundCount(1) } }
  function handleSavePlayerGroup() { if (!newGroupName.trim()) { alert('請輸入群組名稱！'); return }; triggerHaptic('light'); const newGroup = { name: newGroupName.trim(), players: sharedPlayers }; setPlayerGroups([...playerGroups.filter(g => g.name !== newGroup.name), newGroup]); setNewGroupName('') }
  function handleLoadPlayerGroup(group) { triggerHaptic('medium'); if (window.confirm(`確定要載入「${group.name}」？這將覆蓋目前大廳的玩家與分數。`)) { setSharedPlayers(group.players); setRoundCount(1) } }
  function handleDeletePlayerGroup(groupName) { triggerHaptic('light'); if (window.confirm(`確定要刪除「${groupName}」這個群組嗎？`)) { setPlayerGroups(playerGroups.filter(g => g.name !== groupName)) } }
  function handleExportJSON() { const cleanGames = games.map(g => ({ ...g, imageUrl: g.imageUrl && g.imageUrl.startsWith('data:') ? '' : (g.imageUrl || '') })); const jsonString = JSON.stringify(cleanGames, null, 2); const blob = new Blob([jsonString], { type: 'application/json' }); const url = URL.createObjectURL(blob); const downloadAnchor = document.createElement('a'); downloadAnchor.href = url; downloadAnchor.download = `boardgames_export_${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(downloadAnchor); downloadAnchor.click(); document.body.removeChild(downloadAnchor); URL.revokeObjectURL(url) }
  function handleImportJSON(e) { const file = e.target.files && e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (event) => { try { const importedData = JSON.parse(event.target.result); if (!Array.isArray(importedData)) return alert('❌ 檔案格式不正確！'); if (!window.confirm(`確定要將 ${importedData.length} 款桌遊同步到資料庫嗎？`)) return; const { data: dbGames, error: fetchErr } = await supabase.from('boardgames').select('*'); if (fetchErr) throw new Error('讀取失敗：' + fetchErr.message); const dbMap = new Map(); (dbGames || []).forEach(g => { if (g.name) dbMap.set(g.name.trim(), g) }); const toInsert = []; const toUpdate = []; importedData.forEach(item => { if (!item.name || !item.name.trim()) return; const cleanName = item.name.trim(); const existing = dbMap.get(cleanName); let finalImage = (item.imageUrl && item.imageUrl.trim()) || ''; if (!finalImage && existing && existing.imageUrl) finalImage = existing.imageUrl; const payload = { name: cleanName, englishName: item.englishName || '', minPlayers: parseInt(item.minPlayers, 10) || 1, maxPlayers: parseInt(item.maxPlayers, 10) || 4, bestPlayers: item.bestPlayers ? String(item.bestPlayers) : `${item.minPlayers || 1}-${item.maxPlayers || 4}`, time: parseInt(item.time, 10) || 30, category: item.category || '未分類', rating: item.rating ? parseFloat(item.rating) : null, complexity: item.complexity ? parseFloat(item.complexity) : null, emoji: item.emoji || '🎲', imageUrl: finalImage, tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()) : []), description: item.description || '', cheatSheet: item.cheatSheet || '', videoUrl: item.videoUrl || '', bggUrl: item.bggUrl || '', sleeveSize: item.sleeveSize || '', isExpansion: !!item.isExpansion, isSequel: !!item.isSequel, parentId: item.parentId ? parseInt(item.parentId, 10) : null }; if (existing) toUpdate.push({ id: existing.id, ...payload }); else toInsert.push(payload) }); for (const item of toUpdate) { const { id, ...data } = item; await supabase.from('boardgames').update(data).eq('id', id) } if (toInsert.length > 0) { const { error: insErr } = await supabase.from('boardgames').insert(toInsert); if (insErr) throw insErr } alert(`✅ 同步完成！更新 ${toUpdate.length} 款，新增 ${toInsert.length} 款`); fetchGamesFromSupabase() } catch (err) { alert('❌ 匯入同步失敗：' + err.message) } }; reader.readAsText(file); e.target.value = '' }
  async function handleCroppedImageUpload(e) { const file = e.target.files && e.target.files[0]; if (!file) return; setIsUploadingImg(true); const reader = new FileReader(); reader.onload = (event) => { const img = new Image(); img.src = event.target.result; img.onload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const maxSize = 600; let width = img.width, height = img.height; if (width > height) { if (width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize } } else { if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize } } canvas.width = width; canvas.height = height; ctx.clearRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height); canvas.toBlob(async (blob) => { try { const fileName = `cover_${Date.now()}_${Math.floor(Math.random()*1000)}.png`; const { error } = await supabase.storage.from('boardgame-covers').upload(fileName, blob, { contentType: 'image/png', cacheControl: '3600', upsert: false }); if (error) throw error; const { data } = supabase.storage.from('boardgame-covers').getPublicUrl(fileName); setFormData(prev => ({ ...prev, imageUrl: data.publicUrl })) } catch (err) { alert('❌ 圖片上傳失敗：' + err.message) } finally { setIsUploadingImg(false) } }, 'image/png', 0.85) } }; reader.readAsDataURL(file) }
  function handleAddSharedPlayer(e) { if (e) e.preventDefault(); triggerHaptic('light'); const name = inputPlayerName.trim(); if (!name) return; if (sharedPlayers.some(p => p.name === name)) return alert('玩家已存在！'); const newId = sharedPlayers.length > 0 ? Math.max(...sharedPlayers.map(p => p.id)) + 1 : 1; setSharedPlayers([...sharedPlayers, { id: newId, name, score: 0 }]); setInputPlayerName('') }
  function handleQuickAddPlayer() { triggerHaptic('light'); const newId = sharedPlayers.length > 0 ? Math.max(...sharedPlayers.map(p => p.id)) + 1 : 1; setSharedPlayers([...sharedPlayers, { id: newId, name: `玩家 ${newId}`, score: 0 }]) }
  function handleRemoveSharedPlayer(idToRemove) { triggerHaptic('light'); if (sharedPlayers.length <= 1) return alert('至少保留 1 位玩家！'); setSharedPlayers(sharedPlayers.filter(p => p.id !== idToRemove)) }
  function pickStarterPlayer() { if (sharedPlayers.length < 2) return alert('請至少加入 2 位玩家！'); setIsPickingStarter(true); setStarterWinner(null); triggerHaptic('medium'); let count = 0; const interval = setInterval(() => { setStarterWinner(sharedPlayers[Math.floor(Math.random() * sharedPlayers.length)].name); playSound('flip'); count++; if (count >= 18) { clearInterval(interval); setIsPickingStarter(false); playSound('victory'); triggerHaptic('heavy') } }, 75) }
  function changeScore(id, delta) { triggerHaptic('light'); setSharedPlayers(sharedPlayers.map(p => p.id === id ? { ...p, score: p.score + delta } : p)) }
  function handleSortPlayersByScore() { triggerHaptic('medium'); setSharedPlayers([...sharedPlayers].sort((a, b) => b.score - a.score)) }
  function handleSaveDirectScore(id) { const val = parseInt(tempScoreVal, 10); if (!isNaN(val)) setSharedPlayers(sharedPlayers.map(p => p.id === id ? { ...p, score: val } : p)); setEditingScoreId(null) }
  function resetAllScores(val = 0) { triggerHaptic('medium'); setSharedPlayers(sharedPlayers.map(p => ({ ...p, score: val }))) }
  const maxScore = useMemo(() => sharedPlayers.length === 0 ? 0 : Math.max(...sharedPlayers.map(p => p.score)), [sharedPlayers])
  function setTimerPreset(seconds) { triggerHaptic('light'); setTimerRunning(false); setInitialTimerDuration(seconds); setTimeLeft(seconds) }
  function toggleTimer() { triggerHaptic('medium'); if (timeLeft === 0) setTimeLeft(initialTimerDuration); setTimerRunning(!timerRunning) }
  function resetTimer() { triggerHaptic('light'); setTimerRunning(false); setTimeLeft(initialTimerDuration) }
  
  // 🌟 3D Dice Logic
  const handlePrevSide = () => { const idx = AVAILABLE_DICE_SIDES.indexOf(diceSides); if (idx > 0) setDiceSides(AVAILABLE_DICE_SIDES[idx - 1]); }
  const handleNextSide = () => { const idx = AVAILABLE_DICE_SIDES.indexOf(diceSides); if (idx < AVAILABLE_DICE_SIDES.length - 1) setDiceSides(AVAILABLE_DICE_SIDES[idx + 1]); }
  
  function executeCustomRoll() { 
    if (diceCount <= 0 || diceSides < 6) return alert('數量必須大於0，面數必須大於1'); 
    setIsRollingDice(true); setDiceResults(Array(diceCount).fill('?')); setRollTrigger(prev => prev + 1); 
    
    if (soundEnabled) playShakeSound();
    triggerHaptic('medium'); 
  }
  
  function flipCoin() { if (isFlippingCoin) return; setIsFlippingCoin(true); playSound('coin'); triggerHaptic('medium'); const isHead = Math.random() < 0.5; const targetDegree = coinDegreeX + 1800 + (isHead ? 0 : 180) - (coinDegreeX % 360); setCoinDegreeX(targetDegree); setTimeout(() => { setCoinSide(isHead ? '👑 正面（金）' : '🪙 反面（銀）'); setIsFlippingCoin(false); triggerHaptic('light') }, 1500) }
  function handleSplitTeams(numTeams = targetTeamCount) { triggerHaptic('medium'); if (sharedPlayers.length < numTeams) return alert(`至少需要 ${numTeams} 位玩家！`); setIsShufflingTeams(true); const shuffled = [...sharedPlayers].sort(() => Math.random() - 0.5); const buckets = Array.from({ length: numTeams }, () => []); shuffled.forEach((player, idx) => buckets[idx % numTeams].push(player)); setTimeout(() => { setAssignedTeams(buckets); setIsShufflingTeams(false); playSound('victory'); triggerHaptic('heavy') }, 280) }

  function chooseRandomWithAnimation() {
    if (isShuffling) return; 
    let pool = filteredGames.length > 0 ? filteredGames : games; if (quickPickPlayers !== 'all') { const p = parseInt(quickPickPlayers, 10); pool = pool.filter(g => p >= (g.minPlayers || 1) && p <= (g.maxPlayers || 99)) }
    if (pool.length === 0) return alert(`⚠️ 目前沒有適合的桌遊可抽取！`)
    if (pool.length > 1 && randomGame) { pool = pool.filter(g => g.id !== randomGame.id) }
    setIsShuffling(true); const nextGame = pool[Math.floor(Math.random() * pool.length)]; setIsRevealed(true); setShowFinalUI(false); setRandomGame(nextGame); setDrawKey(prev => prev + 1); triggerHaptic('medium')
  }
  function handleRandomComplete() { setFinalGame(randomGame); setShowFinalUI(true); setIsShuffling(false); playSound('victory'); triggerHaptic('heavy') }

  function handleAdminToggle() { triggerHaptic('light'); if (isAdmin) { setIsAdmin(false); return alert('🔒 已退出管理模式！') }; const inputPass = prompt('🔑 請輸入管理者密碼：'); if (inputPass === ADMIN_PASSWORD) { setIsAdmin(true); alert('🔓 驗證成功！') } else if (inputPass !== null) alert('❌ 密碼錯誤！') }
  function handleOpenAddModal() { if (!isAdmin) return; triggerHaptic('light'); setEditingId(null); setFormData(emptyForm); setSleeveList([{ size: '63.5x88 mm', count: '' }]); setParentSearchInput(''); setShowModal(true) }
  function handleOpenEditModal(game) {
    if (!isAdmin) return; triggerHaptic('light'); setEditingId(game.id); let gType = 'main'; if (game.isExpansion) gType = 'expansion'; else if (game.isSequel) gType = 'sequel'; const parentGame = games.find(g => g.id === game.parentId)
    if (game.sleeveSize) { const parsed = game.sleeveSize.split(',').map(s => { const item = s.trim(); const countMatch = item.match(/\((.*?)\)/); const sizeOnly = item.replace(/\s*\(.*?\)/, '').trim(); return { size: sizeOnly || '63.5x88 mm', count: countMatch ? countMatch[1].replace('張', '') : '' } }); setSleeveList(parsed.length > 0 ? parsed : [{ size: '63.5x88 mm', count: '' }]) } else { setSleeveList([{ size: '63.5x88 mm', count: '' }]) }
    setFormData({ name: game.name || '', englishName: game.englishName || '', minPlayers: game.minPlayers || 2, maxPlayers: game.maxPlayers || 4, bestPlayers: game.bestPlayers || '', time: game.time || 30, category: game.category || '派對', rating: game.rating != null ? String(game.rating) : '', complexity: game.complexity != null ? String(game.complexity) : '', emoji: game.emoji || '🎲', imageUrl: game.imageUrl || '', tagsInput: Array.isArray(game.tags) ? game.tags.join(', ') : '', description: game.description || '', cheatSheet: game.cheatSheet || '', videoUrl: game.videoUrl || '', bggUrl: game.bggUrl || '', gameType: gType, parentId: game.parentId || '' }); setParentSearchInput(parentGame ? parentGame.name : ''); setShowModal(true)
  }
  async function handleSubmitForm(e) {
    e.preventDefault(); triggerHaptic('medium'); if (!formData.name.trim()) return alert('請填寫名稱！')
    const formattedSleeve = sleeveList.filter(s => s.size && s.size !== '').map(s => s.count ? `${s.size} (${s.count}張)` : s.size).join(', '); const tagsArray = formData.tagsInput.split(',').map(t => t.trim()).filter(t => t !== ''); const isExpansion = formData.gameType === 'expansion'; const isSequel = formData.gameType === 'sequel'; const parsedRating = formData.rating.trim() !== '' ? parseFloat(formData.rating) : null; const parsedComplexity = formData.complexity.trim() !== '' ? parseFloat(formData.complexity) : null
    const gamePayload = { name: formData.name, englishName: formData.englishName, minPlayers: parseInt(formData.minPlayers, 10) || 1, maxPlayers: parseInt(formData.maxPlayers, 10) || 4, bestPlayers: formData.bestPlayers.trim() || `${formData.minPlayers}-${formData.maxPlayers}`, time: parseInt(formData.time, 10) || 30, category: formData.category.trim() || '未分類', rating: parsedRating != null && !isNaN(parsedRating) ? parsedRating : null, complexity: parsedComplexity != null && !isNaN(parsedComplexity) ? parsedComplexity : null, emoji: formData.emoji, imageUrl: formData.imageUrl, tags: tagsArray, description: formData.description, cheatSheet: formData.cheatSheet, videoUrl: formData.videoUrl, bggUrl: formData.bggUrl, isExpansion, isSequel, parentId: (isExpansion || isSequel) ? (parseInt(formData.parentId, 10) || null) : null, sleeveSize: formattedSleeve }
    if (editingId) { const { error } = await supabase.from('boardgames').update(gamePayload).eq('id', editingId); if (error) alert('更新失敗：' + error.message); else { setGames(games.map(g => g.id === editingId ? { ...g, ...gamePayload } : g)); if (viewDetailGame && viewDetailGame.id === editingId) setViewDetailGame({ ...viewDetailGame, ...gamePayload }); setShowModal(false) } } 
    else { const { data, error } = await supabase.from('boardgames').insert([gamePayload]).select(); if (error) alert('新增失敗：' + error.message); else { setGames([data[0], ...games]); setShowModal(false) } }
  }
  async function handleDeleteGame(id, name) { if (!isAdmin) return; triggerHaptic('medium'); if (window.confirm(`確定要刪除「${name}」嗎？`)) { const { error } = await supabase.from('boardgames').delete().eq('id', id); if (error) alert('刪除失敗：' + error.message); else { setGames(games.filter(g => g.id !== id)); if (viewDetailGame && viewDetailGame.id === id) setViewDetailGame(null) } } }

  const timerRadius = 78; const timerCircumference = 2 * Math.PI * timerRadius; const timerProgress = initialTimerDuration > 0 ? (timeLeft / initialTimerDuration) : 0; const timerDashoffset = timerCircumference - (timerProgress * timerCircumference)
  const currentPlayerLabel = useMemo(() => { const f = PLAYER_OPTIONS.find(o => o.key === playerFilter); return f ? f.label : '不限' }, [playerFilter])
  const currentBestLabel = useMemo(() => { const f = BEST_PLAYER_OPTIONS.find(o => o.key === bestPlayerFilter); return f ? f.label : '不限' }, [bestPlayerFilter])
  const currentTimeLabel = useMemo(() => { const f = TIME_OPTIONS.find(o => o.key === maxTimeFilter); return f ? f.label : '不限' }, [maxTimeFilter])
  const currentSortLabel = useMemo(() => { const f = SORT_OPTIONS.find(o => o.key === sortBy); return f ? f.label : '⭐ 評分最高' }, [sortBy])

  // ===================== UI Component Renders =====================

  const renderHeader = () => (
    <header className="header">
      <div className="logo"><span>🎲</span><div><strong>我的桌遊收藏庫</strong><small>BOARD GAME COLLECTION</small></div></div>
      <div className="header-actions">
        <select className="theme-selector" value={theme} onChange={(e) => { triggerHaptic('light'); setTheme(e.target.value); }}>
          <option value="default">☀️ 淺色簡約</option><option value="dark">🌙 柔和暗黑</option><option value="forest">🌲 森之木質</option><option value="medieval">🏰 中古世紀</option><option value="cyberpunk">🌌 賽博龐克</option>
        </select>
        <button type="button" className="action-btn" onClick={() => { triggerHaptic('light'); setSoundEnabled(!soundEnabled); }} title="聚會音效">{soundEnabled ? '🔊 聲音開' : '🔇 靜音'}</button>
        {isAdmin && (<><input type="file" accept=".json,application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportJSON} /><button type="button" className="action-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>📥 匯入 JSON</button></>)}
        <button type="button" className="action-btn" onClick={handleExportJSON}>📤 匯出 JSON</button>
        <button type="button" className="action-btn" onClick={handleAdminToggle} style={{ backgroundColor: isAdmin ? '#EF4444' : 'var(--accent-blue)', color: '#fff', border: 'none', fontWeight: 'bold' }}>{isAdmin ? '🔒 登出管理' : '🔑 站長登入'}</button>
        {isAdmin && (<button type="button" className="add-game-btn" onClick={handleOpenAddModal}>➕ 新增桌遊</button>)}
      </div>
    </header>
  )

  const renderMobileSettings = () => (
    <div className="mobile-section-settings" style={{ display: 'none' }}>
      <div className="settings-dashboard-container">
        <div className={`status-banner ${isAdmin ? 'admin' : 'visitor'}`}>
          <div className="status-info"><span className="status-avatar">{isAdmin ? '👑' : '👤'}</span><div className="status-text"><h4>{isAdmin ? '站長模式 (Admin)' : '訪客模式 (Visitor)'}</h4><p>{isAdmin ? '已解鎖所有編輯與管理權限' : '僅提供瀏覽與聚會輔助功能'}</p></div></div>
          <button className="status-login-btn" onClick={handleAdminToggle}>{isAdmin ? '登出' : '站長登入'}</button>
        </div>
        <div className="settings-card">
          <h3 className="settings-card-title">🎨 外觀與檢視</h3>
          <div className="settings-row"><span>外觀主題</span><select className="settings-select" value={theme} onChange={(e) => { triggerHaptic('light'); setTheme(e.target.value); }}> <option value="default">☀️ 淺色簡約</option><option value="dark">🌙 柔和暗黑</option><option value="forest">🌲 森之木質</option><option value="medieval">🏰 中古世紀</option><option value="cyberpunk">🌌 賽博龐克</option></select></div>
          <div className="settings-row"><span>聚會音效</span><button className="settings-toggle-btn" onClick={() => { triggerHaptic('light'); setSoundEnabled(!soundEnabled); }}>{soundEnabled ? '🔊 已開啟' : '🔇 已靜音'}</button></div>
          <div className="settings-row"><span>首頁預設排序</span><select className="settings-select" value={sortBy} onChange={(e) => { triggerHaptic('light'); setSortBy(e.target.value); }}>{SORT_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}</select></div>
          <div className="settings-row"><span>清單檢視模式</span><div className="settings-segment"><button type="button" className={viewMode === 'grid' ? 'active' : ''} onClick={() => { triggerHaptic('light'); setViewMode('grid'); }}>大圖網格</button><button type="button" className={viewMode === 'list' ? 'active' : ''} onClick={() => { triggerHaptic('light'); setViewMode('list'); }}>緊湊列表</button></div></div>
        </div>
        <div className="settings-card">
          <h3 className="settings-card-title">👥 牌咖群組管理</h3>
          <p className="settings-desc">將聚會大廳目前的玩家名單儲存為群組，方便日後一鍵載入，免去重複打字的麻煩。</p>
          <div className="settings-group-input"><input type="text" placeholder="群組名稱 (例: 週末桌遊團)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} /><button type="button" onClick={handleSavePlayerGroup}>儲存</button></div>
          {playerGroups.length > 0 && (<div className="settings-group-list">{playerGroups.map(g => (<div key={g.name} className="settings-group-item"><div className="group-info"><strong>{g.name}</strong><span>({g.players.length}人)</span></div><div className="group-actions"><button type="button" className="btn-load" onClick={() => handleLoadPlayerGroup(g)}>載入名單</button><button type="button" className="btn-del" onClick={() => handleDeletePlayerGroup(g.name)}>✕</button></div></div>))}</div>)}
        </div>
        <div className="settings-card">
          <h3 className="settings-card-title">💾 資料與進階管理</h3>
          <div className="settings-row"><span>清除所有最愛</span><button type="button" className="settings-danger-btn" onClick={handleClearFavorites}>🗑️ 清除最愛</button></div>
          <div className="settings-row"><span>重置玩家名單與分數</span><button type="button" className="settings-danger-btn" onClick={handleResetPlayersData}>🔄 重置大廳</button></div>
          <div className="settings-row"><span>匯出桌遊資料 (JSON)</span><button type="button" className="settings-action-btn" onClick={handleExportJSON}>📤 匯出備份</button></div>
          {isAdmin && (<><div className="settings-row"><span>匯入桌遊資料 (JSON)</span><button type="button" className="settings-action-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>📥 匯入還原</button></div><div className="settings-row"><span>新增桌遊資料庫</span><button type="button" className="settings-primary-btn" onClick={handleOpenAddModal}>➕ 新增桌遊</button></div></>)}
        </div>
        <div className="mobile-version-badge">✨ Version 1.0.5</div>
      </div>
    </div>
  )

  const renderHeroAndTools = () => (
    <section className="hero" id="hero-sec">
      {/* Dashboard Left */}
      <div className="hero-dashboard-left">
        <div className="hero-title-block">
          <span className="hero-tagline">✨ 聚會推薦助手</span>
          <h1>今天聚會，<br /><span>玩哪一款？</span></h1>
          <div className="hero-subtitle-hint">
             ⚡ 目前共有 <strong>{totalCount}</strong> 款精選桌遊準備就緒
          </div>
          {/* ✨ 新增 Dashboard Whisper 提示 */}
          {newGamesCount > 0 && (
            <div 
              className="dashboard-whisper"
              onClick={() => { triggerHaptic('light'); setShowOnlyNew(!showOnlyNew); }}
              style={{ 
                marginTop: '10px', 
                fontSize: '0.82rem', 
                color: showOnlyNew ? '#fff' : '#10b981', 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                background: showOnlyNew ? '#10b981' : 'rgba(16, 185, 129, 0.1)', 
                padding: '5px 12px', 
                borderRadius: '12px', 
                fontWeight: 'bold', 
                transition: 'all 0.2s', 
                border: `1px solid ${showOnlyNew ? '#059669' : 'rgba(16, 185, 129, 0.25)'}` 
              }}
            >
              {showOnlyNew ? `✅ 正在顯示 ${newGamesCount} 款新桌遊 (點擊取消)` : `✨ 最近 14 天內新增了 ${newGamesCount} 款新桌遊`}
            </div>
          )}
        </div>
        <div className="hero-stats-grid">
          <div className={`hero-stat-card ${expansionFilter === 'all' ? 'active-all' : ''}`} onClick={() => { triggerHaptic('light'); setExpansionFilter('all'); }}><span className="stat-icon">📦</span><span className="stat-title">總收藏</span><span className="stat-num" style={{ color: 'var(--accent-blue)' }}>{totalCount}<span className="stat-unit">款</span></span></div>
          <div className={`hero-stat-card ${expansionFilter === 'main' ? 'active-main' : ''}`} onClick={() => { triggerHaptic('light'); setExpansionFilter(expansionFilter === 'main' ? 'all' : 'main'); }}><span className="stat-icon">🎮</span><span className="stat-title">主遊戲</span><span className="stat-num" style={{ color: '#10b981' }}>{mainCount}<span className="stat-unit">款</span></span></div>
          <div className={`hero-stat-card ${expansionFilter === 'expansion' ? 'active-expansion' : ''}`} onClick={() => { triggerHaptic('light'); setExpansionFilter(expansionFilter === 'expansion' ? 'all' : 'expansion'); }}><span className="stat-icon">🧩</span><span className="stat-title">擴充包</span><span className="stat-num" style={{ color: '#d97706' }}>{expansionCount}<span className="stat-unit">款</span></span></div>
          <div className={`hero-stat-card ${expansionFilter === 'favorite' ? 'active-favorite' : ''}`} onClick={() => { triggerHaptic('light'); setExpansionFilter(expansionFilter === 'favorite' ? 'all' : 'favorite'); }}><span className="stat-icon">❤️</span><span className="stat-title">最愛</span><span className="stat-num" style={{ color: '#e11d48' }}>{favoriteCount}<span className="stat-unit">款</span></span></div>
        </div>
        <div className="hero-random-picker" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <div className="quick-pick-container"><span className="quick-pick-label">👥 指定人數:</span><div className="quick-pick-track">{[{ val: 'all', label: '不限' }, { val: '2', label: '2人' }, { val: '3', label: '3人' }, { val: '4', label: '4人' }, { val: '5', label: '5人' }, { val: '6', label: '6+人' }].map(item => (<button key={item.val} type="button" className={`quick-pick-chip ${quickPickPlayers === item.val ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setQuickPickPlayers(item.val); }}>{item.label}</button>))}</div></div>
          <button type="button" className={`random-button ${isRevealed && !showFinalUI ? 'spinning' : ''}`} onClick={chooseRandomWithAnimation} disabled={isShuffling || availableRandomPoolCount === 0} style={{ margin: 0 }}><span className="random-dice-icon">🎲</span><span>幫我選一盒桌遊</span></button>
          <div className={`random-pool-counter ${availableRandomPoolCount === 0 ? 'empty' : ''}`}>{availableRandomPoolCount > 0 ? (<>🎯 符合條件共 <strong>{availableRandomPoolCount}</strong> 款桌遊準備就緒</>) : (<>⚠️ 目前篩選條件下沒有符合的桌遊可抽</>)}</div>
        </div>
      </div>

      {/* Tools Section */}
      <div className="starter-card" style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '1.4rem', border: '1px solid var(--border-color)', position: 'relative', overflowX: 'hidden' }}>
        <div className="tool-tab-track">{[{ key: 'starter', label: '👑 先攻' }, { key: 'scoreboard', label: '📝 計分' }, { key: 'timer', label: '⏱️ 倒數' }, { key: 'dice', label: '🎲 骰子' }, { key: 'team', label: '⚔️ 分隊' }].map(tab => (<button key={tab.key} type="button" onClick={() => { triggerHaptic('light'); setWidgetTab(tab.key); }} className={`tool-tab-btn ${widgetTab === tab.key ? 'active' : ''}`}>{tab.label}</button>))}</div>
        
        {widgetTab === 'starter' && (
          <>
            <div className="player-chips-container">
              {sharedPlayers.map((p, idx) => { const isWon = starterWinner === p.name && !isPickingStarter; const dotColor = PLAYER_PALETTE[idx % PLAYER_PALETTE.length]; return (<span key={p.id} className={`player-chip ${isWon ? 'winner-chip' : ''}`} title={isWon ? "🏆 起始先攻玩家！" : p.name}><span className="player-chip-dot" style={{ backgroundColor: isWon ? '#f59e0b' : dotColor }}></span><span>{p.name}</span><span className="player-chip-del" onClick={() => handleRemoveSharedPlayer(p.id)} title="移除玩家">✕</span></span>) })}
              <button type="button" onClick={handleQuickAddPlayer} style={{ border: '1.5px dashed var(--border-color)', background: 'transparent', color: 'var(--text-muted)', borderRadius: '50px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }} title="快速新增一位玩家">+ 快速加人</button>
            </div>
            <form onSubmit={handleAddSharedPlayer} className="integrated-input-group"><input type="text" placeholder="自訂玩家暱稱..." value={inputPlayerName} onChange={(e) => setInputPlayerName(e.target.value)} /><button type="submit" className="integrated-input-btn">+ 加入</button></form>
            <div className={`starter-stage-card ${isPickingStarter ? 'rolling' : ''} ${starterWinner && !isPickingStarter ? 'won' : ''}`}>
              {isPickingStarter && (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}><span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 'bold' }}>🎰 命運輪盤極速旋轉中...</span><span className="slot-machine-text">🎯 {starterWinner}</span></div>)}
              {!isPickingStarter && starterWinner && (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}><span style={{ fontSize: '1.8rem' }}>🎉</span><div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#059669' }}>先攻由 <u>{starterWinner}</u> 拔得頭籌！</div><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>請做好準備，順時針開始你的第一回合！</span></div>)}
              {!isPickingStarter && !starterWinner && (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}><span>👑</span><span>點擊下方按鈕，交由命運選出首位開局玩家！</span></div>)}
            </div>
            <button type="button" onClick={pickStarterPlayer} disabled={isPickingStarter} className="starter-action-btn">{isPickingStarter ? '⚡ 命運抉擇中...' : '🎯 抽出起始玩家'}</button>
          </>
        )}

        {widgetTab === 'scoreboard' && (
          <>
            <div className="scoreboard-top-bar"><div className="round-pill-control"><span>🚩 第 {roundCount} 輪</span><button type="button" className="round-step-btn" onClick={() => { triggerHaptic('light'); setRoundCount(Math.max(1, roundCount - 1)); }}>-</button><button type="button" className="round-step-btn" onClick={() => { triggerHaptic('light'); setRoundCount(roundCount + 1); }}>+</button></div><div className="scoreboard-quick-actions"><button type="button" className="scoreboard-action-tag highlight" onClick={handleSortPlayersByScore} title="依分數從高到低重新排列">🏆 排序</button><button type="button" className="scoreboard-action-tag" onClick={() => resetAllScores(0)}>歸零</button><button type="button" className="scoreboard-action-tag" onClick={() => resetAllScores(10)}>10分</button><button type="button" className="scoreboard-action-tag" onClick={() => resetAllScores(20)}>20分</button></div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {sharedPlayers.map((p, idx) => { const dotColor = PLAYER_PALETTE[idx % PLAYER_PALETTE.length]; const isLeader = maxScore > 0 && p.score === maxScore; return (<div key={p.id} className={`score-card-row ${isLeader ? 'leader-active' : ''}`}><div className="score-player-meta"><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor }}></span><span className="score-player-name">{p.name}</span>{isLeader && <span className="leader-badge-pill">👑 領先</span>}</div><div className="score-stepper-group"><button type="button" className="step-btn-app" onClick={() => changeScore(p.id, -5)}>-5</button><button type="button" className="step-btn-app" onClick={() => changeScore(p.id, -1)}>-1</button>{editingScoreId === p.id ? (<input type="number" className="score-input-direct-app" autoFocus value={tempScoreVal} onChange={(e) => setTempScoreVal(e.target.value)} onBlur={() => handleSaveDirectScore(p.id)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveDirectScore(p.id) }} />) : (<span className="score-display-number" onClick={() => { setEditingScoreId(p.id); setTempScoreVal(String(p.score)) }} title="點擊直接修改分數">{p.score}</span>)}<button type="button" className="step-btn-app" onClick={() => changeScore(p.id, 1)}>+1</button><button type="button" className="step-btn-app" onClick={() => changeScore(p.id, 5)}>+5</button></div></div>) })}
            </div>
            <form onSubmit={handleAddSharedPlayer} className="integrated-input-group"><input type="text" placeholder="新增玩家 (兩邊同步)..." value={inputPlayerName} onChange={(e) => setInputPlayerName(e.target.value)} /><button type="submit" className="integrated-input-btn">+ 新增</button></form>
          </>
        )}

        {widgetTab === 'timer' && (
          <div className="timer-container">
            <div className="timer-preset-bar">{[ { label: '30秒', val: 30 }, { label: '60秒', val: 60 }, { label: '2分鐘', val: 120 }, { label: '5分鐘', val: 300 }, { label: '10分鐘', val: 600 } ].map(preset => (<button key={preset.val} type="button" onClick={() => setTimerPreset(preset.val)} className={`timer-preset-chip ${initialTimerDuration === preset.val ? 'active' : ''}`}>{preset.label}</button>))}</div>
            <div className="timer-ring-wrapper"><svg className="timer-svg" viewBox="0 0 190 190"><circle className="timer-circle-bg" cx="95" cy="95" r={timerRadius} /><circle className={`timer-circle-progress ${timeLeft <= 10 && timeLeft > 0 ? 'danger' : ''}`} cx="95" cy="95" r={timerRadius} strokeDasharray={timerCircumference} strokeDashoffset={timerDashoffset} /></svg><div className="timer-center-text"><span className={`timer-digits ${timeLeft <= 10 ? 'danger' : ''}`}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span><span className="timer-sublabel">{timerRunning ? 'COUNTING' : (timeLeft === 0 ? 'TIME OVER' : 'READY')}</span></div></div>
            <div className="timer-controls-row"><button type="button" onClick={toggleTimer} className={`timer-btn-primary ${timerRunning ? 'running' : ''}`}>{timerRunning ? '⏸ 暫停' : (timeLeft === 0 ? '🔄 重新開始' : '▶️ 開始倒數')}</button><button type="button" onClick={resetTimer} className="timer-btn-secondary">重設</button></div>
          </div>
        )}

        {/* 🌟 3D 原生骰子控制區 */}
        {widgetTab === 'dice' && (
          <div>
            <div className="dice-sub-tabs"><button type="button" onClick={() => setDiceToolTab('dice')} className={`dice-sub-tab-btn ${diceToolTab === 'dice' ? 'active' : ''}`}>🎲 物理滾骰</button><button type="button" onClick={() => setDiceToolTab('coin')} className={`dice-sub-tab-btn ${diceToolTab === 'coin' ? 'active' : ''}`}>🪙 3D 拋硬幣</button></div>
            {diceToolTab === 'dice' ? (
              <>
                <div className="dice-custom-panel">
                  <div className="dice-qty-row">
                    <span>數量 (Max 20)</span>
                    <div className="dice-qty-control">
                      <button type="button" className="dice-qty-btn" onClick={() => setDiceCount(Math.max(1, diceCount - 1))} disabled={isRollingDice}>-</button>
                      <input type="number" className="dice-qty-val-input" value={diceCount} min="1" max="20" onChange={(e) => setDiceCount(parseInt(e.target.value) || 1)} disabled={isRollingDice} />
                      <button type="button" className="dice-qty-btn" onClick={() => setDiceCount(Math.min(20, diceCount + 1))} disabled={isRollingDice}>+</button>
                    </div>
                  </div>
                  <div className="dice-qty-row">
                    <span>面數 (專屬正多面體)</span>
                    <div className="dice-qty-control">
                      <button type="button" className="dice-qty-btn" onClick={handlePrevSide} disabled={isRollingDice}>-</button>
                      <div className="dice-qty-val-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', background: 'transparent' }}>
                        D{diceSides}
                      </div>
                      <button type="button" className="dice-qty-btn" onClick={handleNextSide} disabled={isRollingDice}>+</button>
                    </div>
                  </div>
                </div>
                
                <div className="dice-stage-box">
                  <div className="dice-3d-canvas-container">
                    <RawThreeDice 
                      count={diceCount} 
                      sides={diceSides} 
                      theme={theme} 
                      rollTrigger={rollTrigger} 
                      onRollComplete={(total, details) => {
                        setIsRollingDice(false);
                        setDiceResults(details);
                      }}
                    />
                  </div>
                  <div className={`dice-results-overlay ${isRollingDice ? 'rolling' : ''}`}>
                    {!isRollingDice && rollTrigger > 0 && (
                      <>
                        <div className="dice-results-grid">
                          {diceResults.map((num, i) => (<div key={i} className="modern-die-2d">{num === '?' ? '' : num}</div>))}
                        </div>
                        {diceCount > 1 && !diceResults.includes('?') && (
                          <div className="dice-sum-badge">總和：{diceResults.reduce((a, b) => a + b, 0)}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <button type="button" onClick={executeCustomRoll} disabled={isRollingDice} className="dice-roll-action-btn">{isRollingDice ? '投擲中...' : '🎲 投擲'}</button>
              </>
            ) : (
              <><div className="coin-toss-stage" onClick={flipCoin} title="點擊拋擲硬幣"><div className={`coin-jump-box ${isFlippingCoin ? 'jumping' : ''}`}><div className="coin-spin-box" style={{ transform: `rotateX(${coinDegreeX}deg)` }}><div className="coin-face coin-front">👑</div><div className="coin-face coin-back">1</div></div></div><div className={`coin-shadow ${isFlippingCoin ? 'shrinking' : ''}`}></div><div className="coin-result-text" style={{ opacity: isFlippingCoin ? 0 : 1 }}>{coinSide}</div></div><button type="button" onClick={flipCoin} disabled={isFlippingCoin} className="coin-flip-action-btn">{isFlippingCoin ? '💫 拋擲空中...' : '🪙 拋擲硬幣'}</button></>
            )}
          </div>
        )}

        {widgetTab === 'team' && (
          <div className="team-tool-container">
            <div className="team-unified-header"><div className="team-segmented-control">{[2, 3, 4].map(num => (<button key={num} type="button" onClick={() => { triggerHaptic('light'); setTargetTeamCount(num); handleSplitTeams(num) }} className={`team-seg-btn ${targetTeamCount === num ? 'active' : ''}`}>{num} 隊</button>))}</div><button type="button" onClick={() => handleSplitTeams(targetTeamCount)} disabled={isShufflingTeams} className="team-roll-btn">{isShufflingTeams ? '🎴 洗牌中...' : '🎲 重新分組'}</button></div>
            {assignedTeams.length > 0 ? (
              <div className={`team-results-grid cols-${assignedTeams.length}`}>{assignedTeams.map((team, idx) => { const cfg = TEAM_CONFIG[idx % TEAM_CONFIG.length]; return (<div key={idx} className="team-box-card" style={{ borderColor: cfg.border }}><div className="team-card-header"><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color }}></span><strong style={{ color: cfg.color, fontSize: '0.9rem' }}>{cfg.name}</strong></div><span className="team-badge-pill" style={{ background: cfg.bg, color: cfg.color }}>{team.length} 人</span></div><div className="team-members-chips">{team.map(player => ( <span key={player.id} className="team-member-pill">{player.name}</span> ))}</div></div>) })}</div>
            ) : (<div className="team-empty-state"><span>⚔️</span><p>點擊上方切換隊伍數或按「重新分組」開始！</p></div>)}
          </div>
        )}
      </div>
    </section>
  )

  const renderFilterPanel = () => (
    <section className="filter-panel" id="collection-sec">
      <div className="filter-row" ref={filterRowRef}>
        <div className="search-box"><span>🔍</span><input type="text" placeholder="搜尋桌遊名稱/英文..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="custom-filter-dropdown-wrapper"><button type="button" className={`custom-filter-trigger ${activeDropdown === 'player' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveDropdown(activeDropdown === 'player' ? null : 'player') }}><span className="custom-filter-label">👥 人數:</span><span className="custom-filter-value">{currentPlayerLabel}</span><span className={`custom-filter-arrow ${activeDropdown === 'player' ? 'open' : ''}`}>▼</span></button>{activeDropdown === 'player' && (<div className="custom-filter-dropdown">{PLAYER_OPTIONS.map(opt => ( <button key={opt.key} type="button" className={`custom-filter-item ${playerFilter === opt.key ? 'selected' : ''}`} onClick={() => { triggerHaptic('light'); setPlayerFilter(opt.key); setActiveDropdown(null) }}><span>{opt.label}</span>{playerFilter === opt.key && <span className="custom-filter-check">✓</span>}</button> ))}</div>)}</div>
        <div className="custom-filter-dropdown-wrapper"><button type="button" className={`custom-filter-trigger ${activeDropdown === 'best' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveDropdown(activeDropdown === 'best' ? null : 'best') }}><span className="custom-filter-label">👑 最佳:</span><span className="custom-filter-value">{currentBestLabel}</span><span className={`custom-filter-arrow ${activeDropdown === 'best' ? 'open' : ''}`}>▼</span></button>{activeDropdown === 'best' && (<div className="custom-filter-dropdown">{BEST_PLAYER_OPTIONS.map(opt => ( <button key={opt.key} type="button" className={`custom-filter-item ${bestPlayerFilter === opt.key ? 'selected' : ''}`} onClick={() => { triggerHaptic('light'); setBestPlayerFilter(opt.key); setActiveDropdown(null) }}><span>{opt.label}</span>{bestPlayerFilter === opt.key && <span className="custom-filter-check">✓</span>}</button> ))}</div>)}</div>
        <div className="custom-filter-dropdown-wrapper"><button type="button" className={`custom-filter-trigger ${activeDropdown === 'time' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveDropdown(activeDropdown === 'time' ? null : 'time') }}><span className="custom-filter-label">⏱️ 時間:</span><span className="custom-filter-value">{currentTimeLabel}</span><span className={`custom-filter-arrow ${activeDropdown === 'time' ? 'open' : ''}`}>▼</span></button>{activeDropdown === 'time' && (<div className="custom-filter-dropdown">{TIME_OPTIONS.map(opt => ( <button key={opt.key} type="button" className={`custom-filter-item ${maxTimeFilter === opt.key ? 'selected' : ''}`} onClick={() => { triggerHaptic('light'); setMaxTimeFilter(opt.key); setActiveDropdown(null) }}><span>{opt.label}</span>{maxTimeFilter === opt.key && <span className="custom-filter-check">✓</span>}</button> ))}</div>)}</div>
        <div className="custom-filter-dropdown-wrapper"><button type="button" className={`custom-filter-trigger ${activeDropdown === 'sort' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveDropdown(activeDropdown === 'sort' ? null : 'sort') }}><span className="custom-filter-label">📊 排序:</span><span className="custom-filter-value">{currentSortLabel}</span><span className={`custom-filter-arrow ${activeDropdown === 'sort' ? 'open' : ''}`}>▼</span></button>{activeDropdown === 'sort' && (<div className="custom-filter-dropdown align-right">{SORT_OPTIONS.map(opt => ( <button key={opt.key} type="button" className={`custom-filter-item ${sortBy === opt.key ? 'selected' : ''}`} onClick={() => { triggerHaptic('light'); setSortBy(opt.key); setActiveDropdown(null) }}><span>{opt.label}</span>{sortBy === opt.key && <span className="custom-filter-check">✓</span>}</button> ))}</div>)}</div>
      </div>
      <div className="category-bar">{categories.map(cat => ( <button key={cat} type="button" className={`cat-btn ${category === cat ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setCategory(cat); }}>{cat}</button> ))}</div>
    </section>
  )

  const renderGameGrid = () => (
    <section className="collection">
      <div className={`game-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
        {loading ? ( Array.from({ length: 8 }).map((_, idx) => (<div key={idx} className={`skeleton-card ${viewMode === 'list' ? 'list-view' : ''}`}><div className="skeleton-cover" /><div className="skeleton-info"><div className="skeleton-bar title" /><div className="skeleton-bar subtitle" /><div className="skeleton-bar tags" /><div className="skeleton-bar bottom" /></div></div>)) ) : (
          filteredGames.map((game) => {
            const isFav = favorites.includes(game.id)
            return (
              <article className={`game-card box-3d-card ${viewMode === 'list' ? 'list-view' : ''}`} key={game.id} onClick={() => { triggerHaptic('light'); setDetailTab('info'); setViewDetailGame(game); }}>
                <button type="button" className="card-fav-btn" onClick={(e) => toggleFavorite(e, game.id)} title={isFav ? "取消收藏" : "加入我的最愛"}>{isFav ? '❤️' : '🤍'}</button>
                <div className="cover">{game.imageUrl ? ( <img src={game.imageUrl} alt={game.name} className="cover-img box-cover-img" /> ) : ( <span className="cover-emoji">{game.emoji}</span> )}
                  {viewMode !== 'list' && (<>
                    <div className="badge-container">
                      {/* ✨ 新增入庫徽章：採用原擴充包相同的樣式結構，改用毛玻璃低調質感 */}
                      {isNewGame(game.created_at) && <span className="expansion-badge new-badge">✨ 新入庫</span>}
                      {game.isExpansion && <span className="expansion-badge">🧩 擴充</span>}
                      {game.isSequel && <span className="sequel-badge">✨ 續作</span>}
                    </div>
                    <span className="category-tag">{game.category}</span>
                  </>)}
                </div>
                <div className="game-info">
                  {viewMode === 'list' ? (
                    <>
                      <div className="list-title-row">
                        <h3>{game.name}</h3>
                        {/* ✨ 新增清單檢視入庫徽章 */}
                        {isNewGame(game.created_at) && <span className="expansion-badge list-badge new-badge">✨ 新入庫</span>}
                        {game.isExpansion && <span className="expansion-badge list-badge">🧩 擴充</span>}
                        {game.isSequel && <span className="sequel-badge list-badge">✨ 續作</span>}
                      </div>
                      <p className="english"><span className="list-cat-tag">🏷️ {game.category}</span> ‧ {game.englishName || game.name}</p>
                    </>
                  ) : (<><h3>{game.name}</h3><p className="english">{game.englishName}</p></>)}
                  {Array.isArray(game.tags) && game.tags.length > 0 && viewMode !== 'list' && ( <div className="card-tags">{game.tags.map(t => ( <span key={t}>#{t}</span> ))}</div> )}
                  <div className="pill-badges-row"><span className="pill-badge">👥 {game.minPlayers}–{game.maxPlayers}人</span>{game.bestPlayers && <span className="pill-badge best">👑 {viewMode === 'list' ? game.bestPlayers : `最佳${game.bestPlayers}`}人</span>}<span className="pill-badge">⏱️ {game.time}分</span></div>
                  <div className="rating-complexity-row"><div className="rating">⭐ <strong>{game.rating != null && game.rating !== '' ? Number(game.rating).toFixed(2) : '--'}</strong></div><div className="complexity-badge" style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 'bold' }}>🧠 {viewMode === 'list' ? '' : '燒腦: '}{game.complexity != null && game.complexity !== '' ? Number(game.complexity).toFixed(2) : '--'}</div></div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )

  const renderBottomNav = () => (
    <nav className="bottom-nav-bar">
      <button type="button" className={`bottom-nav-item ${activeTab === 'collection' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('collection'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><span>📦</span>桌遊庫</button>
      <button type="button" className={`bottom-nav-item ${activeTab === 'hall' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('hall'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><span>🎲</span>聚會大廳</button>
      <button type="button" className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('settings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><span>⚙️</span>設定</button>
    </nav>
  )

  const renderRandomModal = () => isRevealed && (
    <div className="modal-overlay">
      <div className="random-3d-modal">
        <button className="random-3d-close-btn" onClick={() => { setIsRevealed(false); setIsShuffling(false); }}>✕</button>
        <div className="random-canvas-wrapper" style={{ opacity: showFinalUI ? 0 : 1, pointerEvents: showFinalUI ? 'none' : 'auto' }}>
          <Canvas key={drawKey} camera={{ position: [0, 5, 13], fov: 40 }}>
            <ambientLight intensity={0.85} /><directionalLight position={[5, 12, 6]} intensity={0.7} castShadow /><mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow><planeGeometry args={[100, 100]} /><shadowMaterial opacity={0.04} /></mesh>
            <RealisticMysteryBox game={randomGame} onComplete={handleRandomComplete} />
          </Canvas>
        </div>
        <div className={`random-final-ui ${showFinalUI ? 'active' : ''}`}>
          {finalGame && (
            <>
              <div className="random-final-subtitle">✨ 命中注定就是它！</div>
              <div className="random-final-img-box">{finalGame.imageUrl ? (<img src={finalGame.imageUrl} alt={finalGame.name} />) : (<span className="random-final-emoji">{finalGame.emoji || '🎲'}</span>)}</div>
              <h2 className="random-final-title" style={{ fontSize: getDynamicTitleSize(finalGame.name) }}>{finalGame.name}</h2>
              <p className="random-final-eng">{finalGame.englishName || ' '}</p>
              <div className="random-final-stats"><span>👥 {finalGame.minPlayers}-{finalGame.maxPlayers}人</span><span>⏱ {finalGame.time}分</span><span className="random-final-complex">🧠 {finalGame.complexity ? Number(finalGame.complexity).toFixed(2) : '--'}</span></div>
              <div className="random-final-actions"><button className="random-final-btn random-btn-reroll" onClick={chooseRandomWithAnimation} disabled={isShuffling}>🎲 再抽一次</button><button className="random-final-btn random-btn-detail" onClick={() => { setIsRevealed(false); setDetailTab('info'); setViewDetailGame(finalGame); }}>📖 查看詳情</button></div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  const renderDetailModal = () => viewDetailGame && (
    <div className="modal-overlay">
      <div className="detail-modal-content">
        <div className="detail-nav-header">
          <div className="detail-nav-left"><button type="button" onClick={() => { triggerHaptic('light'); setDetailTab('info'); }} className={`detail-tab-btn ${detailTab === 'info' ? 'active-info' : ''}`}>📖 遊戲介紹</button><button type="button" onClick={() => { triggerHaptic('light'); setDetailTab('cheatSheet'); }} className={`detail-tab-btn ${detailTab === 'cheatSheet' ? 'active-cheat' : ''}`}>⚡ 快速規則 / 提示卡</button></div>
          <div className="detail-nav-right">{isAdmin && (<><button type="button" className="detail-admin-btn" onClick={() => handleOpenEditModal(viewDetailGame)} style={{ background: 'var(--accent-blue)' }}>✏️ 編輯</button><button type="button" className="detail-admin-btn" onClick={() => handleDeleteGame(viewDetailGame.id, viewDetailGame.name)} style={{ background: '#EF4444' }}>🗑 刪除</button></>)}<button type="button" className="detail-close-icon-btn" onClick={() => setViewDetailGame(null)} title="關閉">✕</button></div>
        </div>
        <div className="detail-body-scrollable">
          {detailTab === 'info' ? (
            <>
              {viewDetailGame.imageUrl && ( <div className="detail-img-container"><img src={viewDetailGame.imageUrl} alt={viewDetailGame.name} className="detail-modal-img" /></div> )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}><h2 style={{ margin: 0, fontSize: '1.5rem' }}>{viewDetailGame.emoji} {viewDetailGame.name}</h2><button type="button" onClick={(e) => toggleFavorite(e, viewDetailGame.id)} style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer', transition: 'transform 0.2s' }} title={favorites.includes(viewDetailGame.id) ? "取消最愛" : "加入最愛"}>{favorites.includes(viewDetailGame.id) ? '❤️' : '🤍'}</button></div>
              <p className="detail-english">{viewDetailGame.englishName}</p>
              <div className="detail-info-card">
                <div className="detail-info-item">👥 <strong>人數：</strong>{viewDetailGame.minPlayers}–{viewDetailGame.maxPlayers}人</div>
                <div className="detail-info-item" style={{ color: '#D97706' }}>👑 <strong>最佳人數：</strong>{viewDetailGame.bestPlayers || '未設定'}人</div>
                <div className="detail-info-item">⏱️ <strong>遊戲時間：</strong>{viewDetailGame.time} 分鐘</div>
                <div className="detail-info-item">🏷️ <strong>遊戲類型：</strong>{viewDetailGame.category || '未分類'}</div>
                <div className="detail-info-item"><a href={viewDetailGame.bggUrl || `https://boardgamegeek.com/geeksearch.php?action=search&q=${encodeURIComponent(viewDetailGame.englishName || viewDetailGame.name)}`} target="_blank" rel="noopener noreferrer" className="bgg-link-badge-smooth" title={viewDetailGame.bggUrl ? "前往 BoardGameGeek 專屬頁面" : "在 BoardGameGeek 搜尋此桌遊"}>⭐ <strong>BGG 評分：</strong><span>{viewDetailGame.rating != null && viewDetailGame.rating !== '' ? `${Number(viewDetailGame.rating).toFixed(2)} 分` : '暫無評分'}</span><span className="bgg-external-icon">↗</span></a></div>
                <div className="detail-info-item" style={{ color: 'var(--accent-blue)' }}>🧠 <strong>燒腦指數：</strong>{viewDetailGame.complexity != null && viewDetailGame.complexity !== '' ? `${Number(viewDetailGame.complexity).toFixed(2)} / 5` : '待評估'}</div>
              </div>
              {viewDetailGame.sleeveSize && ( <div className="sleeve-bar-row"><span className="sleeve-bar-label">🃏 牌套規格：</span><div className="sleeve-bar-chips">{viewDetailGame.sleeveSize.includes('免用牌套') ? ( <span className="sleeve-pill-chip free">✨ 免用牌套</span> ) : ( viewDetailGame.sleeveSize.split(',').map((sleeve, idx) => { const text = sleeve.trim(); const countMatch = text.match(/\((.*?)\)/); const sizeOnly = text.replace(/\s*\(.*?\)/, '').trim(); return ( <span key={idx} className="sleeve-pill-chip"><span>{sizeOnly}</span>{countMatch && ( <span className="sleeve-pill-count">{countMatch[1]}</span> )}</span> ) }) )}</div></div> )}
              {viewDetailGame.videoUrl && ( <a href={viewDetailGame.videoUrl} target="_blank" rel="noopener noreferrer" className="video-banner-btn"><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '1.2rem' }}>🎬</span><span>觀看教學影片</span></div><span style={{ fontSize: '0.8rem', opacity: 0.8 }}>前往 YouTube ↗</span></a> )}
              {viewDetailGame.isExpansion && viewDetailGame.parentId && ( <div style={{ margin: '14px 0', padding: '12px 16px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}><span style={{ fontSize: '0.88rem', color: '#B45309', fontWeight: 'bold' }}>🧩 此為擴充包，需搭配主遊戲遊玩</span>{games.find(g => g.id === viewDetailGame.parentId) && ( <button type="button" onClick={() => { triggerHaptic('light'); setViewDetailGame(games.find(g => g.id === viewDetailGame.parentId)); }} style={{ border: 'none', background: '#F59E0B', color: '#fff', padding: '6px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold' }}>📦 查看主遊戲：{games.find(g => g.id === viewDetailGame.parentId).name} →</button> )}</div> )}
              {viewDetailGame.isSequel && ( <div style={{ margin: '14px 0', padding: '12px 16px', background: 'rgba(14, 165, 233, 0.08)', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}><span style={{ fontSize: '0.88rem', color: '#0369A1', fontWeight: 'bold' }}>✨ 獨立續作：可單獨遊玩，亦可與前作混合！</span>{viewDetailGame.parentId && games.find(g => g.id === viewDetailGame.parentId) && ( <button type="button" onClick={() => { triggerHaptic('light'); setViewDetailGame(games.find(g => g.id === viewDetailGame.parentId)); }} style={{ border: 'none', background: '#0EA5E9', color: '#fff', padding: '6px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold' }}>📦 查看關聯前作：{games.find(g => g.id === viewDetailGame.parentId).name} →</button> )}</div> )}
              {Array.isArray(viewDetailGame.tags) && viewDetailGame.tags.length > 0 && ( <div className="detail-tags-row">{viewDetailGame.tags.map(t => ( <span key={t} className="detail-tag-pill">#{t}</span> ))}</div> )}
              <p style={{ lineHeight: '1.7', margin: '16px 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>{viewDetailGame.description || '暫無詳細描述。'}</p>
              {games.filter(g => g.parentId === viewDetailGame.id).length > 0 && ( <div className="expansion-list" style={{ marginTop: '18px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}><h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>🧩 關聯作品 / 擴充包：</h4><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{games.filter(g => g.parentId === viewDetailGame.id).map(exp => ( <button key={exp.id} type="button" onClick={() => { triggerHaptic('light'); setViewDetailGame(exp); }} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'inherit', padding: '7px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>{exp.isSequel ? '✨' : '🧩'} {exp.name} →</button> ))}</div></div> )}
              {isAdmin && ( <div className="mobile-admin-bar"><button type="button" className="mobile-admin-btn" onClick={() => handleOpenEditModal(viewDetailGame)} style={{ background: 'var(--accent-blue)' }}>✏️ 編輯</button><button type="button" className="mobile-admin-btn" onClick={() => handleDeleteGame(viewDetailGame.id, viewDetailGame.name)} style={{ background: '#EF4444' }}>🗑 刪除</button></div> )}
            </>
          ) : (
            <div style={{ padding: '6px 0' }}><h3 style={{ margin: '0 0 12px 0', color: '#10B981', fontSize: '1.1rem' }}>⚡ {viewDetailGame.name} 快速提示卡</h3><div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed #10B981', borderRadius: '14px', padding: '18px', whiteSpace: 'pre-line', lineHeight: '1.8', fontSize: '0.95rem' }}>{viewDetailGame.cheatSheet ? viewDetailGame.cheatSheet : '📌 目前尚未建立這款遊戲的快速規則提示，站長可透過「編輯桌遊」隨時補上開局重點！'}</div></div>
          )}
        </div>
      </div>
    </div>
  )

  const renderFormModal = () => showModal && (
    <div className="modal-overlay">
      <div className="modal-content">
        <button type="button" className="detail-close-icon-btn" onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 50 }}>✕</button>
        <h2>{editingId ? '✏️ 編輯桌遊' : '➕ 新增桌遊'}</h2>
        <form onSubmit={handleSubmitForm}>
          <div className="form-group"><label>中文名稱 *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
          <div className="form-group"><label>英文名稱</label><input type="text" value={formData.englishName} onChange={(e) => setFormData({...formData, englishName: e.target.value})} /></div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}><div><label>最小人數</label><input type="number" min="1" value={formData.minPlayers} onChange={(e) => setFormData({...formData, minPlayers: e.target.value})} /></div><div><label>最大人數</label><input type="number" min="1" value={formData.maxPlayers} onChange={(e) => setFormData({...formData, maxPlayers: e.target.value})} /></div><div><label>👑 最佳人數</label><input type="text" placeholder="例: 4 或 4-6" value={formData.bestPlayers} onChange={(e) => setFormData({...formData, bestPlayers: e.target.value})} /></div></div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}><div><label>遊戲時間 (分鐘)</label><input type="number" step="5" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} /></div><div><label>⭐ 評分 (留空代表無)</label><input type="number" step="0.01" min="0.00" max="10.00" placeholder="可留空" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} /></div><div><label>🧠 燒腦度</label><input type="number" step="0.01" min="1.00" max="5.00" placeholder="可留空" value={formData.complexity} onChange={(e) => setFormData({...formData, complexity: e.target.value})} /></div></div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}><div><label>分類 (可手動輸入)</label><input type="text" list="category-options" placeholder="選擇或自由輸入類型" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} /><datalist id="category-options">{categories.filter(c => c !== '全部').map(cat => ( <option key={cat} value={cat} /> ))}</datalist></div><div><label>Emoji 圖示</label><input type="text" value={formData.emoji} onChange={(e) => setFormData({...formData, emoji: e.target.value})} /></div></div>
          <div className="sleeve-manager-box"><label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.92rem' }}>🃏 牌套規格管理（棋寶常用尺寸 + 張數）：</label>{sleeveList.map((item, idx) => (<div key={idx} className="sleeve-row-item"><select value={item.size} onChange={(e) => updateSleeveRow(idx, 'size', e.target.value)}>{CHESURE_SLEEVE_OPTIONS.map(opt => ( <option key={opt} value={opt}>{opt}</option> ))}</select><input type="number" placeholder="張數 (例: 110)" value={item.count} onChange={(e) => updateSleeveRow(idx, 'count', e.target.value)} />{sleeveList.length > 1 && ( <button type="button" className="sleeve-remove-btn" onClick={() => removeSleeveRow(idx)}>✕</button> )}</div>))}<button type="button" className="sleeve-add-btn" onClick={addSleeveRow}>+ 新增另一種牌套尺寸</button></div>
          <div className="form-group"><label>📷 封面圖片網址 (Image URL)</label><input type="url" placeholder="https://example.com/image.jpg" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} /></div>
          <div className="form-group"><label>或 上傳本機圖片 (自動壓縮並上傳雲端)</label><input type="file" accept="image/*" onChange={handleCroppedImageUpload} disabled={isUploadingImg} />{isUploadingImg && <span style={{fontSize: '0.8rem', color: 'var(--accent-blue)', marginTop: '4px'}}>⏳ 圖片壓縮與上傳中，請稍候...</span>}</div>
          {formData.imageUrl && (<div style={{ padding: '10px', background: 'var(--bg-card)', borderRadius: '12px', textAlign: 'center', margin: '8px 0', border: '1px solid var(--border-color)' }}><span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>封面預覽</span><img src={formData.imageUrl} alt="預覽" style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} /></div>)}
          <div className="form-group"><label>🏷️ 標籤 (以逗號分隔，例如: 新手推薦, 快節奏)</label><input type="text" placeholder="例如: 派對, 爆笑, 雙人首選" value={formData.tagsInput} onChange={(e) => setFormData({...formData, tagsInput: e.target.value})} /></div>
          <div className="form-group"><label>🌐 BGG 專屬頁面網址</label><input type="url" placeholder="https://boardgamegeek.com/boardgame/..." value={formData.bggUrl} onChange={(e) => setFormData({...formData, bggUrl: e.target.value})} /></div>
          <div className="form-group"><label>🎬 教學影片連結 (YouTube 網址)</label><input type="url" placeholder="https://www.youtube.com/..." value={formData.videoUrl} onChange={(e) => setFormData({...formData, videoUrl: e.target.value})} /></div>
          <div className="form-group"><label>📝 遊戲介紹 / 玩法簡介</label><textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea></div>
          <div className="form-group"><label>⚡ 快速規則 / 提示卡重點</label><textarea rows="4" placeholder="每行輸入一條開局重點或關鍵規則..." value={formData.cheatSheet} onChange={(e) => setFormData({...formData, cheatSheet: e.target.value})} style={{ border: '1px solid #10B981', background: 'rgba(16, 185, 129, 0.02)' }}></textarea></div>
          <div className="form-group" style={{ background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '10px' }}><label style={{ fontWeight: 'bold', marginBottom: '6px' }}>📦 遊戲本體類型：</label><select value={formData.gameType} onChange={(e) => { const val = e.target.value; setFormData(prev => ({ ...prev, gameType: val, parentId: val === 'main' ? '' : prev.parentId })); if (val === 'main') setParentSearchInput('') }} style={{ marginBottom: '8px' }}><option value="main">🎮 獨立主遊戲</option><option value="sequel">✨ 獨立續作 / 衍生作（可單獨玩）</option><option value="expansion">🧩 純擴充包（需搭配前作）</option></select>{(formData.gameType === 'expansion' || formData.gameType === 'sequel') && (<div><label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{formData.gameType === 'expansion' ? '🔍 搜尋並選擇所屬主遊戲 *：' : '🔍 搜尋並選擇關聯前作（可選）：'}</label><input type="text" list="parent-games-list" placeholder="輸入遊戲名稱關鍵字..." value={parentSearchInput} onChange={(e) => { const val = e.target.value; setParentSearchInput(val); const matched = games.find(g => g.name === val); if (matched) { setFormData(prev => ({ ...prev, parentId: matched.id })) } else if (!val) { setFormData(prev => ({ ...prev, parentId: '' })) } }} /><datalist id="parent-games-list">{games.filter(g => !g.isExpansion && g.id !== editingId).map(g => ( <option key={g.id} value={g.name} /> ))}</datalist></div>)}</div>
          <div className="modal-actions"><button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>取消</button><button type="submit" className="submit-btn" disabled={isUploadingImg}>{isUploadingImg ? '上傳中...' : '儲存'}</button></div>
        </form>
      </div>
    </div>
  )

  // ===================== 主體組件 Return =====================
  return (
    <div className="app" data-tab={activeTab}>
      {renderHeader()}
      {renderMobileSettings()}
      <main>
        {renderHeroAndTools()}
        {renderFilterPanel()}
        {renderGameGrid()}
      </main>
      {renderBottomNav()}
      {renderRandomModal()}
      {renderDetailModal()}
      {renderFormModal()}
    </div>
  )
}