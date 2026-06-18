import React, { useState, useRef, useMemo, useEffect, createContext, useContext } from "react";
import {
  MapPin, Camera, BarChart3, Bell, ChevronLeft, CheckCircle2,
  TriangleAlert, Clock, Loader2, X, Check, RefreshCw, Wifi, WifiOff,
  ScanLine, Store, ChevronRight, Award, Target, Activity, Eye,
  Snowflake, LayoutGrid, Tag, UserRound, Compass, Crosshair, TrendingUp,
  TrendingDown, Sun, Route, PackageOpen, Megaphone, Boxes, ThermometerSun,
  Sparkles, Upload, Database, FileSpreadsheet, Plus, Trash2, UserPlus, Filter,
  CircleDot, Radio, RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";

/* ============================================================
   AB InBev CAM International — Trade Survey Platform
   Prototipo v2 · UI clara · animación CSS · responsive
   Diseño guiado por: emil-design-eng + impeccable skills
   ============================================================ */

/* ---------- TOKENS DE COLOR (neutros tintados hacia ámbar, sin #000/#fff puro) ---------- */
const T = {
  bg:        "#FBF8F1",
  surface:   "#FFFDF8",
  surfaceAlt:"#F2EDE0",
  cream:     "#F6F0E2",
  primary:   "#C68A12",
  primaryDim:"#A2700B",
  primarySoft:"#FAEDCE",
  ink:       "#26303A",
  inkSoft:   "#3E4B57",
  navy:      "#2C4256",
  textMed:   "#5C6770",
  textLow:   "#97A0A8",
  border:    "#E8E0CF",
  white:     "#FFFEFB",
  success:   "#2C9D63",
  successSoft:"#E3F4EA",
  warn:      "#DD9426",
  warnSoft:  "#FBEFD4",
  danger:    "#D5443D",
  dangerSoft:"#FAE5E3",
  info:      "#3D83C2",
  infoSoft:  "#E4F0F8",
};

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const DISPLAY = "'Fraunces', Georgia, serif";

/* ---------- DATOS DEMO ---------- */

const SKUS = [
  { brand: "Corona", pack: "Botella", abi: true, psv: 1.25 },
  { brand: "Budweiser", pack: "Lata", abi: true, psv: 1.10 },
  { brand: "Stella Artois", pack: "Botella", abi: true, psv: 1.85 },
  { brand: "Modelo", pack: "Lata", abi: true, psv: 1.30 },
  { brand: "Atlas", pack: "Lata", abi: true, psv: 0.85 },
  { brand: "Balboa", pack: "Lata", abi: true, psv: 0.80 },
  { brand: "Heineken", pack: "Botella", abi: false, psv: 1.40 },
  { brand: "Pilsen", pack: "Lata", abi: false, psv: 0.78 },
];

/* ---------- PAÍSES Y USUARIOS DEL PROTOTIPO ---------- */
const COUNTRIES = [
  { code: "VE", name: "Venezuela",   flag: "🇻🇪", currency: "USD", distributor: "Distribuidora AB InBev Caracas" },
  { code: "PA", name: "Panamá",      flag: "🇵🇦", currency: "USD", distributor: "Distribuidora CAM Panamá" },
  { code: "CR", name: "Costa Rica",  flag: "🇨🇷", currency: "CRC", distributor: "Distribuidora CAM Costa Rica" },
  { code: "GT", name: "Guatemala",   flag: "🇬🇹", currency: "GTQ", distributor: "Distribuidora CAM Guatemala" },
  { code: "HN", name: "Honduras",    flag: "🇭🇳", currency: "HNL", distributor: "Distribuidora CAM Honduras" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", currency: "USD", distributor: "Distribuidora CAM El Salvador" },
];
const getCountry = (code) => COUNTRIES.find(c => c.code === code) || COUNTRIES[0];

/* ---------- USUARIOS DEL SISTEMA ---------- */
// Roles: "admin" (global) | "supervisor" (por país) | "gvm" (por país)
// Admin: crea/edita admins, supervisores y GVMs de cualquier país; ve todo.
// Supervisor: ve y opera solo en su país; crea solamente GVMs de su país.
// GVM: usa la app de campo, ve solo PDVs de su país.
const USERS_SEED = [
  // === ADMIN GLOBAL ===
  { id: "admin", username: "admin", email: "admin@abinbev.com", password: "admin", name: "Administrador", role: "admin", country: null, initials: "AD", color: "#26303A" },

  // === SUPERVISORES (uno por país) ===
  { id: "sup-ve", username: "sup.ve", email: "supervisor.ve@abinbev.com", password: "1234", name: "María González",    role: "supervisor", country: "VE", initials: "MG", color: "#2C4256" },
  { id: "sup-pa", username: "sup.pa", email: "supervisor.pa@abinbev.com", password: "1234", name: "Roberto Castillo", role: "supervisor", country: "PA", initials: "RC", color: "#2C4256" },
  { id: "sup-cr", username: "sup.cr", email: "supervisor.cr@abinbev.com", password: "1234", name: "Andrea Solís",     role: "supervisor", country: "CR", initials: "AS", color: "#2C4256" },
  { id: "sup-gt", username: "sup.gt", email: "supervisor.gt@abinbev.com", password: "1234", name: "Diego Morales",    role: "supervisor", country: "GT", initials: "DM", color: "#2C4256" },
  { id: "sup-hn", username: "sup.hn", email: "supervisor.hn@abinbev.com", password: "1234", name: "Patricia Reyes",   role: "supervisor", country: "HN", initials: "PR", color: "#2C4256" },
  { id: "sup-sv", username: "sup.sv", email: "supervisor.sv@abinbev.com", password: "1234", name: "Jorge Aguilar",    role: "supervisor", country: "SV", initials: "JA", color: "#2C4256" },

  // === GVMs (uno por país, con métricas de operación) ===
  { id: "EM", username: "eduardo", email: "eduardo.mendez@abinbev.com",  password: "1234", name: "Eduardo Méndez",   role: "gvm", country: "VE", initials: "EM", color: "#C68A12", visited: 4, planned: 8, oos: 1 },
  { id: "CV", username: "carlos",  email: "carlos.vargas@abinbev.com",   password: "1234", name: "Carlos Vargas",    role: "gvm", country: "PA", initials: "CV", color: "#2A9D63", visited: 5, planned: 6, oos: 0 },
  { id: "CR", username: "carla",   email: "carla.rodriguez@abinbev.com", password: "1234", name: "Carla Rodríguez",  role: "gvm", country: "CR", initials: "CR", color: "#3E84C4", visited: 6, planned: 6, oos: 0 },
  { id: "JP", username: "jose",    email: "jose.pineda@abinbev.com",     password: "1234", name: "José Pineda",      role: "gvm", country: "GT", initials: "JP", color: "#D8443C", visited: 3, planned: 7, oos: 3 },
  { id: "ML", username: "maria",   email: "maria.lainez@abinbev.com",    password: "1234", name: "María Lainez",     role: "gvm", country: "HN", initials: "ML", color: "#2C4256", visited: 5, planned: 5, oos: 1 },
  { id: "LB", username: "luis",    email: "luis.bonilla@abinbev.com",    password: "1234", name: "Luis Bonilla",     role: "gvm", country: "SV", initials: "LB", color: "#A2700B", visited: 2, planned: 4, oos: 0 },
];

const STORAGE_USERS_KEY = "abi-trade-users-v1";
const loadUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return USERS_SEED;
};
const saveUsers = (users) => { try { localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users)); } catch (_) {} };

const findUserByLogin = (users, idOrEmail, password) => {
  const q = String(idOrEmail || "").trim().toLowerCase();
  return users.find(u =>
    (u.username?.toLowerCase() === q || u.email?.toLowerCase() === q) &&
    u.password === password
  );
};
const getUserById = (users, id) => users.find(u => u.id === id);
const getGvms = (users) => users.filter(u => u.role === "gvm");

const PDVS_SEED = [
  { id: "PDV-CCS-001", name: "2Doce Market", cat: "Bodegón / Market", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Calle Madrid, Las Mercedes, Caracas", lat: 10.483912, lng: -66.860634, status: "pending", order: 1, country: "VE", assignedTo: "EM" },  // Las Mercedes
  { id: "PDV-CCS-002", name: "Nola (Nola Gourmet)", cat: "Bodegón / Gourmet", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Francisco de Miranda, Los Palos Grandes, Caracas", lat: 10.497226, lng: -66.84476, status: "pending", order: 2, country: "VE", assignedTo: "EM" },  // Los Palos Grandes
  { id: "PDV-CCS-003", name: "Celicor La Urbina (Urbilicores)", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Principal de La Urbina, Caracas", lat: 10.486902, lng: -66.807057, status: "pending", order: 3, country: "VE", assignedTo: "EM" },  // La Urbina
  { id: "PDV-CCS-004", name: "Celicor Boutique", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "La Castellana, Chacao, Caracas", lat: 10.499438, lng: -66.851188, status: "pending", order: 4, country: "VE", assignedTo: "EM" },  // La Castellana
  { id: "PDV-CCS-005", name: "Osomanía", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Milán, La California Sur, Caracas", lat: 10.478507, lng: -66.827534, status: "pending", order: 5, country: "VE", assignedTo: "EM" },  // La California Sur
  { id: "PDV-CCS-006", name: "Automercado Santa Rosa de Lima", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Calle A, Santa Rosa de Lima, Caracas", lat: 10.467923, lng: -66.859899, status: "pending", order: 6, country: "VE", assignedTo: "EM" },  // Santa Rosa de Lima
  { id: "PDV-CCS-007", name: "Automercado Alegría", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Calle B, Los Chorros, Caracas", lat: 10.502434, lng: -66.820453, status: "pending", order: 7, country: "VE", assignedTo: "EM" },  // Los Chorros
  { id: "PDV-CCS-008", name: "Buy Now", cat: "Bodegón / Mayorista", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "C.C. Caurimare, Caracas", lat: 10.472085, lng: -66.838116, status: "pending", order: 8, country: "VE", assignedTo: "EM" },  // Caurimare
  { id: "PDV-CCS-009", name: "BB Licores", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Principal de La Urbina (frente a Central Madeirense), Caracas", lat: 10.483041, lng: -66.807685, status: "pending", order: 0, country: "VE", assignedTo: null },  // La Urbina
  { id: "PDV-CCS-010", name: "Bodegón Mundial", cat: "Bodegón", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Francisco de Miranda, La California, Caracas", lat: 10.480147, lng: -66.817124, status: "pending", order: 0, country: "VE", assignedTo: null },  // La California
  { id: "PDV-CCS-011", name: "Katty Kar (Katykar Bodegón)", cat: "Bodegón", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Boleíta, Caracas", lat: 10.492018, lng: -66.822593, status: "pending", order: 0, country: "VE", assignedTo: null },  // Boleíta
  { id: "PDV-CCS-012", name: "Licores Casanova", cat: "Bodegón / Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Casanova con Calle San Antonio, Caracas", lat: 10.494095, lng: -66.880399, status: "pending", order: 0, country: "VE", assignedTo: null },  // La Casanova (Sabana Grande)
  { id: "PDV-CCS-013", name: "Bodegón Beethoven", cat: "Bodegón", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Calle Beethoven, Edif. Sur América, PB, Colinas de Bello Monte, Caracas", lat: 10.487672, lng: -66.876072, status: "pending", order: 0, country: "VE", assignedTo: null },  // Bello Monte
  { id: "PDV-CCS-014", name: "La Casa de la Caña", cat: "Licorería especializada", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Blandín, La Castellana (local donde antes estaba Prolicor), Caracas", lat: 10.49759, lng: -66.852772, status: "pending", order: 0, country: "VE", assignedTo: null },  // La Castellana
  { id: "PDV-CCS-015", name: "Licoteca", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Mohedano con Calle Don Pedro Grases, La Castellana, Caracas", lat: 10.498779, lng: -66.854374, status: "pending", order: 0, country: "VE", assignedTo: null },  // La Castellana
  { id: "PDV-CCS-016", name: "Guuao", cat: "Bodegón / Tienda", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Sambil La Candelaria, Caracas", lat: 10.505057, lng: -66.901194, status: "pending", order: 0, country: "VE", assignedTo: null },  // Sambil La Candelaria
  { id: "PDV-CCS-017", name: "Minuto (Practimercado)", cat: "Mini market", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Francisco de Miranda, Chacao, Caracas", lat: 10.492473, lng: -66.856903, status: "pending", order: 0, country: "VE", assignedTo: null },  // Chacao
  { id: "PDV-CCS-018", name: "Oso 3", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Sector Horizonte, Caracas", lat: 10.48508, lng: -66.826901, status: "pending", order: 0, country: "VE", assignedTo: null },  // Horizonte / Los Cortijos
  { id: "PDV-CCS-019", name: "Hieylic", cat: "Bodegón / Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "2da Av. entre 1ra y 2da Transversal, Edif. La Pradera, Los Palos Grandes, Caracas", lat: 10.498753, lng: -66.844675, status: "pending", order: 0, country: "VE", assignedTo: null },  // Los Palos Grandes
  { id: "PDV-CCS-020", name: "Hiperlicores Flor de Macaracuay", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Principal de Macaracuay, Caracas", lat: 10.463146, lng: -66.811409, status: "pending", order: 0, country: "VE", assignedTo: null },  // Macaracuay
  { id: "PDV-CCS-021", name: "MegaLicor Los Palos Grandes", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "2da Avenida, Los Palos Grandes, Caracas", lat: 10.498168, lng: -66.843877, status: "pending", order: 0, country: "VE", assignedTo: null },  // Los Palos Grandes
  { id: "PDV-CCS-022", name: "Bodegón Don Picasso", cat: "Bodegón / Supermercado", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Calle Ricaurte, Piedra Azul, Baruta, Caracas", lat: 10.431665, lng: -66.874947, status: "pending", order: 0, country: "VE", assignedTo: null },  // Piedra Azul
  { id: "PDV-CCS-023", name: "Be Plus (Bodegón BePlus)", cat: "Bodegón", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "C.C. Santa Fe Norte, Caracas", lat: 10.466177, lng: -66.871656, status: "pending", order: 0, country: "VE", assignedTo: null },  // Santa Fe
  { id: "PDV-CCS-024", name: "Bodegón Plus", cat: "Bodegón / Mayorista", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Rómulo Gallegos, Edif. Santa Rosa, Local C, PB, Caracas", lat: 10.496996, lng: -66.836685, status: "pending", order: 0, country: "VE", assignedTo: null },  // Sebucán
  { id: "PDV-CCS-025", name: "Bodegón La Salle (Víveres y Licores La Salle)", cat: "Bodegón / Abasto", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. La Salle, Los Caobos, Caracas", lat: 10.499473, lng: -66.884023, status: "pending", order: 0, country: "VE", assignedTo: null },  // Los Caobos
  { id: "PDV-CCS-026", name: "Bodegón Los Ilustres 2020", cat: "Bodegón / Supermercado", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Los Ilustres, Caracas", lat: 10.484293, lng: -66.8948, status: "pending", order: 0, country: "VE", assignedTo: null },  // Colina de Las Acacias
  { id: "PDV-CCS-027", name: "Fresh Fish", cat: "Pescadería / Gourmet market", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Los Chaguaramos, La Castellana, Caracas", lat: 10.498298, lng: -66.855138, status: "pending", order: 0, country: "VE", assignedTo: null },  // La Castellana
  { id: "PDV-CCS-028", name: "Licores Mundiales", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Río de Janeiro, Las Mercedes, Caracas", lat: 10.483938, lng: -66.859536, status: "pending", order: 0, country: "VE", assignedTo: null },  // Las Mercedes
  { id: "PDV-CCS-029", name: "Automercado La Muralla (La Muralla Supermarket)", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Final Av. Intercomunal El Hatillo con Av. Ppal. de El Hatillo, Caracas", lat: 10.427589, lng: -66.829341, status: "pending", order: 0, country: "VE", assignedTo: null },  // El Hatillo
  { id: "PDV-CCS-030", name: "La Muralla Gourmet", cat: "Bodegón / Gourmet", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. El Progreso cruce con Av. Intercomunal de El Hatillo, Caracas", lat: 10.428044, lng: -66.8289, status: "pending", order: 0, country: "VE", assignedTo: null },  // El Hatillo
  { id: "PDV-CCS-031", name: "Automercado Sledo (Sledo Supermarket)", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "3era Avenida, Caracas", lat: 10.485476, lng: -66.950384, status: "pending", order: 0, country: "VE", assignedTo: null },  // La Yaguara / Vista Alegre
  { id: "PDV-CCS-032", name: "Megalicor El Hatillo (Hato Frutal)", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Principal de El Hatillo, Caracas", lat: 10.426401, lng: -66.83087, status: "pending", order: 0, country: "VE", assignedTo: null },  // El Hatillo
  { id: "PDV-CCS-033", name: "Bodegón Cinecittà (Cine Citta Caracas)", cat: "Bodegón / Gourmet", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Centro Polo, Av. Chama, Colinas de Bello Monte, Caracas", lat: 10.486757, lng: -66.874594, status: "pending", order: 0, country: "VE", assignedTo: null },  // Bello Monte
  { id: "PDV-CCS-034", name: "Mercato (Mercato Market)", cat: "Supermercado / Market", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Santa Paula, Caracas", lat: 10.46339, lng: -66.841245, status: "pending", order: 0, country: "VE", assignedTo: null },  // Santa Paula
  { id: "PDV-CCS-035", name: "Plan Suárez", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Santa Mónica, Caracas", lat: 10.478862, lng: -66.892382, status: "pending", order: 0, country: "VE", assignedTo: null },  // Santa Mónica
  { id: "PDV-CCS-036", name: "Plan Suárez", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Calle Las Piedritas, La Trinidad, Caracas", lat: 10.437144, lng: -66.8655, status: "pending", order: 0, country: "VE", assignedTo: null },  // La Trinidad
  { id: "PDV-CCS-037", name: "Forum (Forum SuperMayorista)", cat: "Supermayorista", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "C.C. Los Próceres, IPSFA, Paseo Los Ilustres, Caracas", lat: 10.473179, lng: -66.89517, status: "pending", order: 0, country: "VE", assignedTo: null },  // IPSFA
  { id: "PDV-CCS-038", name: "Río Vida (Riovida)", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Bello Monte, Caracas", lat: 10.489222, lng: -66.879064, status: "pending", order: 0, country: "VE", assignedTo: null },  // Bello Monte
  { id: "PDV-CCS-039", name: "Río Vida (Riovida)", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Andrés Bello, Caracas", lat: 10.503768, lng: -66.884234, status: "pending", order: 0, country: "VE", assignedTo: null },  // Av. Andrés Bello
  { id: "PDV-CCS-040", name: "Río Super Market", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Lomas del Sol, Caracas", lat: 10.447512, lng: -66.830097, status: "pending", order: 0, country: "VE", assignedTo: null },  // Lomas del Sol
  { id: "PDV-CCS-041", name: "Río Super Market", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Antiguo C.C. Cayorma, 3ra Transversal, Los Palos Grandes, Caracas", lat: 10.500637, lng: -66.84647, status: "pending", order: 0, country: "VE", assignedTo: null },  // Los Palos Grandes
  { id: "PDV-CCS-042", name: "Páramo (Supermercado Páramo)", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Libertador, Caracas", lat: 10.497436, lng: -66.876268, status: "pending", order: 0, country: "VE", assignedTo: null },  // Av. Libertador
  { id: "PDV-CCS-043", name: "Páramo (Hipermercado Páramo)", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Piedra Azul, Baruta, Caracas", lat: 10.429468, lng: -66.873624, status: "pending", order: 0, country: "VE", assignedTo: null },  // Piedra Azul
  { id: "PDV-CCS-044", name: "Luvebras", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. San Felipe, La Castellana, Caracas", lat: 10.500012, lng: -66.852504, status: "pending", order: 0, country: "VE", assignedTo: null },  // La Castellana
  { id: "PDV-CCS-045", name: "Unicasa", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Caroní, Bello Monte, Caracas", lat: 10.484446, lng: -66.875538, status: "pending", order: 0, country: "VE", assignedTo: null },  // Bello Monte
  { id: "PDV-CCS-046", name: "Luz (Automercado Luz)", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Francisco de Miranda, Edif. Valmy, Chacao, Caracas", lat: 10.492713, lng: -66.855695, status: "pending", order: 0, country: "VE", assignedTo: null },  // Chacao
  { id: "PDV-CCS-047", name: "Plaza's (Automercados Plaza's)", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. La Colina, Los Chaguaramos, Caracas", lat: 10.4833, lng: -66.885235, status: "pending", order: 0, country: "VE", assignedTo: null },  // Los Chaguaramos
  { id: "PDV-CCS-048", name: "Casa Mía (Casa Mía Bodegón)", cat: "Bodegón / Supermercado", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Calle Madrid, Av. Ppal. Las Mercedes, Caracas", lat: 10.481728, lng: -66.856179, status: "pending", order: 0, country: "VE", assignedTo: null },  // Las Mercedes
  { id: "PDV-CCS-049", name: "Central Madeirense", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Prol. Av. José María Vargas, La Alameda, Caracas", lat: 10.467177, lng: -66.876292, status: "pending", order: 0, country: "VE", assignedTo: null },  // La Alameda
  { id: "PDV-CCS-050", name: "Gama (Gama Plus)", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Rómulo Gallegos con 2da Avenida, Santa Eduvigis, Caracas", lat: 10.497962, lng: -66.840505, status: "pending", order: 0, country: "VE", assignedTo: null },  // Santa Eduvigis
  // === PDVs de demo en otros países (para el dashboard del supervisor regional) ===
  { id: "PDV-PA-001", name: "Super 99 Vía España", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora CAM Panamá", addr: "Vía España, Ciudad de Panamá", lat: 8.987, lng: -79.518, status: "pending", order: 1, country: "PA", assignedTo: "CV" },
  { id: "PDV-PA-002", name: "Riba Smith Marbella", cat: "Hipermercado", channel: "Off-trade", dist: "Distribuidora CAM Panamá", addr: "Calle 53, Marbella, Panamá", lat: 8.982, lng: -79.524, status: "pending", order: 2, country: "PA", assignedTo: "CV" },
  { id: "PDV-PA-003", name: "Licorería El Tucán", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora CAM Panamá", addr: "El Cangrejo, Panamá", lat: 8.989, lng: -79.530, status: "pending", order: 0, country: "PA", assignedTo: null },
  { id: "PDV-CR-001", name: "Auto Mercado Escazú", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora CAM Costa Rica", addr: "Escazú, San José", lat: 9.926, lng: -84.135, status: "done", order: 1, country: "CR", assignedTo: "CR" },
  { id: "PDV-CR-002", name: "Más x Menos Sabana", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora CAM Costa Rica", addr: "La Sabana, San José", lat: 9.935, lng: -84.103, status: "done", order: 2, country: "CR", assignedTo: "CR" },
  { id: "PDV-CR-003", name: "Pricesmart Zapote", cat: "Mayorista", channel: "Off-trade", dist: "Distribuidora CAM Costa Rica", addr: "Zapote, San José", lat: 9.920, lng: -84.064, status: "pending", order: 0, country: "CR", assignedTo: null },
  { id: "PDV-GT-001", name: "Super Selecto Z.10", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora CAM Guatemala", addr: "Zona 10, Ciudad de Guatemala", lat: 14.598, lng: -90.508, status: "pending", order: 1, country: "GT", assignedTo: "JP" },
  { id: "PDV-GT-002", name: "La Torre Las Américas", cat: "Hipermercado", channel: "Off-trade", dist: "Distribuidora CAM Guatemala", addr: "Av. Las Américas, Guatemala", lat: 14.580, lng: -90.514, status: "pending", order: 0, country: "GT", assignedTo: null },
  { id: "PDV-HN-001", name: "La Colonia Multiplaza", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora CAM Honduras", addr: "Multiplaza, Tegucigalpa", lat: 14.077, lng: -87.183, status: "done", order: 1, country: "HN", assignedTo: "ML" },
  { id: "PDV-HN-002", name: "Pulpería La Esquina", cat: "Pulpería", channel: "Off-trade", dist: "Distribuidora CAM Honduras", addr: "Col. Lomas del Mayab, Tegucigalpa", lat: 14.089, lng: -87.195, status: "pending", order: 0, country: "HN", assignedTo: null },
  { id: "PDV-SV-001", name: "Súper Selectos La Gran Vía", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora CAM El Salvador", addr: "La Gran Vía, Antiguo Cuscatlán", lat: 13.683, lng: -89.244, status: "pending", order: 1, country: "SV", assignedTo: "LB" },
  { id: "PDV-SV-002", name: "Walmart Metrocentro", cat: "Hipermercado", channel: "Off-trade", dist: "Distribuidora CAM El Salvador", addr: "Metrocentro, San Salvador", lat: 13.701, lng: -89.224, status: "pending", order: 0, country: "SV", assignedTo: null },
];

/* ---------- PERSISTENCIA en localStorage ---------- */
const STORAGE_KEY = "abi-trade-catalog-v3-multipais";
const loadCatalog = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return PDVS_SEED;
};
const saveCatalog = (catalog) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog)); } catch (_) {}
};

const SURVEYS = [
  { key: "precios", label: "Precios", icon: Tag, color: T.primary },
  { key: "inventario", label: "Inventario", icon: Boxes, color: T.navy },
  { key: "neveras", label: "Neveras", icon: ThermometerSun, color: T.info },
  { key: "gondolas", label: "Góndolas", icon: LayoutGrid, color: T.success },
  { key: "pop", label: "Material POP", icon: Megaphone, color: T.warn },
  { key: "competencia", label: "Competencia", icon: Eye, color: T.danger },
];

/* ---------- UTILIDADES ---------- */
const haversine = (a, b) => {
  const R = 6371e3, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
};
const useIsDesktop = () => {
  const [d, setD] = useState(typeof window !== "undefined" && window.innerWidth >= 960);
  useEffect(() => {
    const h = () => setD(window.innerWidth >= 960);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return d;
};

/* ---------- ÍCONO DE MARCA: lúpulo ---------- */
const HopMark = ({ size = 24, color = T.ink }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2c2.5 1.6 2.5 4.4 0 6-2.5-1.6-2.5-4.4 0-6Z" fill={color} />
    <path d="M6 6.5c2.9.4 4.3 2.8 3.4 6-2.9-.4-4.3-2.8-3.4-6Z" fill={color} opacity=".82" />
    <path d="M18 6.5c.9 3.2-.5 5.6-3.4 6-.9-3.2.5-5.6 3.4-6Z" fill={color} opacity=".82" />
    <path d="M8 12.5c2.6 1 3.6 3.4 2.5 6.3-2.6-1-3.6-3.4-2.5-6.3Z" fill={color} opacity=".64" />
    <path d="M16 12.5c1.1 2.9.1 5.3-2.5 6.3-1.1-2.9-.1-5.3 2.5-6.3Z" fill={color} opacity=".64" />
    <circle cx="12" cy="20.5" r="1.6" fill={color} opacity=".45" />
  </svg>
);

/* ============================================================
   HOJA DE ESTILO GLOBAL (todas las animaciones via CSS)
   ============================================================ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap');

:root {
  --e-out: cubic-bezier(0.22, 1, 0.36, 1);
  --e-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --e-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; margin: 0; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: #E0D7C3; border-radius: 3px; }
button { font-family: inherit; }
input, textarea { font-family: inherit; }

/* --- entrada de pantalla --- */
.anim-screen { animation: scrIn .28s var(--e-out) both; }
@keyframes scrIn { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }

/* --- aparición con desplazamiento (cards, listas) --- */
.rise { animation: rise .42s var(--e-out) both; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

/* --- aparición simple --- */
.fade { animation: fade .3s var(--e-out) both; }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }

/* --- pop (badges, semáforo) — desde 0.92, nunca desde 0 --- */
.pop { animation: pop .26s var(--e-out) both; }
@keyframes pop { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }

/* --- toast --- */
.toast-in { animation: toastIn .34s var(--e-expo) both; }
@keyframes toastIn { from { opacity: 0; transform: translateY(20px) scale(.97); } to { opacity: 1; transform: none; } }

/* --- press: feedback táctil en cualquier elemento presionable --- */
.press { transition: transform .14s var(--e-out); }
.press:active { transform: scale(.97); }

/* --- lift: elevación en hover (solo punteros finos) --- */
.lift { transition: transform .2s var(--e-out), box-shadow .2s var(--e-out); }
@media (hover: hover) and (pointer: fine) {
  .lift:hover { transform: translateY(-3px); }
  .back-btn:hover { transform: translateX(-2px); }
  .row-link:hover { transform: translateY(-2px); }
  .report-row:hover { transform: translateX(3px); }
}

/* --- barras de progreso (width animado desde 0) --- */
.bar-fill { animation: barFill 1s var(--e-out) both; }
@keyframes barFill { from { width: 0; } to { width: var(--w); } }

/* --- barras verticales (height desde 0) --- */
.bar-grow { animation: barGrow .55s var(--e-out) both; }
@keyframes barGrow { from { height: 0; } to { height: var(--h); } }

/* --- anillo SVG --- */
.ring-fill { animation: ringFill 1.1s var(--e-out) both; }
@keyframes ringFill { from { stroke-dashoffset: var(--circ); } to { stroke-dashoffset: var(--off); } }

/* --- shimmer (skeleton) --- */
.shimmer {
  background: linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.bg} 50%, ${T.surfaceAlt} 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* --- spinner --- */
.spin { animation: spin .9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* --- barra indeterminada (IA) --- */
.scan { animation: scan 1.1s var(--e-in-out) infinite; }
@keyframes scan { 0% { transform: translateX(-110%); } 100% { transform: translateX(360%); } }

/* --- pulso del geofence --- */
.pulse-ring { animation: pulseRing 2.4s var(--e-in-out) infinite; }
@keyframes pulseRing { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.08); } }

/* --- aparición del pin de mapa (desde 0.5, no desde 0) --- */
.drop-in { animation: dropIn .4s var(--e-out) both; }
@keyframes dropIn { from { opacity: 0; transform: translate(-50%,-115%) scale(.5); } to { opacity: 1; transform: translate(-50%,-100%) scale(1); } }
.dot-in { animation: dotIn .36s var(--e-out) both; }
@keyframes dotIn { from { opacity: 0; transform: translate(-50%,-50%) scale(.4); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }

/* --- expansión de alerta --- */
.expand { animation: expand .3s var(--e-out) both; }
@keyframes expand { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 90px; } }

/* --- indicador deslizante de navegación --- */
.nav-pill { transition: transform .34s var(--e-out); }

/* --- input focus --- */
.fi { transition: border-color .15s var(--e-out), background-color .15s var(--e-out); }

/* --- accesibilidad: movimiento reducido --- */
@media (prefers-reduced-motion: reduce) {
  *, .anim-screen, .rise, .pop, .toast-in, .drop-in, .dot-in {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
  .shimmer, .spin, .scan, .pulse-ring { animation: none !important; }
}
`;

/* ============================================================
   APP RAÍZ
   ============================================================ */
export default function App() {
  const desktop = useIsDesktop();

  // Usuarios del sistema (persistidos)
  const [users, setUsers] = useState(() => loadUsers());
  useEffect(() => { saveUsers(users); }, [users]);

  // Sesión: { userId } | null
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("abi-session-v1")) || null; } catch { return null; }
  });
  useEffect(() => {
    try {
      if (session) localStorage.setItem("abi-session-v1", JSON.stringify(session));
      else localStorage.removeItem("abi-session-v1");
    } catch {}
  }, [session]);

  // Catálogo global compartido
  const [catalog, setCatalog] = useState(() => loadCatalog());
  useEffect(() => { saveCatalog(catalog); }, [catalog]);

  // Estado global de la cámara
  const [cameraReq, setCameraReq] = useState(null);
  const camApi = useMemo(() => ({
    open: (req) => setCameraReq(req),
    close: () => setCameraReq(null),
  }), []);

  // ¿Aún no hay sesión? → pantalla de login
  if (!session) {
    return (
      <CameraContext.Provider value={camApi}>
        <div style={{
          minHeight: "100vh",
          background: `radial-gradient(125% 80% at 50% 0%, #FFFEFA 0%, ${T.bg} 52%, #F0E9D8 100%)`,
          fontFamily: FONT, padding: desktop ? "28px 24px" : "16px 12px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <style>{STYLES}</style>
          <LoginScreen users={users} onLogin={(u) => setSession({ userId: u.id })} />
        </div>
      </CameraContext.Provider>
    );
  }

  // Resolver usuario actual desde la sesión
  const user = getUserById(users, session.userId);
  // Si el usuario fue eliminado mientras tenía sesión activa, cerrar sesión
  if (!user) { setSession(null); return null; }

  const isAdmin = user.role === "admin";
  const isSup = user.role === "supervisor";
  const isGvm = user.role === "gvm";

  return (
    <CameraContext.Provider value={camApi}>
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(125% 80% at 50% 0%, #FFFEFA 0%, ${T.bg} 52%, #F0E9D8 100%)`,
      fontFamily: FONT, padding: desktop ? "28px 24px" : "16px 12px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <style>{STYLES}</style>

      {/* ----- Barra superior ----- */}
      <div style={{
        width: "100%", maxWidth: 1200, display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: desktop ? 22 : 14, flexWrap: "wrap", gap: 12,
      }} className="fade">
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: `linear-gradient(145deg, ${T.primarySoft}, ${T.white})`,
            border: `1px solid ${T.border}`, display: "grid", placeItems: "center",
            boxShadow: "0 4px 14px rgba(198,138,18,.14)",
          }}>
            <HopMark size={24} color={T.primaryDim} />
          </div>
          <div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, color: T.ink, lineHeight: 1 }}>
              Trade Survey
            </div>
            <div style={{ fontSize: 10.5, letterSpacing: "1.6px", color: T.primaryDim, fontWeight: 700, marginTop: 3 }}>
              AB INBEV · CAM INTERNATIONAL
            </div>
          </div>
        </div>

        <UserChip user={user} onLogout={() => setSession(null)} />
      </div>

      <div key={user.id} className="anim-screen" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        {isGvm
          ? <FieldApp desktop={desktop} catalog={catalog} setCatalog={setCatalog} gvm={user} />
          : <SupervisorDashboard desktop={desktop} catalog={catalog} setCatalog={setCatalog} user={user} users={users} setUsers={setUsers} />}
      </div>
    </div>
    {/* Host del modal de cámara — vive en el root, fuera del anim-screen */}
    {cameraReq && <CameraHost request={cameraReq} onClose={() => setCameraReq(null)} />}
    </CameraContext.Provider>
  );
}

/* ---------- Chip del usuario con logout ---------- */
function UserChip({ user, onLogout }) {
  const c = user.country ? getCountry(user.country) : null;
  const roleLabel = user.role === "admin"
    ? "Administrador"
    : user.role === "supervisor"
      ? `Supervisor · ${c?.flag} ${c?.name}`
      : `GVM · ${c?.flag} ${c?.name}`;
  const tone = user.role === "admin" ? T.ink : user.role === "supervisor" ? T.navy : T.primary;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.surface, padding: 5, borderRadius: 13, border: `1px solid ${T.border}`, boxShadow: "0 2px 10px rgba(38,48,58,.05)" }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, color: T.white, flexShrink: 0,
        background: `linear-gradient(135deg, ${user.color || tone}, ${tone})`,
        display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12.5, letterSpacing: ".3px",
      }}>{user.initials}</div>
      <div style={{ paddingRight: 4 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: T.ink, lineHeight: 1 }}>{user.name}</div>
        <div style={{ fontSize: 10.5, color: T.textMed, fontWeight: 600, marginTop: 2 }}>{roleLabel}</div>
      </div>
      <button onClick={onLogout} className="press" title="Cerrar sesión" style={{
        border: "none", background: T.surfaceAlt, color: T.inkSoft,
        width: 32, height: 32, borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center",
      }}>
        <ChevronLeft size={16} style={{ transform: "rotate(180deg)" }} />
      </button>
    </div>
  );
}
/* ============================================================
   PANTALLA DE LOGIN
   ============================================================ */
function LoginScreen({ users, onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const submit = () => {
    setError(null);
    if (!identifier || !password) { setError("Completa todos los campos."); return; }
    setLoading(true);
    setTimeout(() => {
      const u = findUserByLogin(users, identifier, password);
      if (!u) { setError("Usuario o contraseña incorrectos."); setLoading(false); return; }
      onLogin(u);
    }, 400);
  };

  return (
    <div className="rise" style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px",
          background: `linear-gradient(145deg, ${T.primarySoft}, ${T.surface})`,
          border: `1px solid ${T.border}`, display: "grid", placeItems: "center",
          boxShadow: "0 10px 30px -10px rgba(198,138,18,.3)",
        }}>
          <HopMark size={36} color={T.primaryDim} />
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 600, color: T.ink, lineHeight: 1.1 }}>
          Trade Survey
        </div>
        <div style={{ fontSize: 12, color: T.primaryDim, fontWeight: 700, letterSpacing: "1.5px", marginTop: 6 }}>
          AB INBEV · INICIO DE SESIÓN
        </div>
      </div>

      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18,
        padding: 22, boxShadow: "0 20px 60px -30px rgba(38,48,58,.3)",
      }}>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: T.textLow, letterSpacing: ".4px" }}>USUARIO O EMAIL</span>
          <input type="text" autoComplete="username" value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="admin o admin@abinbev.com"
            style={{
              width: "100%", marginTop: 5, borderRadius: 10, padding: "11px 13px", fontSize: 13.5,
              color: T.ink, outline: "none", background: T.bg, border: `1.5px solid ${T.border}`,
              fontFamily: FONT, transition: "border-color .15s var(--e-out)",
            }} />
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: T.textLow, letterSpacing: ".4px" }}>CONTRASEÑA</span>
          <input type="password" autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="••••••"
            style={{
              width: "100%", marginTop: 5, borderRadius: 10, padding: "11px 13px", fontSize: 13.5,
              color: T.ink, outline: "none", background: T.bg, border: `1.5px solid ${T.border}`,
              fontFamily: FONT, transition: "border-color .15s var(--e-out)",
            }} />
        </label>

        {error && (
          <div className="pop" style={{
            background: T.dangerSoft, border: `1px solid #F1C8C5`, borderRadius: 10,
            padding: "9px 12px", marginBottom: 14, fontSize: 12, fontWeight: 700, color: T.danger,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <TriangleAlert size={14} /> {error}
          </div>
        )}

        <button onClick={submit} disabled={loading} className={loading ? "" : "press"} style={{
          width: "100%", border: "none", cursor: loading ? "default" : "pointer",
          background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`, color: T.white,
          padding: 13, borderRadius: 12, fontWeight: 800, fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 10px 22px -12px rgba(198,138,18,.6)",
        }}>
          {loading ? <><Loader2 size={16} className="spin" /> Entrando…</> : <>Iniciar sesión <ChevronRight size={16} /></>}
        </button>

        <button onClick={() => setShowHint(s => !s)} className="press" style={{
          width: "100%", marginTop: 12, border: `1px dashed ${T.border}`, background: "transparent",
          color: T.textMed, padding: "8px 12px", borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}>
          {showHint ? "Ocultar credenciales de demo" : "Ver credenciales de demo"}
        </button>

        {showHint && (
          <div className="fade" style={{
            marginTop: 10, background: T.bg, borderRadius: 10, padding: 11,
            fontSize: 11, color: T.inkSoft, lineHeight: 1.7, fontFamily: "monospace",
          }}>
            <div><b style={{ color: T.primaryDim }}>admin</b> / admin → Administrador global</div>
            <div><b style={{ color: T.primaryDim }}>sup.ve</b> / 1234 → Supervisor 🇻🇪 (sup.pa, sup.cr, sup.gt, sup.hn, sup.sv para los otros países)</div>
            <div><b style={{ color: T.primaryDim }}>eduardo</b> / 1234 → GVM 🇻🇪 (carlos 🇵🇦, carla 🇨🇷, jose 🇬🇹, maria 🇭🇳, luis 🇸🇻)</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 18, fontSize: 11, color: T.textLow, textAlign: "center", lineHeight: 1.5 }}>
        Prototipo de demostración. En producción se integraría con SSO corporativo.
      </div>
    </div>
  );
}
function FieldApp({ desktop, catalog, setCatalog, gvm }) {
  const [tab, setTab] = useState("home");
  const [activePdv, setActivePdv] = useState(null);
  const [screen, setScreen] = useState("list");
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [toast, setToast] = useState(null);
  const [checkedIn, setCheckedIn] = useState({}); // { [pdvId]: true }

  // PDVs asignados al GVM actual (de su país) y pool disponible (sin asignar, del mismo país)
  const pdvs = useMemo(() =>
    catalog.filter(p => p.assignedTo === gvm.id && p.country === gvm.country)
           .sort((a, b) => (a.order || 999) - (b.order || 999)),
    [catalog, gvm]);
  const pool = useMemo(() =>
    catalog.filter(p => !p.assignedTo && p.country === gvm.country),
    [catalog, gvm]);

  const showToast = (msg, kind = "ok") => { setToast({ msg, kind }); setTimeout(() => setToast(null), 2800); };
  const back = () => {
    if (screen === "survey" || screen === "checkin") setScreen("detail");
    else if (screen === "detail" || screen === "pool") setScreen("list");
    else setScreen("list");
  };
  const completePdv = (id) => setCatalog(c => c.map(x => x.id === id ? { ...x, status: "done" } : x));
  const assignToMe = (id) => {
    const nextOrder = pdvs.length + 1;
    setCatalog(c => c.map(x => x.id === id ? { ...x, assignedTo: gvm.id, order: nextOrder } : x));
    showToast("PDV agregado a tu itinerario");
  };

  return (
    <div style={{ display: "flex", gap: 28, alignItems: "flex-start", justifyContent: "center", width: "100%", maxWidth: 1100 }}>
      {desktop && <DesktopAside pdvs={pdvs} gvm={gvm} />}

      <div style={{
        width: desktop ? 412 : "100%", maxWidth: 440, flexShrink: 0,
        background: T.surface, borderRadius: desktop ? 34 : 24, overflow: "hidden",
        border: `1px solid ${T.border}`,
        boxShadow: desktop
          ? `0 40px 90px -30px rgba(38,48,58,.4), 0 0 0 10px ${T.white}, 0 0 0 11px ${T.border}`
          : "0 18px 50px -20px rgba(38,48,58,.3)",
        height: desktop ? 824 : 760, display: "flex", flexDirection: "column", position: "relative",
      }}>
        <StatusBar online={online} pending={pending} onToggle={() => setOnline(o => !o)} />
        <FieldHeader tab={tab} screen={screen} pdv={activePdv} survey={activeSurvey} onBack={back} gvm={gvm} />

        <div style={{ flex: 1, overflowY: "auto", background: T.bg }}>
          <div key={tab + screen} className="anim-screen">
            {tab === "home" && screen === "list" && <ItineraryScreen pdvs={pdvs} poolCount={pool.length} onPick={(p) => { setActivePdv(p); setScreen("detail"); }} onPool={() => setScreen("pool")} />}
            {tab === "home" && screen === "pool" && <PoolScreen pool={pool} onAssign={assignToMe} />}
            {tab === "map" && <CoverageMap pdvs={pdvs} onPick={(p) => { setActivePdv(p); setTab("home"); setScreen("detail"); }} />}
            {tab === "kpi" && <KpiScreen />}
            {tab === "profile" && <ProfileScreen gvm={gvm} catalog={catalog} />}
            {tab === "home" && screen === "detail" && activePdv &&
              <PdvDetail pdv={activePdv} checkedIn={!!checkedIn[activePdv.id]}
                onCheckin={() => setScreen("checkin")} onSurvey={(s) => { setActiveSurvey(s); setScreen("survey"); }} />}
            {tab === "home" && screen === "checkin" && activePdv &&
              <CheckinScreen pdv={activePdv} onDone={() => { setScreen("detail"); setCheckedIn(m => ({ ...m, [activePdv.id]: true })); showToast("Check-in registrado · GPS validado"); }} />}
            {tab === "home" && screen === "survey" && activeSurvey &&
              <SurveyScreen type={activeSurvey} pdv={activePdv} online={online}
                onComplete={() => { setScreen("detail"); if (!online) setPending(n => n + 1); completePdv(activePdv.id); showToast(online ? "Levantamiento sincronizado" : "Guardado · se sincronizará", online ? "ok" : "warn"); }} />}
          </div>
        </div>

        {toast && (
          <div key={toast.msg} className="toast-in" style={{
            position: "absolute", bottom: screen === "list" ? 90 : 20, left: 14, right: 14,
            background: toast.kind === "ok" ? T.success : T.warn, color: T.white,
            padding: "13px 16px", borderRadius: 14, fontSize: 13, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 9, zIndex: 40,
            boxShadow: "0 14px 32px -10px rgba(38,48,58,.5)",
          }}>
            {toast.kind === "ok" ? <CheckCircle2 size={18} /> : <TriangleAlert size={18} />}
            {toast.msg}
          </div>
        )}

        {screen === "list" && <TabBar tab={tab} setTab={setTab} />}
      </div>
    </div>
  );
}

function DesktopAside({ pdvs, gvm }) {
  const done = pdvs.filter(p => p.status === "done").length;
  const country = getCountry(gvm.country);
  return (
    <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }} className="rise">
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, color: T.ink, lineHeight: 1.15 }}>
          Jornada de campo
        </div>
        <div style={{ fontSize: 13, color: T.textMed, marginTop: 6 }}>
          Vista del GVM <b>{gvm.name}</b>. Interactúa con el dispositivo a la derecha.
        </div>
      </div>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: 18,
        boxShadow: "0 8px 26px -16px rgba(38,48,58,.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: T.primarySoft, display: "grid", placeItems: "center" }}>
            <Route size={16} color={T.primaryDim} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Itinerario de hoy</span>
        </div>
        {pdvs.length > 0
          ? <RingProgress value={done} total={pdvs.length} />
          : <div style={{ fontSize: 12, color: T.textMed, padding: "8px 0" }}>Sin PDVs asignados todavía. Revisa el pool del país.</div>}
      </div>
      {[
        ["País", `${country.flag} ${country.name}`, Compass],
        ["GVM", gvm.name, UserRound],
        ["Distribuidor", country.distributor, Store],
      ].map(([k, v, Ic], i) => (
        <div key={k} className="rise" style={{
          animationDelay: `${80 + i * 60}ms`,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
          padding: "13px 15px", display: "flex", alignItems: "center", gap: 11,
        }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: T.surfaceAlt, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Ic size={16} color={T.inkSoft} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: T.textLow, fontWeight: 700, letterSpacing: ".4px" }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{v}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RingProgress({ value, total }) {
  const pct = Math.round((value / total) * 100);
  const r = 34, c = 2 * Math.PI * r, off = c - (c * pct) / 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width="86" height="86" viewBox="0 0 86 86">
        <circle cx="43" cy="43" r={r} fill="none" stroke={T.surfaceAlt} strokeWidth="9" />
        <circle className="ring-fill" cx="43" cy="43" r={r} fill="none" stroke={T.primary} strokeWidth="9"
          strokeLinecap="round" strokeDasharray={c} transform="rotate(-90 43 43)"
          style={{ "--circ": c, "--off": off }} />
        <text x="43" y="48" textAnchor="middle" fontSize="20" fontWeight="800" fill={T.ink} fontFamily={FONT}>{pct}%</text>
      </svg>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, color: T.ink }}>
          {value}<span style={{ color: T.textLow, fontSize: 17 }}> / {total}</span>
        </div>
        <div style={{ fontSize: 12, color: T.textMed, fontWeight: 600 }}>PDVs completados</div>
      </div>
    </div>
  );
}

function StatusBar({ online, pending, onToggle }) {
  return (
    <div style={{
      background: T.surface, padding: "9px 18px 7px", display: "flex",
      alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: T.ink }}>9:24</span>
      <button onClick={onToggle} className="press" style={{
        border: "none", cursor: "pointer", padding: "4px 10px", borderRadius: 20,
        fontSize: 10.5, fontWeight: 800, display: "flex", alignItems: "center", gap: 5,
        background: online ? T.successSoft : T.dangerSoft, color: online ? T.success : T.danger,
        transition: "background-color .25s var(--e-out)",
      }}>
        {online ? <Wifi size={12} /> : <WifiOff size={12} />}
        {online ? "EN LÍNEA" : `OFFLINE · ${pending}`}
      </button>
    </div>
  );
}

function FieldHeader({ tab, screen, pdv, survey, onBack, gvm }) {
  const c = getCountry(gvm.country);
  let title = "Itinerario", sub = `${c.flag} ${c.name}`, Icon = Route;
  if (tab === "map") { title = "Cobertura"; sub = `Mapa · ${c.name}`; Icon = MapPin; }
  if (tab === "kpi") { title = "Mis KPIs"; sub = "Período Mayo 2026"; Icon = TrendingUp; }
  if (tab === "profile") { title = "Perfil"; sub = `GVM · ${c.name}`; Icon = UserRound; }
  if (screen === "pool") { title = "PDVs disponibles"; sub = `Pool de ${c.name}`; Icon = UserPlus; }
  if (screen === "detail") { title = pdv?.name; sub = `${pdv?.id} · ${pdv?.cat}`; Icon = Store; }
  if (screen === "checkin") { title = "Check-in"; sub = pdv?.name; Icon = Crosshair; }
  if (screen === "survey") { title = survey?.label; sub = pdv?.name; Icon = survey?.icon || Tag; }
  const showBack = screen !== "list";

  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.cream}, ${T.surface})`,
      padding: "13px 16px 15px", display: "flex", alignItems: "center", gap: 12,
      borderBottom: `1px solid ${T.border}`,
    }}>
      {showBack ? (
        <button onClick={onBack} className="press back-btn" style={{
          border: `1px solid ${T.border}`, background: T.surface, borderRadius: 11,
          width: 38, height: 38, display: "grid", placeItems: "center", cursor: "pointer",
          transition: "transform .15s var(--e-out)",
        }}>
          <ChevronLeft size={20} color={T.ink} />
        </button>
      ) : (
        <div style={{ width: 38, height: 38, borderRadius: 11, background: T.primarySoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon size={19} color={T.primaryDim} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, color: T.ink, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontSize: 11.5, color: T.primaryDim, fontWeight: 700, marginTop: 2 }}>{sub}</div>
      </div>
      {!showBack && (
        <button className="press" style={{ position: "relative", cursor: "pointer", border: "none", background: "transparent", padding: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: T.surface, border: `1px solid ${T.border}`, display: "grid", placeItems: "center" }}>
            <Bell size={18} color={T.inkSoft} />
          </div>
          <span style={{
            position: "absolute", top: -4, right: -4, background: T.danger, color: T.white,
            width: 17, height: 17, borderRadius: 9, fontSize: 9.5, fontWeight: 800,
            display: "grid", placeItems: "center", border: `2px solid ${T.white}`,
          }}>2</span>
        </button>
      )}
    </div>
  );
}

function TabBar({ tab, setTab }) {
  const tabs = [["home", Route, "Ruta"], ["map", MapPin, "Mapa"], ["kpi", BarChart3, "KPIs"], ["profile", UserRound, "Perfil"]];
  const idx = tabs.findIndex(([k]) => k === tab);
  return (
    <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, padding: "7px 6px 9px" }}>
      <div style={{ position: "relative", display: "flex" }}>
        {/* indicador deslizante */}
        <div className="nav-pill" style={{
          position: "absolute", top: 0, height: 30, width: `${100 / tabs.length}%`,
          transform: `translateX(${idx * 100}%)`,
          display: "grid", placeItems: "center", pointerEvents: "none",
        }}>
          <div style={{ width: 46, height: 30, borderRadius: 11, background: T.primarySoft }} />
        </div>
        {tabs.map(([k, Ic, l]) => {
          const on = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, border: "none", background: "transparent", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "0 0 0 0",
            }}>
              <div style={{ height: 30, display: "grid", placeItems: "center" }}>
                <Ic size={20} color={on ? T.primaryDim : T.textLow} strokeWidth={on ? 2.5 : 2}
                  style={{ transition: "color .25s var(--e-out)" }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: on ? T.primaryDim : T.textLow, transition: "color .25s var(--e-out)" }}>{l}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ItineraryScreen({ pdvs, poolCount, onPick, onPool }) {
  const done = pdvs.filter(p => p.status === "done").length;
  const total = pdvs.length || 1;
  const pct = Math.round((done / total) * 100);
  return (
    <div style={{ padding: 16 }}>
      <div className="rise" style={{
        background: `linear-gradient(140deg, ${T.surface}, ${T.cream})`,
        border: `1px solid ${T.border}`, borderRadius: 20, padding: 18, marginBottom: 16,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -28, top: -28, opacity: .07 }}>
          <Sun size={150} color={T.primary} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.primaryDim, letterSpacing: "1px" }}>AVANCE DE LA JORNADA</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: 8, marginBottom: 14 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 42, fontWeight: 600, color: T.ink, lineHeight: 1 }}>
            {done}<span style={{ fontSize: 22, color: T.textLow }}> / {pdvs.length}</span>
          </div>
          <div style={{ paddingBottom: 4 }}>
            <div style={{ fontSize: 12, color: T.textMed, fontWeight: 700 }}>PDVs visitados</div>
            <div style={{ fontSize: 12, color: T.success, fontWeight: 800 }}>{pct}% cobertura</div>
          </div>
        </div>
        <div style={{ height: 9, background: T.surfaceAlt, borderRadius: 5, overflow: "hidden" }}>
          <div className="bar-fill" style={{ "--w": `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${T.primary}, ${T.primaryDim})`, borderRadius: 5 }} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: T.textLow, letterSpacing: ".8px" }}>
          MI ITINERARIO · {pdvs.length} {pdvs.length === 1 ? "PDV" : "PDVs"}
        </span>
        {poolCount > 0 && (
          <button onClick={onPool} className="press" style={{
            border: `1px solid ${T.primary}`, background: T.primarySoft, color: T.primaryDim,
            borderRadius: 9, padding: "5px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <UserPlus size={12} /> Pool · {poolCount}
          </button>
        )}
      </div>

      {pdvs.length === 0 && (
        <EmptyState icon={UserPlus} title="Sin PDVs asignados"
          text={poolCount > 0 ? `Hay ${poolCount} PDVs en el pool. Toca el botón Pool para asignártelos.` : "Espera a que el administrador cargue el catálogo de puntos de venta."} />
      )}

      {pdvs.map((p, i) => {
        const done = p.status === "done";
        return (
          <button key={p.id} onClick={() => onPick(p)} className="press lift row-link rise" style={{
            animationDelay: `${i * 55}ms`,
            width: "100%", textAlign: "left", border: `1px solid ${T.border}`,
            background: T.surface, borderRadius: 16, padding: 13, marginBottom: 10,
            cursor: "pointer", display: "flex", gap: 12, alignItems: "center",
            boxShadow: "0 3px 12px -8px rgba(38,48,58,.18)",
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 13,
              background: done ? T.successSoft : T.primarySoft,
              display: "grid", placeItems: "center", flexShrink: 0,
            }}>
              {done ? <CheckCircle2 size={20} color={T.success} />
                : <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 18, color: T.primaryDim }}>{p.order}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: T.textMed, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Store size={11} /> {p.cat} · {p.channel}
              </div>
              <span style={{
                marginTop: 7, display: "inline-flex", alignItems: "center", gap: 4,
                background: done ? T.successSoft : T.surfaceAlt,
                color: done ? T.success : T.textMed,
                padding: "3px 9px", borderRadius: 20, fontSize: 10.5, fontWeight: 800,
              }}>
                {done ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                {done ? "Completado" : "Pendiente"}
              </span>
            </div>
            <ChevronRight size={18} color={T.textLow} />
          </button>
        );
      })}
    </div>
  );
}

function PoolScreen({ pool, onAssign }) {
  const [filter, setFilter] = useState("Todos");
  const cats = ["Todos", ...Array.from(new Set(pool.map(p => p.cat)))];
  const filtered = filter === "Todos" ? pool : pool.filter(p => p.cat === filter);

  return (
    <div style={{ padding: 16 }}>
      <div className="rise" style={{
        background: `linear-gradient(140deg, ${T.surface}, ${T.cream})`,
        border: `1px solid ${T.border}`, borderRadius: 18, padding: 16, marginBottom: 14,
        display: "flex", gap: 12, alignItems: "center",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: T.primarySoft,
          display: "grid", placeItems: "center", flexShrink: 0,
        }}>
          <UserPlus size={22} color={T.primaryDim} />
        </div>
        <div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: T.ink }}>
            {pool.length} {pool.length === 1 ? "PDV disponible" : "PDVs disponibles"}
          </div>
          <div style={{ fontSize: 11.5, color: T.textMed, marginTop: 2 }}>
            Toca un PDV para agregarlo a tu itinerario de hoy.
          </div>
        </div>
      </div>

      {cats.length > 2 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)} className="press" style={{
              border: `1px solid ${filter === c ? T.primary : T.border}`,
              background: filter === c ? T.primary : T.surface,
              color: filter === c ? T.white : T.inkSoft,
              padding: "5px 11px", borderRadius: 18, fontSize: 11, fontWeight: 700, cursor: "pointer",
              transition: "background-color .2s var(--e-out)",
            }}>{c}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Database} title="Pool vacío"
          text="No quedan PDVs disponibles en este momento. El administrador puede cargar más desde el dashboard." />
      ) : (
        filtered.map((p, i) => (
          <div key={p.id} className="rise lift" style={{
            animationDelay: `${i * 50}ms`,
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 15,
            padding: 13, marginBottom: 10, display: "flex", gap: 11, alignItems: "center",
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, background: T.surfaceAlt,
              display: "grid", placeItems: "center", flexShrink: 0,
            }}>
              <Store size={18} color={T.inkSoft} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
              <div style={{ fontSize: 10.5, color: T.textMed, marginTop: 2 }}>
                {p.cat} · {p.channel}
              </div>
              <div style={{ fontSize: 10, color: T.textLow, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={9} /> {p.addr}
              </div>
            </div>
            <button onClick={() => onAssign(p.id)} className="press" style={{
              border: "none", cursor: "pointer", flexShrink: 0,
              background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`, color: T.white,
              padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 800,
              display: "flex", alignItems: "center", gap: 5,
              boxShadow: "0 6px 14px -6px rgba(198,138,18,.5)",
            }}>
              <Plus size={13} /> Asignar
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function PdvDetail({ pdv, checkedIn, onCheckin, onSurvey }) {
  return (
    <div style={{ padding: 16 }}>
      <div className="rise" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden", marginBottom: 14 }}>
        <div style={{
          height: 116, background: `linear-gradient(135deg, ${T.primarySoft}, ${T.cream})`,
          position: "relative", display: "grid", placeItems: "center",
        }}>
          <Store size={46} color={T.primary} strokeWidth={1.5} style={{ opacity: .55 }} />
          <div style={{
            position: "absolute", bottom: 10, left: 12, background: T.surface,
            color: T.inkSoft, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 9,
            display: "flex", alignItems: "center", gap: 5, border: `1px solid ${T.border}`,
          }}>
            <MapPin size={12} color={T.primary} /> {pdv.addr}
          </div>
        </div>
        <div style={{ padding: 14, display: "flex", gap: 7, flexWrap: "wrap" }}>
          {[pdv.channel, pdv.cat, pdv.dist].map((x) => (
            <span key={x} style={{ background: T.surfaceAlt, color: T.inkSoft, fontSize: 10.5, fontWeight: 700, padding: "5px 10px", borderRadius: 20 }}>{x}</span>
          ))}
        </div>
      </div>

      {!checkedIn ? (
        <button onClick={onCheckin} className="press rise" style={{
          width: "100%", border: "none", cursor: "pointer", marginBottom: 16, animationDelay: "70ms",
          background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`, color: T.white,
          padding: 15, borderRadius: 15, fontWeight: 800, fontSize: 14.5,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
          boxShadow: "0 12px 26px -12px rgba(198,138,18,.6)",
        }}>
          <Crosshair size={19} /> Realizar Check-in
        </button>
      ) : (
        <div className="pop" style={{
          background: T.successSoft, border: `1px solid #BEE5CD`, borderRadius: 14,
          padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
        }}>
          <CheckCircle2 size={19} color={T.success} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.ink }}>Check-in confirmado · 9:24 a.m.</div>
            <div style={{ fontSize: 11, color: T.textMed }}>GPS validado · 18 m del PDV registrado</div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11.5, fontWeight: 800, color: T.textLow, letterSpacing: ".8px", marginBottom: 10 }}>
        SELECCIONAR LEVANTAMIENTO
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, opacity: checkedIn ? 1 : .45, pointerEvents: checkedIn ? "auto" : "none", transition: "opacity .3s var(--e-out)" }}>
        {SURVEYS.map((s, i) => (
          <button key={s.key} onClick={() => onSurvey(s)} className="press lift rise" style={{
            animationDelay: `${100 + i * 45}ms`,
            border: `1px solid ${T.border}`, background: T.surface, borderRadius: 15,
            padding: "15px 13px", cursor: "pointer", textAlign: "left",
            boxShadow: "0 3px 10px -8px rgba(38,48,58,.2)",
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: s.color + "1A", display: "grid", placeItems: "center", marginBottom: 9 }}>
              <s.icon size={19} color={s.color} />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{s.label}</div>
          </button>
        ))}
      </div>
      {!checkedIn && (
        <div style={{ fontSize: 11, color: T.textMed, textAlign: "center", marginTop: 12 }}>
          Realiza el check-in para habilitar los levantamientos
        </div>
      )}
    </div>
  );
}

function CheckinScreen({ pdv, onDone }) {
  const [phase, setPhase] = useState("locating");
  const [distance, setDistance] = useState(null);
  const [photo, setPhoto] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDistance(haversine({ lat: pdv.lat + 0.00012, lng: pdv.lng - 0.00008 }, pdv));
      setPhase("photo");
    }, 1900);
    return () => clearTimeout(t);
  }, [pdv]);

  const inFence = distance !== null && distance <= 50;

  return (
    <div style={{ padding: 16 }}>
      <div style={{
        height: 210, borderRadius: 18, overflow: "hidden", position: "relative",
        background: `linear-gradient(135deg, ${T.infoSoft}, #E8F2EA)`, marginBottom: 14,
        border: `1px solid ${T.border}`,
      }}>
        <MapGrid />
        <div className="pulse-ring" style={{
          position: "absolute", left: "50%", top: "50%",
          width: 134, height: 134, borderRadius: "50%",
          border: `2px dashed ${inFence ? T.success : T.warn}`,
          background: (inFence ? T.success : T.warn) + "16",
        }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
          <div style={{ width: 34, height: 34, borderRadius: "12px 12px 12px 3px", background: T.danger, display: "grid", placeItems: "center", boxShadow: "0 4px 10px rgba(38,48,58,.3)" }}>
            <Store size={17} color={T.white} />
          </div>
        </div>
        {phase !== "locating" && (
          <div className="dot-in" style={{ position: "absolute", left: "58%", top: "43%" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.info, border: `3px solid ${T.white}`, boxShadow: "0 2px 7px rgba(38,48,58,.3)" }} />
          </div>
        )}
        <div style={{
          position: "absolute", bottom: 10, left: 10, right: 10, background: T.surface,
          color: T.inkSoft, fontSize: 11, fontWeight: 700, padding: "7px 11px", borderRadius: 10,
          border: `1px solid ${T.border}`,
        }}>
          {phase === "locating"
            ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Loader2 size={13} className="spin" /> Obteniendo ubicación GPS…</span>
            : <span>Distancia al PDV: <b style={{ color: inFence ? T.success : T.warn }}>{distance} m</b> · Tolerancia 50 m</span>}
        </div>
      </div>

      {phase === "locating" ? (
        <SkeletonBlock lines={3} />
      ) : (
        <div className="fade">
          <div style={{
            background: inFence ? T.successSoft : T.warnSoft,
            border: `1px solid ${inFence ? "#BEE5CD" : "#EFDAAD"}`,
            borderRadius: 14, padding: "12px 14px", marginBottom: 14,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            {inFence ? <CheckCircle2 size={19} color={T.success} /> : <TriangleAlert size={19} color={T.warn} />}
            <div style={{ fontSize: 12, color: T.ink, fontWeight: 700 }}>
              {inFence ? "Dentro del radio del PDV. Check-in habilitado." : "Fuera del radio. El supervisor recibirá una alerta."}
            </div>
          </div>

          <SectionLabel>Foto de fachada · obligatoria</SectionLabel>
          <LiveCameraButton captured={photo} onCapture={() => setPhoto(true)} label="Tomar foto del local" big />

          <PrimaryButton disabled={!photo} onClick={onDone} label="Confirmar Check-in" icon={Check} />
        </div>
      )}
    </div>
  );
}

function MapGrid() {
  return (
    <svg width="100%" height="100%" style={{ position: "absolute" }}>
      {[...Array(9)].map((_, i) => <line key={"h" + i} x1="0" y1={i * 26} x2="100%" y2={i * 26} stroke={T.white} strokeWidth="1.2" opacity=".6" />)}
      {[...Array(15)].map((_, i) => <line key={"v" + i} x1={i * 30} y1="0" x2={i * 30} y2="100%" stroke={T.white} strokeWidth="1.2" opacity=".6" />)}
    </svg>
  );
}

/* ============================================================
   LEVANTAMIENTOS
   ============================================================ */
function SurveyScreen({ type, pdv, online, onComplete }) {
  if (type.key === "precios" || type.key === "competencia") return <PriceSurvey type={type} online={online} onComplete={onComplete} />;
  if (type.key === "neveras") return <CoolerSurvey online={online} onComplete={onComplete} />;
  return <GenericSurvey type={type} pdv={pdv} online={online} onComplete={onComplete} />;
}

function PriceSurvey({ type, online, onComplete }) {
  const [rows, setRows] = useState([]);
  const [ai, setAi] = useState("idle");
  const [err, setErr] = useState(null);
  const [evidencePhoto, setEvidencePhoto] = useState(false);

  const semaforo = (price, psv) => {
    const d = Math.abs(price - psv) / psv;
    if (d <= 0.05) return { c: T.success, t: "OK" };
    if (d <= 0.15) return { c: T.warn, t: "Desv." };
    return { c: T.danger, t: "Alerta" };
  };

  const analyze = async (file) => {
    setAi("analyzing"); setErr(null);
    try {
      // 1) Validar archivo
      if (!file || !(file instanceof Blob)) {
        throw new Error("No se recibió la foto correctamente. Intenta capturarla de nuevo.");
      }
      // 2) Convertir a base64
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => {
          const result = r.result;
          if (typeof result === "string" && result.includes(",")) res(result.split(",")[1]);
          else rej(new Error("No se pudo leer la imagen capturada."));
        };
        r.onerror = () => rej(new Error("Error al leer el archivo de imagen."));
        r.readAsDataURL(file);
      });
      if (!b64 || b64.length < 100) throw new Error("La imagen está vacía o es muy pequeña.");

      // 3) Llamar a la API de Claude con visión
      const prompt = `Eres el motor de visión de una plataforma de trade marketing de AB InBev en Centroamérica. Analiza esta foto de un punto de venta (góndola, nevera o anaquel de cervezas).
Identifica TODOS los productos de cerveza visibles, sean de AB InBev o de competencia. Para cada uno proporciona: marca (ej. Corona, Heineken), empaque (lata o botella), y si hay etiqueta de precio legible, el precio en USD.
Responde ÚNICAMENTE con un objeto JSON válido sin markdown ni texto adicional, con esta estructura exacta:
{"items":[{"brand":"string","pack":"string","price":number|null,"confidence":number}],"facings_abi":number,"facings_total":number}
- confidence va de 0 a 100.
- facings_abi cuenta los frentes (caras visibles) de marcas AB InBev: Corona, Budweiser, Stella Artois, Modelo, Atlas, Balboa.
- facings_total es el total de frentes de cervezas visibles.
- Si la foto no muestra cervezas claramente, devuelve items vacío y ceros.`;

      const mediaType = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
            { type: "text", text: prompt },
          ] }],
        }),
      });

      // 4) Validar respuesta HTTP
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`La IA respondió con error ${resp.status}. ${body.slice(0, 120)}`);
      }
      const data = await resp.json();

      // 5) Extraer texto de la respuesta
      if (!data.content || !Array.isArray(data.content)) {
        throw new Error("La respuesta de la IA no tiene el formato esperado.");
      }
      const text = data.content.filter(i => i.type === "text").map(i => i.text).join("").trim();
      if (!text) throw new Error("La IA respondió vacío. Intenta con una foto más nítida.");

      // 6) Parsear JSON (la IA a veces incluye markdown)
      const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch {
        // Intentar extraer el JSON con regex si la respuesta tiene prefijo o sufijo
        const m = clean.match(/\{[\s\S]*\}/);
        if (m) {
          try { parsed = JSON.parse(m[0]); } catch { /* nada */ }
        }
        if (!parsed) throw new Error(`La IA respondió pero no en formato JSON. Respuesta: "${text.slice(0, 80)}…"`);
      }

      // 7) Procesar productos
      const items = Array.isArray(parsed.items) ? parsed.items : [];
      if (items.length === 0) {
        setErr("La IA no detectó productos en esta foto. Asegúrate de fotografiar el anaquel completo y con buena luz, o agrégalos manualmente con +Manual.");
        setAi("idle");
        return;
      }

      const detected = items.map((it, i) => {
        const m = SKUS.find(s => s.brand.toLowerCase() === String(it.brand || "").toLowerCase());
        return {
          id: "ai" + i + "-" + Date.now(),
          brand: String(it.brand || "—"),
          pack: String(it.pack || "—"),
          price: it.price ?? "",
          psv: m?.psv ?? null,
          abi: m?.abi ?? false,
          confidence: Math.round(it.confidence ?? 70),
          ai: true,
        };
      });
      setRows(r => [...r, ...detected]);
      setAi("done");
    } catch (e) {
      console.error("[Análisis IA] Falló:", e);
      const msg = e?.message || "Error desconocido al analizar la imagen.";
      setErr(msg);
      setAi("idle");
    }
  };

  const upd = (id, f, v) => setRows(r => r.map(x => x.id === id ? { ...x, [f]: v } : x));
  const del = (id) => setRows(r => r.filter(x => x.id !== id));
  const addManual = () => setRows(r => [...r, { id: "m" + Date.now(), brand: "", pack: "", price: "", psv: null, abi: true }]);

  return (
    <div style={{ padding: 16, paddingBottom: 24 }}>
      <div className="rise" style={{
        background: `linear-gradient(140deg, ${T.surface}, ${T.cream})`,
        border: `1px solid ${T.border}`, borderRadius: 18, padding: 16, marginBottom: 14,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, opacity: .08 }}><Sparkles size={120} color={T.primary} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Sparkles size={17} color={T.primaryDim} />
          <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: T.ink }}>Análisis automático por IA</span>
        </div>
        <div style={{ fontSize: 11.5, color: T.textMed, marginBottom: 13 }}>
          Toma una foto de la góndola o nevera. La IA detecta marcas, empaques y precios.
          La cámara se abre en vivo · no se aceptan fotos guardadas.
        </div>
        {ai === "analyzing" ? (
          <div style={{
            width: "100%", background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`, color: T.white,
            padding: 13, borderRadius: 13, fontWeight: 800, fontSize: 13.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 10px 22px -12px rgba(198,138,18,.6)", opacity: .85,
          }}>
            <Loader2 size={17} className="spin" /> Procesando imagen…
          </div>
        ) : (
          <LiveCameraButton captured={false} onCapture={(file) => analyze(file)} label="Capturar y analizar (cámara en vivo)" big />
        )}
        {ai === "analyzing" && (
          <div style={{ marginTop: 10, height: 5, background: T.surfaceAlt, borderRadius: 3, overflow: "hidden" }}>
            <div className="scan" style={{ height: "100%", width: "30%", background: T.primary, borderRadius: 3 }} />
          </div>
        )}
        {err && (
          <div style={{
            marginTop: 10, fontSize: 11.5, color: T.danger, fontWeight: 600,
            background: T.dangerSoft, border: `1px solid #F1C8C5`, borderRadius: 9,
            padding: "8px 11px", lineHeight: 1.4, wordBreak: "break-word",
            display: "flex", gap: 7, alignItems: "flex-start",
          }}>
            <TriangleAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{err}</span>
          </div>
        )}
        {!online && <div style={{ marginTop: 10, fontSize: 11, color: T.warn, fontWeight: 700, display: "flex", gap: 5, alignItems: "center" }}><WifiOff size={12} /> Sin conexión: la imagen se encolará.</div>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: T.textLow, letterSpacing: ".8px" }}>
          SKUs DETECTADOS · {rows.length}
        </span>
        <button onClick={addManual} className="press" style={{
          border: `1px solid ${T.border}`, background: T.surface, borderRadius: 9,
          padding: "5px 11px", fontSize: 11, fontWeight: 700, color: T.inkSoft, cursor: "pointer",
        }}>+ Manual</button>
      </div>

      {ai === "analyzing" && rows.length === 0 && <><SkeletonCard /><SkeletonCard /></>}

      {rows.length === 0 && ai !== "analyzing" && (
        <EmptyState icon={ScanLine} title="Sin productos aún"
          text="Captura una foto del anaquel o agrega los SKUs manualmente." />
      )}

      {rows.map((row) => {
        const s = row.price && row.psv ? semaforo(parseFloat(row.price), row.psv) : null;
        return (
          <div key={row.id} className="pop" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 15, padding: 13, marginBottom: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              {row.ai && (
                <span style={{ background: T.primarySoft, color: T.primaryDim, fontSize: 9.5, fontWeight: 800,
                  padding: "3px 7px", borderRadius: 6, display: "flex", alignItems: "center", gap: 3 }}>
                  <Sparkles size={9} /> IA {row.confidence}%
                </span>
              )}
              <span style={{
                fontSize: 9.5, fontWeight: 800, padding: "3px 7px", borderRadius: 6,
                background: row.abi ? T.primarySoft : T.surfaceAlt, color: row.abi ? T.primaryDim : T.textMed,
              }}>{row.abi ? "AB INBEV" : "COMPETENCIA"}</span>
              <button onClick={() => del(row.id)} className="press" style={{ marginLeft: "auto", border: "none", background: "transparent", cursor: "pointer", color: T.textLow }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 8, marginBottom: 8 }}>
              <FieldInput label="Marca" value={row.brand} onChange={v => upd(row.id, "brand", v)} />
              <FieldInput label="Empaque" value={row.pack} onChange={v => upd(row.id, "pack", v)} />
            </div>
            <div style={{ display: "flex", gap: 9, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <FieldInput label="Precio observado (USD)" type="number" value={row.price} onChange={v => upd(row.id, "price", v)} />
              </div>
              {row.psv && (
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 9.5, color: T.textLow, fontWeight: 700 }}>PSV ${row.psv.toFixed(2)}</div>
                  {s && (
                    <div key={s.t} className="pop" style={{
                      background: s.c, color: T.white, fontSize: 11, fontWeight: 800,
                      padding: "6px 12px", borderRadius: 9, marginTop: 3,
                    }}>{s.t}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 18 }}>
        <SectionLabel>Foto de evidencia · obligatoria</SectionLabel>
        <LiveCameraButton captured={evidencePhoto} onCapture={() => setEvidencePhoto(true)} label="Foto general del anaquel" />
      </div>

      <SurveyFooter onComplete={onComplete} ready={rows.length > 0 && evidencePhoto} online={online}
        hint={rows.length === 0 ? "Detecta o agrega al menos un SKU" : !evidencePhoto ? "Captura la foto de evidencia" : null} />
    </div>
  );
}

function CoolerSurvey({ online, onComplete }) {
  const [estado, setEstado] = useState("");
  const [share, setShare] = useState(60);
  const [plano, setPlano] = useState(null);
  const [brand, setBrand] = useState(null);
  const [photo, setPhoto] = useState(false);

  return (
    <div style={{ padding: 16, paddingBottom: 24 }}>
      <SectionLabel>Identificación del equipo</SectionLabel>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 13, marginBottom: 14 }}>
        <button className="press" style={{
          width: "100%", border: `1.5px dashed ${T.info}`, background: T.infoSoft,
          color: T.info, padding: 11, borderRadius: 11, fontSize: 12.5, fontWeight: 800,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        }}>
          <ScanLine size={16} /> Escanear QR del equipo
        </button>
        <div style={{ fontSize: 11, color: T.textMed, marginTop: 8, textAlign: "center" }}>
          Equipo detectado: <b style={{ color: T.ink }}>NEV-PTY-00471</b>
        </div>
      </div>

      <SectionLabel>Estado general</SectionLabel>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["Excelente", "Bueno", "Regular", "Malo", "Fuera de servicio"].map(e => (
          <button key={e} onClick={() => setEstado(e)} className="press" style={{
            border: `1px solid ${estado === e ? T.primary : T.border}`,
            background: estado === e ? T.primary : T.surface,
            color: estado === e ? T.white : T.inkSoft,
            padding: "7px 12px", borderRadius: 20, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
            transition: "background-color .2s var(--e-out), border-color .2s var(--e-out)",
          }}>{e}</button>
        ))}
      </div>

      <SectionLabel>Share of Cooler · % AB InBev</SectionLabel>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
          <span style={{ fontSize: 12, color: T.textMed, fontWeight: 700 }}>AB InBev vs Competencia</span>
          <span style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 700, color: T.primaryDim }}>{share}%</span>
        </div>
        <input type="range" min="0" max="100" value={share} onChange={e => setShare(+e.target.value)}
          style={{ width: "100%", accentColor: T.primary }} />
        <div style={{ display: "flex", height: 26, borderRadius: 9, overflow: "hidden", marginTop: 9 }}>
          <div style={{ width: share + "%", background: `linear-gradient(90deg,${T.primary},${T.primaryDim})`, display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, color: T.white, transition: "width .2s var(--e-out)" }}>
            {share > 16 && "AB InBev"}
          </div>
          <div style={{ flex: 1, background: T.surfaceAlt, display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, color: T.textMed }}>
            {100 - share > 16 && "Competencia"}
          </div>
        </div>
      </div>

      <SectionLabel>Cumplimiento</SectionLabel>
      <YesNo label="Cumple planograma de referencia" value={plano} onChange={setPlano} />
      <YesNo label="Branding AB InBev visible" value={brand} onChange={setBrand} />

      <SectionLabel>Evidencia fotográfica · obligatoria</SectionLabel>
      <LiveCameraButton captured={photo} onCapture={() => setPhoto(true)} label="Frente del equipo abierto" />

      <SurveyFooter onComplete={onComplete} ready={!!estado && photo} online={online}
        hint={!estado ? "Selecciona el estado del equipo" : !photo ? "Captura la evidencia fotográfica" : null} />
    </div>
  );
}

function GenericSurvey({ type, pdv, online, onComplete }) {
  const [photo, setPhoto] = useState(false);
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(0);
  const isInv = type.key === "inventario";

  return (
    <div style={{ padding: 16, paddingBottom: 24 }}>
      <div style={{
        background: type.color + "12", border: `1px solid ${type.color}30`, borderRadius: 14,
        padding: 13, marginBottom: 16, display: "flex", gap: 11, alignItems: "center",
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: type.color, display: "grid", placeItems: "center" }}>
          <type.icon size={20} color={T.white} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: T.ink }}>Levantamiento de {type.label}</div>
          <div style={{ fontSize: 11, color: T.textMed }}>{pdv?.name}</div>
        </div>
      </div>

      {isInv && (
        <>
          <SectionLabel>Unidades visibles</SectionLabel>
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14,
            display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Corona Extra 355ml</span>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <Stepper onClick={() => setCount(c => Math.max(0, c - 1))}>−</Stepper>
              <span key={count} className="pop" style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, minWidth: 30, textAlign: "center", color: T.ink }}>{count}</span>
              <Stepper onClick={() => setCount(c => c + 1)}>+</Stepper>
            </div>
          </div>
          {count === 0 && (
            <div className="expand" style={{
              background: T.dangerSoft, border: `1px solid #F1C8C5`, borderRadius: 12,
              padding: "10px 13px", marginBottom: 14, fontSize: 11.5, fontWeight: 700, color: T.danger,
              display: "flex", alignItems: "center", gap: 7, overflow: "hidden",
            }}>
              <TriangleAlert size={14} /> Quiebre de stock (OOS) · alerta al supervisor
            </div>
          )}
        </>
      )}

      <SectionLabel>Evidencia fotográfica</SectionLabel>
      <LiveCameraButton captured={photo} onCapture={() => setPhoto(true)} label="Tomar foto" />

      <SectionLabel>Observaciones</SectionLabel>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
        placeholder="Notas del levantamiento…" style={{
          width: "100%", border: `1px solid ${T.border}`, borderRadius: 12, padding: 11,
          fontSize: 13, resize: "none", outline: "none", background: T.surface, color: T.ink, marginBottom: 16,
        }} />

      <SurveyFooter onComplete={onComplete} ready={photo} online={online}
        hint={!photo ? "Captura al menos una foto de evidencia" : null} />
    </div>
  );
}

function CoverageMap({ pdvs, onPick }) {
  const b = useMemo(() => {
    const la = pdvs.map(p => p.lat), ln = pdvs.map(p => p.lng);
    return { minLat: Math.min(...la), maxLat: Math.max(...la), minLng: Math.min(...ln), maxLng: Math.max(...ln) };
  }, [pdvs]);
  const pos = p => ({
    x: 14 + ((p.lng - b.minLng) / (b.maxLng - b.minLng || 1)) * 72,
    y: 16 + ((b.maxLat - p.lat) / (b.maxLat - b.minLat || 1)) * 60,
  });
  const done = pdvs.filter(p => p.status === "done").length;

  return (
    <div style={{ padding: 16 }}>
      <div style={{
        height: 360, borderRadius: 18, background: `linear-gradient(135deg, ${T.infoSoft}, #E8F2EA)`,
        position: "relative", border: `1px solid ${T.border}`, overflow: "hidden", marginBottom: 14,
      }}>
        <MapGrid />
        {pdvs.map((p, i) => {
          const { x, y } = pos(p);
          const col = p.status === "done" ? T.success : T.textMed;
          return (
            <button key={p.id} onClick={() => onPick(p)} className="drop-in" style={{
              animationDelay: `${i * 75}ms`,
              position: "absolute", left: x + "%", top: y + "%",
              border: "none", background: "transparent", cursor: "pointer", padding: 0,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50% 50% 50% 3px", background: col,
                transform: "rotate(45deg)", boxShadow: "0 5px 12px rgba(38,48,58,.3)",
                display: "grid", placeItems: "center", border: `2px solid ${T.white}`,
              }}>
                <Store size={14} color={T.white} style={{ transform: "rotate(-45deg)" }} />
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 14 }}>
        {[["Visitado", T.success], ["Pendiente", T.textMed]].map(([t, c]) => (
          <span key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: c }} /> {t}
          </span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <MetricCard icon={Target} label="Cobertura del día" value={Math.round(done / pdvs.length * 100) + "%"} tone={T.success} />
        <MetricCard icon={MapPin} label="PDVs en ruta" value={pdvs.length} tone={T.primary} />
      </div>
    </div>
  );
}

function KpiScreen() {
  const kpis = [
    { label: "Share of Shelf", value: "62%", trend: 4, icon: LayoutGrid, good: true },
    { label: "Share of Cooler", value: "58%", trend: -2, icon: Snowflake, good: false },
    { label: "Price Compliance", value: "84%", trend: 6, icon: Tag, good: true },
    { label: "OOS Rate", value: "9%", trend: -3, icon: PackageOpen, good: true },
  ];
  const bars = [["Lun", 5], ["Mar", 6], ["Mié", 4], ["Jue", 7], ["Vie", 4], ["Sáb", 0]];
  const max = 7;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {kpis.map((k, i) => (
          <div key={k.label} className="rise" style={{
            animationDelay: `${i * 60}ms`,
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 15, padding: 14,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: T.surfaceAlt, display: "grid", placeItems: "center" }}>
                <k.icon size={16} color={T.inkSoft} />
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 800, color: k.good ? T.success : T.danger,
                background: k.good ? T.successSoft : T.dangerSoft, padding: "3px 7px", borderRadius: 7,
                display: "flex", alignItems: "center", gap: 2,
              }}>
                {k.trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {Math.abs(k.trend)}
              </span>
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 27, fontWeight: 700, color: T.ink, marginTop: 8 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: T.textMed, fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div className="rise" style={{ animationDelay: "240ms", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: T.ink, marginBottom: 16 }}>PDVs visitados · esta semana</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 116 }}>
          {bars.map(([d, v], i) => (
            <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.inkSoft }}>{v || ""}</div>
              <div className="bar-grow" style={{
                "--h": `${(v / max) * 80 + 4}px`, animationDelay: `${300 + i * 70}ms`,
                width: "100%", background: v ? `linear-gradient(180deg,${T.primary},${T.primaryDim})` : T.surfaceAlt,
                borderRadius: "6px 6px 0 0",
              }} />
              <div style={{ fontSize: 10, color: T.textMed, fontWeight: 700 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rise lift" style={{
        animationDelay: "320ms",
        background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`, borderRadius: 16,
        padding: 16, color: T.white, display: "flex", alignItems: "center", gap: 13,
        boxShadow: "0 14px 30px -16px rgba(198,138,18,.7)",
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center" }}>
          <Award size={26} />
        </div>
        <div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 17 }}>#2 en ranking CAM</div>
          <div style={{ fontSize: 11.5, fontWeight: 600, opacity: .9 }}>26 levantamientos · 94% data quality</div>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ gvm, catalog }) {
  const country = getCountry(gvm.country);
  const myPdvs = catalog.filter(p => p.assignedTo === gvm.id && p.country === gvm.country).length;
  const totalCountry = catalog.filter(p => p.country === gvm.country).length;
  return (
    <div style={{ padding: 16 }}>
      <div className="rise" style={{
        background: `linear-gradient(140deg, ${T.surface}, ${T.cream})`, border: `1px solid ${T.border}`,
        borderRadius: 18, padding: 22, textAlign: "center", marginBottom: 14,
      }}>
        <div style={{
          width: 76, height: 76, borderRadius: "50%", margin: "0 auto 12px",
          background: `linear-gradient(135deg, ${gvm.color}, ${gvm.color}cc)`,
          display: "grid", placeItems: "center", fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: T.white,
          boxShadow: "0 10px 24px -12px rgba(38,48,58,.4)",
        }}>{gvm.initials}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, color: T.ink }}>{gvm.name}</div>
        <div style={{ fontSize: 12, color: T.primaryDim, fontWeight: 800 }}>Gerente de Ventas y Marketing</div>
        <div style={{ fontSize: 11, color: T.textMed, marginTop: 3 }}>GVM-{country.code}-{gvm.id} · {country.flag} {country.name}</div>
      </div>
      {[
        ["País asignado", `${country.flag} ${country.name}`, Compass],
        ["Distribuidor", country.distributor, Store],
        ["PDVs en mi cartera", `${myPdvs} ${myPdvs === 1 ? "punto" : "puntos"} de venta`, Boxes],
        ["PDVs del país (total)", `${totalCountry} en la base de datos`, Database],
        ["Sincronización", "Hace 2 minutos · al día", RefreshCw],
      ].map(([k, v, Ic], i) => (
        <div key={k} className="rise" style={{
          animationDelay: `${60 + i * 55}ms`,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 13,
          padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 11,
        }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: T.surfaceAlt, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Ic size={16} color={T.inkSoft} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: T.textLow, fontWeight: 700 }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: 12.5, color: T.ink, fontWeight: 700 }}>{v}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   DASHBOARD SUPERVISOR (responsive)
   ============================================================ */
function SupervisorDashboard({ desktop, catalog, setCatalog, user, users, setUsers }) {
  const [tab, setTab] = useState("overview");
  // Si es supervisor de país, el filtro inicia bloqueado en su país; si es admin, en "ALL"
  const isAdmin = user.role === "admin";
  const [market, setMarket] = useState(isAdmin ? "ALL" : user.country);

  // GVMs visibles según rol
  const visibleGvms = useMemo(() => {
    const all = getGvms(users);
    return isAdmin ? all : all.filter(g => g.country === user.country);
  }, [users, isAdmin, user.country]);

  const visited = visibleGvms.reduce((s, g) => s + (g.visited || 0), 0);
  const planned = visibleGvms.reduce((s, g) => s + (g.planned || 0), 0);
  const oos     = visibleGvms.reduce((s, g) => s + (g.oos || 0), 0);

  // Filtros de país: admin ve todos, supervisor solo el suyo
  const filters = isAdmin
    ? [{ code: "ALL", name: "Todos", flag: "🌎" }, ...COUNTRIES]
    : [getCountry(user.country)];

  const tabs = [
    ["overview", "Resumen", BarChart3],
    ["catalog",  "Catálogo", Database],
    ["users",    "Usuarios", UserRound],
  ];
  const headerTitle = {
    overview: isAdmin ? "Cobertura Regional CAM" : `Cobertura · ${getCountry(user.country).flag} ${getCountry(user.country).name}`,
    catalog:  "Catálogo de PDVs",
    users:    "Gestión de usuarios",
  }[tab];
  const headerSub = {
    overview: isAdmin ? "Administrador · vista consolidada" : `Supervisor de ${getCountry(user.country).name}`,
    catalog:  `${catalog.length} puntos de venta en la base · ${catalog.filter(p => !p.assignedTo).length} sin asignar`,
    users:    isAdmin ? "Crear y gestionar usuarios de cualquier país" : `Crear GVMs para ${getCountry(user.country).name}`,
  }[tab];

  return (
    <div style={{
      width: "100%", maxWidth: 1180, background: T.surface, borderRadius: 22,
      border: `1px solid ${T.border}`, padding: desktop ? 26 : 16,
      boxShadow: "0 30px 70px -34px rgba(38,48,58,.4)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: desktop ? 25 : 21, fontWeight: 600, color: T.ink }}>
            {headerTitle}
          </div>
          <div style={{ fontSize: 12.5, color: T.textMed }}>{headerSub}</div>
        </div>
        {/* Tabs Resumen / Catálogo / Usuarios */}
        <div style={{ display: "flex", gap: 4, background: T.bg, padding: 4, borderRadius: 11, border: `1px solid ${T.border}` }}>
          {tabs.map(([k, l, Ic]) => (
            <button key={k} onClick={() => setTab(k)} className="press" style={{
              border: "none", padding: "8px 13px", borderRadius: 8,
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              color: tab === k ? T.white : T.textMed,
              background: tab === k ? `linear-gradient(135deg,${T.primary},${T.primaryDim})` : "transparent",
              display: "flex", alignItems: "center", gap: 6,
              transition: "background-color .2s var(--e-out), color .2s var(--e-out)",
            }}>
              <Ic size={14} /> {l}
            </button>
          ))}
        </div>
      </div>

      {tab === "catalog" ? (
        <CatalogTab catalog={catalog} setCatalog={setCatalog} desktop={desktop} user={user} users={users} />
      ) : tab === "users" ? (
        <UsersTab user={user} users={users} setUsers={setUsers} desktop={desktop} />
      ) : (
        <OverviewTab desktop={desktop} market={market} setMarket={setMarket}
          filters={filters} visited={visited} planned={planned} oos={oos}
          gvms={visibleGvms} isAdmin={isAdmin} />
      )}
    </div>
  );
}

function OverviewTab({ desktop, market, setMarket, filters, visited, planned, oos, gvms, isAdmin }) {
  const filteredGvms = useMemo(() =>
    gvms.filter(g => market === "ALL" || g.country === market),
    [gvms, market]);

  return (
    <div className="fade">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 4, background: T.bg, padding: 4, borderRadius: 11, border: `1px solid ${T.border}`, flexWrap: "wrap" }}>
          {filters.map(f => (
            <button key={f.code} onClick={() => setMarket(f.code)}
              disabled={!isAdmin && f.code !== "ALL"} className="press" style={{
              border: "none", padding: "7px 12px", borderRadius: 8,
              fontSize: 11.5, fontWeight: 700, cursor: isAdmin ? "pointer" : "default",
              color: market === f.code ? T.white : T.textMed,
              background: market === f.code ? `linear-gradient(135deg,${T.primary},${T.primaryDim})` : "transparent",
              transition: "background-color .2s var(--e-out), color .2s var(--e-out)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span>{f.flag}</span> {f.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: desktop ? "repeat(5,1fr)" : "repeat(2,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          ["Cobertura regional", Math.round(visited / planned * 100) + "%", `${visited} de ${planned} PDVs`, Target, T.success],
          ["GVMs activos", `${filteredGvms.length} / ${filteredGvms.length}`, "En campo ahora", Activity, T.primary],
          ["Alertas OOS", oos, "SKUs en quiebre", TriangleAlert, T.danger],
          ["Price Compliance", "81%", "Promedio CAM", Tag, T.navy],
          ["Share of Shelf", "59%", "Promedio región", LayoutGrid, T.info],
        ].map(([l, v, s, Ic, tone], i) => (
          <div key={l} className="rise lift" style={{
            animationDelay: `${i * 55}ms`,
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 15,
            borderTop: `3px solid ${tone}`, boxShadow: "0 4px 14px -10px rgba(38,48,58,.25)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 10.5, color: T.textMed, fontWeight: 800, letterSpacing: ".3px" }}>{l.toUpperCase()}</span>
              <Ic size={16} color={tone} />
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, color: T.ink, marginTop: 6 }}>{v}</div>
            <div style={{ fontSize: 11, color: T.textMed }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: desktop ? "1.5fr 1fr" : "1fr", gap: 16, marginBottom: 16 }}>
        <div className="rise" style={{ animationDelay: "120ms", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 16 }}>Cumplimiento de itinerario por GVM</div>
          {filteredGvms.map((g, i) => {
            const pct = Math.round(g.visited / g.planned * 100);
            return (
              <div key={g.name} style={{ marginBottom: 15 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 9, background: g.color + "1F", display: "grid", placeItems: "center" }}>
                      <UserRound size={14} color={g.color} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: T.ink }}>{g.name}</span>
                    <span style={{ fontSize: 10.5, color: T.textMed }}>· {getCountry(g.country).flag} {getCountry(g.country).name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {g.oos > 0 && (
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: T.danger, background: T.dangerSoft, padding: "2px 7px", borderRadius: 6 }}>
                        {g.oos} OOS
                      </span>
                    )}
                    <span style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, color: pct === 100 ? T.success : T.inkSoft }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: 8, background: T.surfaceAlt, borderRadius: 5, overflow: "hidden" }}>
                  <div className="bar-fill" style={{
                    "--w": `${pct}%`, animationDelay: `${i * 90}ms`,
                    height: "100%", background: pct === 100 ? T.success : g.color, borderRadius: 5,
                  }} />
                </div>
                <div style={{ fontSize: 10.5, color: T.textMed, marginTop: 4 }}>{g.visited} de {g.planned} PDVs visitados</div>
              </div>
            );
          })}
        </div>

        <div className="rise" style={{ animationDelay: "180ms", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 14 }}>Mapa de cobertura · CAM</div>
          <div style={{
            height: 230, borderRadius: 14, background: `linear-gradient(135deg, ${T.infoSoft}, #E8F2EA)`,
            position: "relative", overflow: "hidden", border: `1px solid ${T.border}`,
          }}>
            <MapGrid />
            {[
              { x: 22, y: 30, c: T.success }, { x: 38, y: 22, c: T.success }, { x: 30, y: 48, c: T.danger },
              { x: 52, y: 38, c: T.navy }, { x: 64, y: 55, c: T.primary }, { x: 46, y: 66, c: T.success },
              { x: 70, y: 28, c: T.warn }, { x: 58, y: 72, c: T.success },
            ].map((p, i) => (
              <div key={i} className="dot-in" style={{
                animationDelay: `${i * 65}ms`,
                position: "absolute", left: p.x + "%", top: p.y + "%",
                width: 17, height: 17, borderRadius: "50%", background: p.c, border: `2.5px solid ${T.white}`,
                boxShadow: "0 3px 7px rgba(38,48,58,.25)",
              }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 11 }}>
            {[["Completo", T.success], ["En progreso", T.primary], ["Alerta", T.danger], ["Sin visita", T.navy]].map(([t, c]) => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: T.inkSoft }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: c }} /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: desktop ? "1fr 1fr" : "1fr", gap: 16 }}>
        <div className="rise" style={{ animationDelay: "240ms", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 12 }}>Alertas críticas</div>
          {[
            { t: "OOS · Corona Extra 355ml", d: "Super Selecto Z.10 · Guatemala", k: "d" },
            { t: "Desviación de precio +18%", d: "Bar La Rana Dorada · Panamá", k: "w" },
            { t: "Nevera fuera de servicio", d: "Pulpería La Esquina · Honduras", k: "d" },
            { t: "PDV planificado no visitado", d: "3 PDVs · José Pineda · Guatemala", k: "w" },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: i < 3 ? `1px solid ${T.bg}` : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: a.k === "d" ? T.dangerSoft : T.warnSoft, display: "grid", placeItems: "center" }}>
                <TriangleAlert size={15} color={a.k === "d" ? T.danger : T.warn} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.ink }}>{a.t}</div>
                <div style={{ fontSize: 10.5, color: T.textMed }}>{a.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rise" style={{ animationDelay: "300ms", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 12 }}>Reportes exportables</div>
          {[
            ["Reporte de Visitas Diarias", "Diario · PDF / Excel"],
            ["Reporte de Precios por Mercado", "Semanal · PDF / Excel"],
            ["Reporte de Share of Shelf", "Quincenal · PDF"],
            ["Reporte Ejecutivo CAM", "Mensual · PDF"],
          ].map(([t, f], i) => (
            <button key={i} className="press report-row" style={{
              width: "100%", border: `1px solid ${T.border}`, background: T.bg, borderRadius: 12,
              padding: "11px 13px", marginBottom: 8, cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left",
              transition: "transform .15s var(--e-out)",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.ink }}>{t}</div>
                <div style={{ fontSize: 10, color: T.textMed }}>{f}</div>
              </div>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: T.primarySoft, display: "grid", placeItems: "center" }}>
                <BarChart3 size={15} color={T.primaryDim} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CATÁLOGO DE PDVs (administrador)
   ============================================================ */
function CatalogTab({ catalog, setCatalog, desktop, user, users }) {
  const isAdmin = user.role === "admin";
  const supCountry = !isAdmin ? user.country : null;
  // Si es supervisor, el filtro de país arranca y queda fijo en su país
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [countryFilter, setCountryFilter] = useState(isAdmin ? "ALL" : supCountry);
  const [importCountry, setImportCountry] = useState(isAdmin ? "" : supCountry);
  const [assignTarget, setAssignTarget] = useState(null);
  const fileRef = useRef(null);

  // Países que el usuario puede ver/operar
  const allowedCountries = isAdmin ? COUNTRIES : COUNTRIES.filter(c => c.code === supCountry);

  const filtered = useMemo(() => {
    return catalog.filter(p => {
      // Supervisor solo ve PDVs de su país
      if (!isAdmin && p.country !== supCountry) return false;
      if (countryFilter !== "ALL" && p.country !== countryFilter) return false;
      if (statusFilter === "Asignados" && !p.assignedTo) return false;
      if (statusFilter === "Pool" && p.assignedTo) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.addr || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [catalog, search, statusFilter, countryFilter, isAdmin, supCountry]);

  const stats = useMemo(() => {
    const scope = isAdmin ? catalog : catalog.filter(p => p.country === supCountry);
    return {
      total: scope.length,
      assigned: scope.filter(p => p.assignedTo).length,
      pool: scope.filter(p => !p.assignedTo).length,
    };
  }, [catalog, isAdmin, supCountry]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!importCountry) {
      setImportMsg({ kind: "err", text: "Primero selecciona el país al que pertenecerán estos PDVs." });
      setTimeout(() => setImportMsg(null), 4500);
      return;
    }
    setImporting(true);
    setImportMsg(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const pick = (row, ...keys) => {
        const entries = Object.entries(row);
        for (const k of keys) {
          const hit = entries.find(([key]) => norm(key) === norm(k));
          if (hit && hit[1] !== "" && hit[1] !== null) return hit[1];
        }
        return "";
      };
      const country = getCountry(importCountry);
      const parsed = rows.map((r, i) => {
        const id = String(pick(r, "id", "codigo", "código", "code") || `PDV-${importCountry}-${Date.now()}-${i}`);
        return {
          id, name: String(pick(r, "name", "nombre", "pdv") || `PDV ${id}`),
          cat: String(pick(r, "cat", "categoria", "categoría", "category") || "Otro"),
          channel: String(pick(r, "channel", "canal") || "Off-trade"),
          dist: String(pick(r, "dist", "distribuidor", "distributor") || country.distributor),
          addr: String(pick(r, "addr", "direccion", "dirección", "address") || ""),
          lat: parseFloat(pick(r, "lat", "latitud", "latitude")) || 0,
          lng: parseFloat(pick(r, "lng", "longitud", "longitude") || pick(r, "lon", "long")) || 0,
          status: "pending", order: 0,
          country: importCountry,
          assignedTo: null,
        };
      });
      setCatalog(c => {
        const map = new Map(c.map(p => [p.id, p]));
        parsed.forEach(p => map.set(p.id, { ...(map.get(p.id) || {}), ...p, assignedTo: map.get(p.id)?.assignedTo ?? null }));
        return Array.from(map.values());
      });
      setImportMsg({ kind: "ok", text: `${parsed.length} PDVs de ${country.flag} ${country.name} importados desde ${file.name}` });
    } catch (e) {
      setImportMsg({ kind: "err", text: "No se pudo leer el archivo. Verifica el formato (CSV o XLSX)." });
    } finally {
      setImporting(false);
      setTimeout(() => setImportMsg(null), 5000);
    }
  };

  const removeP = (id) => {
    if (!confirm("¿Eliminar este PDV del catálogo?")) return;
    setCatalog(c => c.filter(p => p.id !== id));
  };
  const unassign = (id) => setCatalog(c => c.map(p => p.id === id ? { ...p, assignedTo: null, order: 0 } : p));
  const assignTo = (pdvId, gvmId) => {
    setCatalog(c => c.map(p => p.id === pdvId ? { ...p, assignedTo: gvmId } : p));
    setAssignTarget(null);
  };
  const resetSeed = () => {
    if (confirm("¿Restaurar el catálogo de ejemplo? Se perderán los cambios actuales.")) {
      setCatalog(PDVS_SEED);
    }
  };

  return (
    <div className="fade">
      {/* Resumen + acciones */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        <CatalogStat label="Total" value={stats.total} icon={Database} tone={T.primary} />
        <CatalogStat label="Asignados" value={stats.assigned} icon={UserRound} tone={T.success} />
        <CatalogStat label="Pool disponible" value={stats.pool} icon={UserPlus} tone={T.info} />
      </div>

      {/* Bloque de importación con país obligatorio */}
      <div style={{
        background: `linear-gradient(135deg, ${T.surface}, ${T.cream})`,
        border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
          <Upload size={16} color={T.primaryDim} />
          <span style={{ fontSize: 12.5, fontWeight: 800, color: T.ink }}>Importar nuevos PDVs</span>
        </div>
        <div style={{ fontSize: 11.5, color: T.textMed, marginBottom: 10 }}>
          1) Selecciona el país al que pertenecen estos PDVs · 2) Sube tu archivo CSV o Excel
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={importCountry} onChange={e => setImportCountry(e.target.value)}
            disabled={!isAdmin}
            style={{
            border: `1.5px solid ${importCountry ? T.primary : T.border}`,
            background: !isAdmin ? T.bg : T.surface, borderRadius: 10, padding: "9px 12px",
            fontSize: 12.5, fontWeight: 700, color: T.ink, cursor: !isAdmin ? "default" : "pointer", outline: "none",
            flexBasis: desktop ? 200 : "100%", fontFamily: FONT,
          }}>
            {isAdmin && <option value="">— Seleccionar país —</option>}
            {allowedCountries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={importing || !importCountry} className="press" style={{
            flex: 1, minWidth: 180,
            border: "none", cursor: (importing || !importCountry) ? "not-allowed" : "pointer",
            background: !importCountry ? T.surfaceAlt : `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`,
            color: !importCountry ? T.textLow : T.white,
            padding: "10px 14px", borderRadius: 10, fontWeight: 800, fontSize: 12.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            boxShadow: !importCountry ? "none" : "0 8px 18px -10px rgba(198,138,18,.6)",
          }}>
            {importing ? <><Loader2 size={15} className="spin" /> Procesando…</> : <><Upload size={15} /> Importar CSV / Excel</>}
          </button>
          <button onClick={resetSeed} className="press" title="Restaurar datos de ejemplo" style={{
            border: `1px solid ${T.border}`, background: T.surface, borderRadius: 10,
            width: 40, height: 40, cursor: "pointer", display: "grid", placeItems: "center",
          }}>
            <RefreshCw size={15} color={T.inkSoft} />
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="toast-in" style={{
          background: importMsg.kind === "ok" ? T.successSoft : T.dangerSoft,
          border: `1px solid ${importMsg.kind === "ok" ? "#BEE5CD" : "#F1C8C5"}`,
          borderRadius: 12, padding: "10px 13px", marginBottom: 14,
          fontSize: 12, fontWeight: 700, color: importMsg.kind === "ok" ? T.success : T.danger,
          display: "flex", alignItems: "center", gap: 9,
        }}>
          {importMsg.kind === "ok" ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}
          {importMsg.text}
        </div>
      )}

      <FormatHint />

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: desktop ? "0 1 280px" : "1 1 100%" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, ID o dirección…"
            style={{
              width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10,
              border: `1px solid ${T.border}`, background: T.surface, fontSize: 13, color: T.ink, outline: "none",
            }} />
          <Filter size={14} color={T.textLow} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        </div>
        <div style={{ display: "flex", gap: 4, background: T.bg, padding: 4, borderRadius: 10, border: `1px solid ${T.border}` }}>
          {["Todos", "Asignados", "Pool"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className="press" style={{
              border: "none", padding: "6px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer",
              color: statusFilter === s ? T.white : T.textMed,
              background: statusFilter === s ? T.inkSoft : "transparent",
              transition: "background-color .2s var(--e-out), color .2s var(--e-out)",
            }}>{s}</button>
          ))}
        </div>
        {isAdmin && (
          <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{
            border: `1px solid ${T.border}`, background: T.surface, borderRadius: 10,
            padding: "7px 10px", fontSize: 11.5, fontWeight: 700, color: T.ink, cursor: "pointer",
            outline: "none", fontFamily: FONT,
          }}>
            <option value="ALL">🌎 Todos los países</option>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        )}
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <EmptyState icon={Database} title="Sin resultados"
          text="Ajusta los filtros o importa un nuevo archivo CSV / Excel." />
      ) : (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", background: T.surface }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceAlt }}>
                  {["ID", "País", "Nombre", "Categoría", "Dirección", "Asignado a", ""].map(h => (
                    <th key={h} style={{
                      textAlign: "left", padding: "10px 12px", fontWeight: 800,
                      fontSize: 10.5, color: T.textMed, letterSpacing: ".4px",
                      borderBottom: `1px solid ${T.border}`,
                    }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const c = getCountry(p.country);
                  const assignedGvm = p.assignedTo ? getUserById(users, p.assignedTo) : null;
                  const eligibleGvms = getGvms(users).filter(g => g.country === p.country);
                  return (
                  <tr key={p.id} style={{
                    background: i % 2 ? T.bg : T.surface,
                    borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none",
                  }}>
                    <td style={{ padding: "10px 12px", color: T.textMed, fontWeight: 700, fontFamily: "monospace", fontSize: 11 }}>{p.id}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 14 }}>{c.flag}</span> <span style={{ color: T.inkSoft, fontSize: 11, fontWeight: 700 }}>{c.code}</span>
                    </td>
                    <td style={{ padding: "10px 12px", color: T.ink, fontWeight: 700 }}>{p.name}</td>
                    <td style={{ padding: "10px 12px", color: T.inkSoft }}>{p.cat}</td>
                    <td style={{ padding: "10px 12px", color: T.textMed, fontSize: 11, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.addr}</td>
                    <td style={{ padding: "10px 12px" }}>
                      {assignedGvm ? (
                        <span title={assignedGvm.name} style={{
                          background: T.successSoft, color: T.success, padding: "3px 8px",
                          borderRadius: 6, fontSize: 10.5, fontWeight: 800,
                        }}>{assignedGvm.initials} · {assignedGvm.name.split(" ")[0]}</span>
                      ) : (
                        <span style={{
                          background: T.surfaceAlt, color: T.textMed, padding: "3px 8px",
                          borderRadius: 6, fontSize: 10.5, fontWeight: 800,
                        }}>Pool</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap", position: "relative" }}>
                      {!p.assignedTo && eligibleGvms.length > 0 && (
                        <>
                          <button onClick={() => setAssignTarget(assignTarget?.pdvId === p.id ? null : { pdvId: p.id, country: p.country })} className="press" title="Asignar a GVM"
                            style={{
                              border: `1px solid ${T.primary}`, background: T.primarySoft, borderRadius: 7,
                              padding: "4px 8px", cursor: "pointer", marginRight: 4, color: T.primaryDim, fontSize: 10.5, fontWeight: 800,
                              display: "inline-flex", alignItems: "center", gap: 3,
                            }}>
                            <UserPlus size={11} /> Asignar
                          </button>
                          {assignTarget?.pdvId === p.id && (
                            <div className="pop" style={{
                              position: "absolute", right: 8, top: "100%", marginTop: 4, zIndex: 10,
                              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
                              boxShadow: "0 12px 30px -10px rgba(38,48,58,.3)",
                              padding: 5, minWidth: 180,
                            }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: T.textLow, padding: "5px 8px 3px" }}>
                                ASIGNAR A GVM DE {c.flag} {c.code}
                              </div>
                              {eligibleGvms.map(g => (
                                <button key={g.id} onClick={() => assignTo(p.id, g.id)} className="press" style={{
                                  width: "100%", border: "none", background: "transparent",
                                  padding: "7px 9px", borderRadius: 7, cursor: "pointer",
                                  display: "flex", alignItems: "center", gap: 7, textAlign: "left",
                                  fontSize: 11.5, fontWeight: 700, color: T.ink,
                                }}>
                                  <span style={{
                                    width: 22, height: 22, borderRadius: 6, color: T.white, fontSize: 10, fontWeight: 800,
                                    background: g.color, display: "grid", placeItems: "center",
                                  }}>{g.initials}</span>
                                  {g.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      {p.assignedTo && (
                        <button onClick={() => unassign(p.id)} className="press" title="Desasignar"
                          style={{
                            border: `1px solid ${T.border}`, background: T.surface, borderRadius: 7,
                            padding: "4px 7px", cursor: "pointer", marginRight: 4, color: T.inkSoft, fontSize: 10.5, fontWeight: 700,
                          }}>Liberar</button>
                      )}
                      <button onClick={() => removeP(p.id)} className="press" title="Eliminar"
                        style={{
                          border: `1px solid ${T.dangerSoft}`, background: T.dangerSoft, borderRadius: 7,
                          padding: "4px 7px", cursor: "pointer", display: "inline-grid", placeItems: "center",
                        }}>
                        <Trash2 size={12} color={T.danger} />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   GESTIÓN DE USUARIOS (admin y supervisor)
   ============================================================ */
function UsersTab({ user, users, setUsers, desktop }) {
  const isAdmin = user.role === "admin";
  const supCountry = !isAdmin ? user.country : null;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // null o user a editar
  const [filterRole, setFilterRole] = useState("all"); // all | admin | supervisor | gvm
  const [filterCountry, setFilterCountry] = useState(isAdmin ? "ALL" : supCountry);
  const [search, setSearch] = useState("");

  // Usuarios visibles según rol
  const visibleUsers = useMemo(() => {
    return users.filter(u => {
      if (!isAdmin && u.country !== supCountry) return false;
      if (!isAdmin && u.role === "admin") return false; // supervisor no ve admins
      if (filterRole !== "all" && u.role !== filterRole) return false;
      if (filterCountry !== "ALL" && u.country !== filterCountry && u.role !== "admin") return false;
      if (filterCountry !== "ALL" && u.role === "admin" && filterCountry !== "ALL") {
        // los admins solo aparecen en "Todos"
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, isAdmin, supCountry, filterRole, filterCountry, search]);

  const stats = useMemo(() => {
    const scope = isAdmin ? users : users.filter(u => u.country === supCountry);
    return {
      total: scope.length,
      admins: scope.filter(u => u.role === "admin").length,
      supervisors: scope.filter(u => u.role === "supervisor").length,
      gvms: scope.filter(u => u.role === "gvm").length,
    };
  }, [users, isAdmin, supCountry]);

  const saveUser = (newUser) => {
    setUsers(us => {
      const exists = us.some(u => u.id === newUser.id);
      if (exists) return us.map(u => u.id === newUser.id ? { ...u, ...newUser } : u);
      return [...us, newUser];
    });
    setShowForm(false);
    setEditing(null);
  };

  const deleteUser = (u) => {
    if (u.id === user.id) { alert("No puedes eliminar tu propia cuenta."); return; }
    if (!confirm(`¿Eliminar a "${u.name}"? Esta acción es permanente.`)) return;
    setUsers(us => us.filter(x => x.id !== u.id));
  };

  // Roles que el usuario actual puede crear
  const creatableRoles = isAdmin
    ? [{ value: "admin", label: "Administrador" }, { value: "supervisor", label: "Supervisor" }, { value: "gvm", label: "GVM" }]
    : [{ value: "gvm", label: "GVM" }]; // Supervisor solo crea GVMs

  return (
    <div className="fade">
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        <CatalogStat label="Total usuarios" value={stats.total} icon={UserRound} tone={T.primary} />
        {isAdmin && <CatalogStat label="Administradores" value={stats.admins} icon={Database} tone={T.ink} />}
        <CatalogStat label="Supervisores" value={stats.supervisors} icon={UserRound} tone={T.navy} />
        <CatalogStat label="GVMs" value={stats.gvms} icon={Compass} tone={T.success} />
      </div>

      {/* Toolbar */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center",
      }}>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="press" style={{
          border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`, color: T.white,
          padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 800,
          display: "flex", alignItems: "center", gap: 7,
          boxShadow: "0 8px 18px -10px rgba(198,138,18,.6)",
        }}>
          <Plus size={15} /> Crear usuario
        </button>

        <div style={{ position: "relative", flex: desktop ? "0 1 240px" : "1 1 100%" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, usuario o email…"
            style={{
              width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10,
              border: `1px solid ${T.border}`, background: T.surface, fontSize: 13, color: T.ink, outline: "none",
            }} />
          <Filter size={14} color={T.textLow} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        </div>

        <div style={{ display: "flex", gap: 4, background: T.bg, padding: 4, borderRadius: 10, border: `1px solid ${T.border}` }}>
          {[["all", "Todos"], ...(isAdmin ? [["admin", "Admin"]] : []), ["supervisor", "Sup."], ["gvm", "GVMs"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilterRole(v)} className="press" style={{
              border: "none", padding: "6px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer",
              color: filterRole === v ? T.white : T.textMed,
              background: filterRole === v ? T.inkSoft : "transparent",
              transition: "background-color .2s var(--e-out), color .2s var(--e-out)",
            }}>{l}</button>
          ))}
        </div>

        {isAdmin && (
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={{
            border: `1px solid ${T.border}`, background: T.surface, borderRadius: 10,
            padding: "7px 10px", fontSize: 11.5, fontWeight: 700, color: T.ink, cursor: "pointer",
            outline: "none", fontFamily: FONT,
          }}>
            <option value="ALL">🌎 Todos los países</option>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        )}
      </div>

      {/* Tabla de usuarios */}
      {visibleUsers.length === 0 ? (
        <EmptyState icon={UserRound} title="Sin usuarios" text="Ajusta los filtros o crea un usuario nuevo." />
      ) : (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", background: T.surface }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceAlt }}>
                  {["Usuario", "Nombre", "Rol", "País", "Email", ""].map(h => (
                    <th key={h} style={{
                      textAlign: "left", padding: "10px 12px", fontWeight: 800,
                      fontSize: 10.5, color: T.textMed, letterSpacing: ".4px",
                      borderBottom: `1px solid ${T.border}`,
                    }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((u, i) => {
                  const c = u.country ? getCountry(u.country) : null;
                  const roleColors = { admin: T.ink, supervisor: T.navy, gvm: T.primary };
                  const roleLabels = { admin: "Admin", supervisor: "Supervisor", gvm: "GVM" };
                  return (
                  <tr key={u.id} style={{
                    background: i % 2 ? T.bg : T.surface,
                    borderBottom: i < visibleUsers.length - 1 ? `1px solid ${T.border}` : "none",
                  }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 9, color: T.white, fontSize: 11, fontWeight: 800,
                          background: u.color || roleColors[u.role], display: "grid", placeItems: "center", flexShrink: 0,
                        }}>{u.initials}</div>
                        <span style={{ fontFamily: "monospace", color: T.textMed, fontSize: 11, fontWeight: 700 }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", color: T.ink, fontWeight: 700 }}>
                      {u.name}{u.id === user.id && <span style={{ marginLeft: 6, fontSize: 10, color: T.primaryDim, fontWeight: 800 }}>(tú)</span>}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        background: roleColors[u.role] + "1F", color: roleColors[u.role],
                        padding: "3px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 800,
                      }}>{roleLabels[u.role]}</span>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {c ? <><span style={{ fontSize: 14 }}>{c.flag}</span> <span style={{ color: T.inkSoft, fontSize: 11, fontWeight: 700 }}>{c.code}</span></> : <span style={{ color: T.textLow, fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 12px", color: T.textMed, fontSize: 11 }}>{u.email}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <button onClick={() => { setEditing(u); setShowForm(true); }} className="press" title="Editar"
                        style={{
                          border: `1px solid ${T.border}`, background: T.surface, borderRadius: 7,
                          padding: "4px 9px", cursor: "pointer", marginRight: 4, color: T.inkSoft, fontSize: 10.5, fontWeight: 700,
                        }}>Editar</button>
                      {u.id !== user.id && (
                        <button onClick={() => deleteUser(u)} className="press" title="Eliminar"
                          style={{
                            border: `1px solid ${T.dangerSoft}`, background: T.dangerSoft, borderRadius: 7,
                            padding: "4px 7px", cursor: "pointer", display: "inline-grid", placeItems: "center",
                          }}>
                          <Trash2 size={12} color={T.danger} />
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <UserFormModal
          existingUser={editing}
          users={users}
          creatableRoles={creatableRoles}
          allowedCountries={isAdmin ? COUNTRIES : COUNTRIES.filter(c => c.code === supCountry)}
          defaultCountry={isAdmin ? "" : supCountry}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={saveUser}
        />
      )}
    </div>
  );
}

function UserFormModal({ existingUser, users, creatableRoles, allowedCountries, defaultCountry, onClose, onSave }) {
  const isEdit = !!existingUser;
  const [name, setName] = useState(existingUser?.name || "");
  const [username, setUsername] = useState(existingUser?.username || "");
  const [email, setEmail] = useState(existingUser?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(existingUser?.role || creatableRoles[0]?.value || "gvm");
  const [country, setCountry] = useState(existingUser?.country || defaultCountry || allowedCountries[0]?.code);
  const [error, setError] = useState(null);

  const submit = () => {
    setError(null);
    if (!name.trim()) { setError("El nombre es obligatorio."); return; }
    if (!username.trim()) { setError("El usuario es obligatorio."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Email inválido."); return; }
    if (!isEdit && !password) { setError("La contraseña es obligatoria para usuarios nuevos."); return; }
    if (role !== "admin" && !country) { setError("Selecciona un país."); return; }
    // Validar unicidad de username/email
    const conflict = users.find(u =>
      u.id !== existingUser?.id &&
      (u.username.toLowerCase() === username.toLowerCase().trim() ||
       u.email.toLowerCase() === email.toLowerCase().trim())
    );
    if (conflict) { setError("Ya existe un usuario con ese usuario o email."); return; }

    const initials = name.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() || "").join("") || "??";
    const roleColors = { admin: "#26303A", supervisor: "#2C4256", gvm: "#C68A12" };
    const newUser = {
      id: existingUser?.id || `u-${Date.now()}`,
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: password || existingUser?.password,
      name: name.trim(),
      role,
      country: role === "admin" ? null : country,
      initials,
      color: existingUser?.color || roleColors[role],
      ...(role === "gvm" && !isEdit ? { visited: 0, planned: 0, oos: 0 } : {}),
    };
    onSave(newUser);
  };

  return (
    <div className="fade" style={{
      position: "fixed", inset: 0, background: "rgba(20,28,38,.6)",
      zIndex: 9000, display: "grid", placeItems: "center", padding: 16,
    }}>
      <div className="pop" style={{
        background: T.surface, borderRadius: 18, width: "100%", maxWidth: 440,
        boxShadow: "0 30px 80px -20px rgba(38,48,58,.5)",
        border: `1px solid ${T.border}`, overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: `1px solid ${T.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: `linear-gradient(135deg, ${T.cream}, ${T.surface})`,
        }}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: T.ink }}>
              {isEdit ? "Editar usuario" : "Crear usuario"}
            </div>
            <div style={{ fontSize: 11.5, color: T.textMed, marginTop: 2 }}>
              {isEdit ? "Modifica los datos del usuario" : "Completa los datos del nuevo usuario"}
            </div>
          </div>
          <button onClick={onClose} className="press" style={{
            border: "none", background: T.surfaceAlt, color: T.inkSoft,
            width: 32, height: 32, borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center",
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <FormField label="Nombre completo" value={name} onChange={setName} placeholder="Ej. Ana López" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormField label="Usuario" value={username} onChange={setUsername} placeholder="ana.lopez" />
            <FormField label="Email" type="email" value={email} onChange={setEmail} placeholder="ana@abinbev.com" />
          </div>
          <FormField label={isEdit ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
            type="password" value={password} onChange={setPassword}
            placeholder={isEdit ? "—" : "Mínimo 4 caracteres"} />

          <SectionLabel>Rol</SectionLabel>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {creatableRoles.map(r => (
              <button key={r.value} onClick={() => { setRole(r.value); if (r.value === "admin") setCountry(""); }}
                className="press" style={{
                  border: `1px solid ${role === r.value ? T.primary : T.border}`,
                  background: role === r.value ? T.primary : T.surface,
                  color: role === r.value ? T.white : T.inkSoft,
                  padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 800, cursor: "pointer",
                  transition: "background-color .2s var(--e-out), border-color .2s var(--e-out)",
                }}>{r.label}</button>
            ))}
          </div>

          {role !== "admin" && (
            <>
              <SectionLabel>País</SectionLabel>
              <select value={country} onChange={e => setCountry(e.target.value)}
                disabled={allowedCountries.length === 1}
                style={{
                  width: "100%", marginBottom: 14, padding: "10px 12px", borderRadius: 10,
                  border: `1px solid ${T.border}`, background: allowedCountries.length === 1 ? T.bg : T.surface,
                  fontSize: 13, color: T.ink, outline: "none", fontFamily: FONT, fontWeight: 600,
                  cursor: allowedCountries.length === 1 ? "default" : "pointer",
                }}>
                {allowedCountries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </>
          )}

          {error && (
            <div className="pop" style={{
              background: T.dangerSoft, border: `1px solid #F1C8C5`, borderRadius: 10,
              padding: "9px 12px", marginBottom: 14, fontSize: 12, fontWeight: 700, color: T.danger,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <TriangleAlert size={14} /> {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button onClick={onClose} className="press" style={{
              flex: 1, border: `1px solid ${T.border}`, background: T.surface, color: T.inkSoft,
              padding: 12, borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>Cancelar</button>
            <button onClick={submit} className="press" style={{
              flex: 1, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`, color: T.white,
              padding: 12, borderRadius: 11, fontSize: 13, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              boxShadow: "0 8px 18px -10px rgba(198,138,18,.6)",
            }}>
              <Check size={15} /> {isEdit ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, color: T.textLow, letterSpacing: ".4px" }}>{label.toUpperCase()}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 10, fontSize: 13,
          color: T.ink, outline: "none", background: T.bg, border: `1.5px solid ${T.border}`,
          fontFamily: FONT, transition: "border-color .15s var(--e-out)",
        }}
        onFocus={e => e.target.style.borderColor = T.primary}
        onBlur={e => e.target.style.borderColor = T.border} />
    </label>
  );
}

function CatalogStat({ label, value, icon: Icon, tone }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14,
      borderTop: `3px solid ${tone}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 10.5, color: T.textMed, fontWeight: 800, letterSpacing: ".3px" }}>{label.toUpperCase()}</span>
        <Icon size={15} color={tone} />
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: T.ink, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function FormatHint() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <button onClick={() => setOpen(o => !o)} className="press" style={{
        border: `1px dashed ${T.border}`, background: "transparent", color: T.textMed,
        borderRadius: 10, padding: "8px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 7, width: "100%",
      }}>
        <FileSpreadsheet size={14} color={T.primaryDim} />
        <span style={{ color: T.inkSoft }}>Formato esperado del archivo</span>
        <span style={{ marginLeft: "auto", color: T.textLow, fontSize: 11 }}>{open ? "Ocultar" : "Ver"}</span>
      </button>
      {open && (
        <div className="fade" style={{
          marginTop: 8, background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: 14, fontSize: 11.5, color: T.inkSoft, lineHeight: 1.6,
        }}>
          El archivo debe contener una fila por PDV. Estas columnas se reconocen automáticamente (los acentos y mayúsculas no importan):
          <div style={{ marginTop: 8, fontFamily: "monospace", background: T.bg, padding: 10, borderRadius: 8, fontSize: 10.5 }}>
            id · name (o nombre) · cat (o categoría) · channel (o canal) · dist (o distribuidor) · addr (o dirección) · lat · lng
          </div>
          <div style={{ marginTop: 8 }}>
            Los PDVs importados entran al <b style={{ color: T.primaryDim }}>Pool disponible</b> y los vendedores pueden auto-asignárselos desde la app de campo. Si un PDV con el mismo ID ya existe, se actualizan sus datos sin perder la asignación.
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   COMPONENTES COMPARTIDOS
   ============================================================ */
function SectionLabel({ children }) {
  return <div style={{ fontSize: 11.5, fontWeight: 800, color: T.textLow, letterSpacing: ".8px", marginBottom: 8 }}>{children}</div>;
}

function FieldInput({ label, value, onChange, type = "text" }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: 9.5, fontWeight: 800, color: T.textLow, letterSpacing: ".4px" }}>{label}</span>
      <input value={value} type={type} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} className="fi"
        style={{
          width: "100%", marginTop: 3, borderRadius: 9, padding: "9px 11px", fontSize: 13,
          color: T.ink, outline: "none", background: focus ? T.surface : T.bg,
          border: `1.5px solid ${focus ? T.primary : T.border}`,
        }} />
    </label>
  );
}

/* ============================================================
   CÁMARA EN VIVO — captura sólo en tiempo real, no desde galería
   Arquitectura: Context + Host en App raíz (sin react-dom / Portal)
   ============================================================ */
const CameraContext = createContext(null);
const useCamera = () => useContext(CameraContext);

// Botón visible — sólo abre el modal global vía contexto
function LiveCameraButton({ captured, label, big, onCapture }) {
  const cam = useCamera();
  return (
    <button onClick={() => cam?.open({ label, onCapture })} className="press" style={{
      width: "100%", height: captured ? (big ? 150 : 130) : (big ? 92 : 80), borderRadius: 14,
      border: `2px dashed ${captured ? T.success : T.border}`,
      background: captured ? T.successSoft : T.surface, cursor: "pointer",
      display: "grid", placeItems: "center", marginBottom: 16,
      transition: "border-color .25s var(--e-out), background-color .25s var(--e-out), height .25s var(--e-out)",
    }}>
      {captured ? (
        <div className="pop" style={{ textAlign: "center", color: T.success }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <CheckCircle2 size={30} />
            <span style={{
              position: "absolute", bottom: -6, right: -22, background: T.danger, color: T.white,
              fontSize: 8.5, fontWeight: 800, padding: "1.5px 5px", borderRadius: 4,
              display: "inline-flex", alignItems: "center", gap: 2,
            }}>
              <Radio size={8} /> LIVE
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, marginTop: 6 }}>Foto en vivo capturada</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.textMed, marginTop: 2 }}>Toca para volver a tomar</div>
        </div>
      ) : (
        <div style={{ textAlign: "center", color: T.textMed }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Camera size={28} />
            <span style={{
              position: "absolute", top: -3, right: -10, background: T.danger,
              width: 9, height: 9, borderRadius: "50%", border: `2px solid ${T.surface}`,
            }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{label}</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: T.danger, marginTop: 3, letterSpacing: ".3px" }}>
            CAPTURA EN VIVO · NO GALERÍA
          </div>
        </div>
      )}
    </button>
  );
}

// Host del modal — vive en el App raíz, fuera de cualquier ancestro con transform/overflow
function CameraHost({ request, onClose }) {
  const [phase, setPhase] = useState("requesting"); // requesting | streaming | preview | error
  const [error, setError] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const pendingFileRef = useRef(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setPhase("requesting");
    setError(null);
    setFallbackMode(false);
    setPreviewURL(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Este dispositivo no permite acceso a cámara en vivo desde el navegador.");
      setFallbackMode(true);
      setPhase("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setPhase("streaming");
    } catch (e) {
      setError("No se pudo abrir la cámara. Puedes tomar la foto con la cámara del sistema (válida solo si se captura en este momento).");
      setFallbackMode(true);
      setPhase("error");
    }
  };

  // Iniciar al montar
  useEffect(() => { startCamera(); return () => stopStream(); }, []);

  const snap = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    const w = v.videoWidth || 1280, h = v.videoHeight || 720;
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.drawImage(v, 0, 0, w, h);
    const stamp = new Date().toLocaleString("es-PA", { hour12: false });
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(10, h - 44, 320, 32);
    ctx.fillStyle = "#FFF";
    ctx.font = `bold ${Math.round(h/45)}px sans-serif`;
    ctx.fillText("🔴 EN VIVO · " + stamp, 18, h - 22);

    c.toBlob((blob) => {
      const file = new File([blob], `live-${Date.now()}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
      pendingFileRef.current = file;
      setPreviewURL(URL.createObjectURL(blob));
      setPhase("preview");
      stopStream();
    }, "image/jpeg", 0.88);
  };

  const confirm = () => {
    const file = pendingFileRef.current;
    if (file && request?.onCapture) request.onCapture(file, true);
    if (previewURL) URL.revokeObjectURL(previewURL);
    onClose();
  };

  const retake = () => {
    if (previewURL) URL.revokeObjectURL(previewURL);
    setPreviewURL(null);
    startCamera();
  };

  const onFallbackFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // El fallback se usa cuando getUserMedia no está disponible (iframe sin permiso, PC sin cámara).
    // En ese caso aceptamos la foto sin validar timestamp — la marca "LIVE" sólo aplica a la
    // captura via getUserMedia. El supervisor verá que esta foto NO tiene el sello live.
    if (request?.onCapture) request.onCapture(file, false);
    onClose();
  };

  const close = () => { stopStream(); if (previewURL) URL.revokeObjectURL(previewURL); onClose(); };

  return (
    <div className="fade" style={{
      position: "fixed", inset: 0, background: "rgba(20,28,38,.82)",
      zIndex: 9999, display: "grid", placeItems: "center", padding: 16,
    }}>
      <div className="pop" style={{
        background: "#0A0F15", borderRadius: 22, overflow: "hidden",
        width: "100%", maxWidth: 420, position: "relative",
        boxShadow: "0 30px 80px rgba(0,0,0,.6)",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 3,
          padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "linear-gradient(180deg, rgba(0,0,0,.7), rgba(0,0,0,0))",
        }}>
          <span style={{
            background: T.danger, color: T.white, fontSize: 10.5, fontWeight: 800,
            padding: "4px 9px", borderRadius: 7, display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.white }} />
            EN VIVO
          </span>
          <button onClick={close} className="press" style={{
            border: "none", background: "rgba(255,255,255,.18)", color: T.white,
            width: 34, height: 34, borderRadius: 10, cursor: "pointer", display: "grid", placeItems: "center",
          }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background: "#000", aspectRatio: "3/4", position: "relative", display: "grid", placeItems: "center" }}>
          {phase === "requesting" && (
            <div style={{ textAlign: "center", color: "#FFF" }}>
              <Loader2 size={28} className="spin" />
              <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700 }}>Solicitando acceso a la cámara…</div>
            </div>
          )}
          {phase === "streaming" && (
            <video ref={videoRef} playsInline muted autoPlay
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {phase === "preview" && previewURL && (
            <>
              <img src={previewURL} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{
                position: "absolute", top: 14, left: 60, background: "rgba(0,0,0,.55)",
                color: T.white, fontSize: 10, fontWeight: 800, padding: "4px 9px", borderRadius: 6,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <Radio size={10} /> Capturada en vivo · {new Date().toLocaleTimeString("es-PA", { hour12: false })}
              </div>
            </>
          )}
          {phase === "error" && (
            <div style={{ textAlign: "center", color: "#FFF", padding: 24 }}>
              <TriangleAlert size={32} color={T.warn} />
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: T.white, lineHeight: 1.4 }}>{error}</div>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        <div style={{
          padding: "16px 18px 20px", background: "#0A0F15",
          borderTop: "1px solid rgba(255,255,255,.08)",
        }}>
          {phase === "streaming" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <button onClick={snap} className="press" style={{
                width: 68, height: 68, borderRadius: "50%",
                border: `4px solid ${T.white}`, background: T.white, cursor: "pointer",
                display: "grid", placeItems: "center",
                boxShadow: "0 0 0 4px #0A0F15, 0 0 0 6px rgba(255,255,255,.3)",
              }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: T.danger }} />
              </button>
            </div>
          )}
          {phase === "preview" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={retake} className="press" style={{
                flex: 1, border: `1px solid rgba(255,255,255,.2)`, background: "transparent",
                color: T.white, padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}>
                <RotateCcw size={15} /> Repetir
              </button>
              <button onClick={confirm} className="press" style={{
                flex: 1, border: "none", cursor: "pointer",
                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`, color: T.white,
                padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}>
                <Check size={15} /> Usar foto
              </button>
            </div>
          )}
          {phase === "error" && fallbackMode && (
            <>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFallbackFile} />
              <button onClick={() => fileRef.current?.click()} className="press" style={{
                width: "100%", border: "none", cursor: "pointer", marginBottom: 8,
                background: T.warn, color: T.white,
                padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}>
                <Camera size={15} /> Usar cámara del sistema
              </button>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.6)", textAlign: "center", lineHeight: 1.4 }}>
                Cámara en vivo no disponible en este dispositivo. La foto subida no llevará el sello "LIVE".
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PhotoButton({ photo, onClick, label, big }) {
  return (
    <button onClick={onClick} className="press" style={{
      width: "100%", height: photo ? (big ? 150 : 130) : (big ? 92 : 80), borderRadius: 14,
      border: `2px dashed ${photo ? T.success : T.border}`,
      background: photo ? T.successSoft : T.surface, cursor: "pointer",
      display: "grid", placeItems: "center", marginBottom: 16,
      transition: "border-color .25s var(--e-out), background-color .25s var(--e-out), height .25s var(--e-out)",
    }}>
      {photo ? (
        <div className="pop" style={{ textAlign: "center", color: T.success }}>
          <CheckCircle2 size={30} />
          <div style={{ fontSize: 12, fontWeight: 800, marginTop: 6 }}>Foto capturada</div>
        </div>
      ) : (
        <div style={{ textAlign: "center", color: T.textMed }}>
          <Camera size={28} />
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{label}</div>
        </div>
      )}
    </button>
  );
}

function PrimaryButton({ disabled, onClick, label, icon: Icon }) {
  return (
    <button disabled={disabled} onClick={onClick} className={disabled ? "" : "press"} style={{
      width: "100%", border: "none", cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? T.surfaceAlt : `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`,
      color: disabled ? T.textLow : T.white,
      padding: 15, borderRadius: 14, fontWeight: 800, fontSize: 14.5,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      boxShadow: disabled ? "none" : "0 12px 26px -14px rgba(198,138,18,.6)",
      transition: "background-color .25s var(--e-out)",
    }}>
      <Icon size={18} /> {label}
    </button>
  );
}

function SurveyFooter({ onComplete, ready, online, hint }) {
  return (
    <div style={{ marginTop: 8 }}>
      {hint && <div style={{ fontSize: 11.5, color: T.warn, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>{hint}</div>}
      <PrimaryButton disabled={!ready} onClick={onComplete} icon={online ? Check : RefreshCw}
        label={online ? "Confirmar y sincronizar" : "Guardar · sincronizar luego"} />
    </div>
  );
}

function YesNo({ label, value, onChange }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: "11px 13px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{label}</span>
      <div style={{ display: "flex", gap: 6 }}>
        {[["Sí", true, T.success], ["No", false, T.danger]].map(([t, v, col]) => (
          <button key={t} onClick={() => onChange(v)} className="press" style={{
            border: `1px solid ${value === v ? col : T.border}`,
            background: value === v ? col : T.surface, color: value === v ? T.white : T.textMed,
            padding: "5px 15px", borderRadius: 8, fontSize: 11.5, fontWeight: 800, cursor: "pointer",
            transition: "background-color .2s var(--e-out), border-color .2s var(--e-out)",
          }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

function Stepper({ children, onClick }) {
  return (
    <button onClick={onClick} className="press" style={{
      width: 36, height: 36, borderRadius: 11, border: `1px solid ${T.border}`,
      background: T.bg, fontSize: 19, fontWeight: 700, color: T.ink, cursor: "pointer",
    }}>{children}</button>
  );
}

function MetricCard({ icon: Icon, label, value, tone }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: tone + "1A", display: "grid", placeItems: "center" }}>
        <Icon size={16} color={tone} />
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, color: T.ink, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 11, color: T.textMed, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="fade" style={{
      textAlign: "center", padding: "34px 18px", border: `1.5px dashed ${T.border}`,
      borderRadius: 14, background: T.surface,
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: T.surfaceAlt, display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
        <Icon size={24} color={T.textLow} />
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{title}</div>
      <div style={{ fontSize: 11.5, color: T.textMed, marginTop: 4 }}>{text}</div>
    </div>
  );
}

function SkeletonBlock({ lines = 3 }) {
  return (
    <div style={{ padding: "8px 0" }}>
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="shimmer" style={{
          height: 14, borderRadius: 7, marginBottom: 10,
          width: i === lines - 1 ? "60%" : "100%",
        }} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 15, padding: 13, marginBottom: 9 }}>
      <SkeletonBlock lines={2} />
    </div>
  );
}
