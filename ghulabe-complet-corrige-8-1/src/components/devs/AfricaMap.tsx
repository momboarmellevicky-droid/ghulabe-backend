import React from 'react';
import { Developer } from '../../types';

interface AfricaMapProps {
  developers: Developer[];
  onSelectDeveloper: (dev: Developer) => void;
  selectedCountry?: string;
}

// Frontières réelles des pays africains (données géographiques publiques,
// projection équirectangulaire simplifiée sur un viewBox 100x100).
// Pays de la zone CFA (CEMAC + UEMOA) marqués cfa:true pour la mise en évidence dorée.
const COUNTRIES: { name: string; d: string; cfa: boolean }[] = [
  { name: "Algeria", d: "M42.9 19.9 L33.8 25.2 L30.2 25.9 L29.5 24.9 L28.3 23.8 L18.7 17.8 L13.3 14.3 L13.3 12.5 L17.1 11.3 L18.8 10.3 L20.5 8.7 L22.0 8.1 L24.1 7.3 L23.2 5.6 L22.6 3.9 L25.5 2.9 L27.8 1.9 L32.6 1.6 L34.7 1.2 L36.8 1.5 L37.5 2.1 L37.3 4.6 L36.6 6.4 L37.8 7.5 L39.3 10.5 L39.8 12.4 L39.7 14.1 L39.6 15.7 L39.9 17.3 L40.4 18.7 L42.2 19.0 L42.9 19.9 Z", cfa: false },
  { name: "Angola", d: "M49.0 60.1 L49.8 61.9 L50.7 63.1 L52.1 62.8 L53.1 62.7 L54.3 61.8 L55.1 61.6 L56.8 62.0 L57.1 63.4 L57.0 65.1 L57.4 67.2 L58.3 67.1 L59.9 67.0 L59.9 68.1 L59.9 69.3 L57.0 69.7 L57.9 75.2 L56.3 76.6 L51.8 75.8 L45.8 75.9 L44.0 75.3 L42.5 75.8 L42.5 73.7 L43.1 71.8 L43.9 70.1 L45.2 68.5 L45.3 66.8 L44.5 65.4 L44.2 64.3 L44.2 62.5 L43.2 60.7 L43.9 60.2 L44.8 60.1 L49.0 60.1 Z M43.5 59.8 L43.1 60.0 L42.7 59.0 L43.3 58.4 L43.7 58.1 L44.3 58.6 L43.8 58.9 L43.5 59.2 L43.5 59.8 Z", cfa: false },
  { name: "Benin", d: "M29.6 43.5 L28.0 42.7 L27.8 39.3 L27.3 38.1 L27.0 37.0 L27.8 36.2 L28.8 35.7 L29.8 35.3 L30.8 36.5 L30.9 37.9 L30.3 39.1 L29.6 40.4 L29.6 43.5 L29.6 43.5 Z", cfa: true },
  { name: "Botswana", d: "M62.4 77.4 L63.1 78.5 L65.3 80.1 L65.7 81.5 L67.8 82.3 L64.5 84.3 L63.6 85.8 L62.5 86.5 L61.5 87.3 L59.6 86.8 L58.3 87.0 L57.3 88.1 L55.6 88.8 L55.4 87.5 L54.1 86.0 L55.5 81.9 L56.7 77.0 L59.4 77.1 L60.7 76.6 L61.8 76.4 L62.4 77.4 Z", cfa: false },
  { name: "Burkina Faso", d: "M21.7 38.8 L20.0 38.5 L18.9 38.6 L18.0 37.8 L18.3 36.5 L19.4 34.9 L20.0 33.6 L21.3 33.5 L22.6 32.5 L24.2 31.5 L25.3 31.6 L26.1 32.3 L27.1 33.8 L28.8 34.8 L28.5 36.1 L27.5 36.8 L25.7 37.0 L24.6 37.1 L21.5 37.0 L21.7 38.8 L21.7 38.8 Z", cfa: true },
  { name: "Burundi", d: "M67.6 58.2 L67.5 56.6 L67.2 55.9 L68.0 56.1 L68.5 55.3 L69.2 55.4 L69.3 55.9 L69.6 56.2 L69.6 56.7 L69.3 56.9 L68.7 57.7 L68.2 58.2 L67.6 58.2 Z", cfa: false },
  { name: "Cameroon", d: "M44.4 48.9 L43.4 49.1 L41.8 49.0 L39.7 47.8 L38.5 46.7 L37.8 45.9 L38.2 44.5 L39.3 43.2 L40.7 42.4 L42.5 42.5 L42.9 41.4 L43.9 40.1 L44.5 38.8 L45.1 37.3 L46.4 35.7 L46.0 35.0 L46.4 34.4 L47.1 36.2 L47.8 38.4 L46.6 38.5 L45.6 39.0 L47.1 40.0 L47.8 41.5 L46.8 43.3 L46.4 44.6 L46.4 45.6 L47.2 46.8 L48.4 47.9 L48.6 48.9 L47.4 49.4 L44.4 48.9 L44.4 48.9 Z", cfa: true },
  { name: "Central African Republic", d: "M47.5 41.9 L49.0 41.4 L49.6 41.8 L52.0 40.7 L52.6 39.7 L54.4 39.7 L56.7 37.6 L58.4 36.8 L59.4 38.2 L59.1 39.4 L59.7 40.2 L61.6 41.3 L62.6 42.5 L63.5 43.9 L64.8 44.9 L63.4 45.0 L61.8 45.0 L61.2 45.3 L59.0 45.7 L58.1 45.7 L56.7 46.3 L54.7 45.6 L52.8 45.6 L52.1 47.3 L50.2 46.9 L48.6 48.9 L48.4 47.9 L47.2 46.8 L46.4 45.6 L46.4 44.6 L46.8 43.3 L47.5 41.9 Z", cfa: true },
  { name: "Chad", d: "M46.4 34.4 L45.6 33.8 L45.1 32.4 L47.5 29.3 L48.1 24.7 L47.8 23.7 L47.3 22.9 L48.4 20.0 L59.8 25.2 L58.6 30.6 L57.6 32.4 L57.4 33.2 L57.2 34.3 L57.6 34.7 L57.9 36.1 L58.4 36.8 L56.7 37.6 L54.4 39.7 L52.6 39.7 L52.0 40.7 L49.6 41.8 L49.0 41.4 L47.5 41.9 L47.3 40.6 L46.5 39.8 L46.0 38.3 L47.0 38.4 L47.0 37.1 L47.0 35.3 L46.4 34.4 Z", cfa: true },
  { name: "Democratic Republic of the Congo", d: "M69.8 47.2 L70.2 49.0 L69.2 49.9 L68.4 51.2 L68.0 52.9 L67.6 54.3 L67.3 55.2 L67.5 56.6 L67.9 59.5 L68.0 61.0 L69.6 63.5 L67.1 63.6 L66.4 64.6 L66.4 66.8 L66.6 68.5 L68.0 68.7 L67.0 70.2 L65.9 68.9 L64.5 68.0 L62.5 68.2 L61.1 67.5 L60.4 67.1 L59.2 66.9 L57.7 67.1 L57.4 65.6 L56.9 64.3 L56.8 62.9 L55.0 62.1 L54.4 61.6 L53.5 61.9 L52.9 63.0 L51.6 63.0 L50.1 62.4 L49.4 61.1 L44.8 60.1 L43.9 60.2 L43.1 60.0 L43.5 59.2 L44.3 58.6 L45.1 58.2 L46.0 58.6 L47.4 58.0 L48.6 56.9 L49.2 54.4 L50.7 53.1 L50.9 52.1 L51.1 50.9 L51.6 48.8 L52.1 47.3 L52.8 45.6 L54.7 45.6 L56.7 46.3 L58.1 45.7 L59.0 45.7 L61.2 45.3 L61.8 45.0 L63.4 45.0 L64.8 44.9 L66.3 46.2 L67.4 46.0 L68.5 46.3 L69.8 47.2 Z", cfa: false },
  { name: "Djibouti", d: "M87.3 34.7 L87.6 35.1 L87.6 35.7 L86.7 36.0 L87.4 36.4 L86.8 37.1 L86.5 36.8 L86.2 36.9 L85.4 36.9 L85.3 36.5 L85.2 36.1 L85.7 35.5 L86.2 34.9 L86.8 35.0 L87.3 34.7 Z", cfa: false },
  { name: "Egypt", d: "M75.6 11.6 L74.9 13.2 L74.2 14.2 L73.1 13.1 L71.9 11.3 L73.4 14.1 L75.0 17.0 L76.7 19.3 L76.5 20.4 L78.4 21.9 L67.2 21.9 L61.4 16.9 L61.0 10.9 L61.1 9.5 L63.6 8.8 L66.4 9.6 L68.1 9.3 L70.0 8.8 L71.4 9.7 L72.8 9.6 L74.7 9.3 L75.6 11.6 Z", cfa: false },
  { name: "Equatorial Guinea", d: "M39.3 50.7 L39.0 50.5 L39.5 48.9 L41.8 49.0 L41.8 50.6 L39.8 50.6 L39.3 50.7 Z", cfa: true },
  { name: "Eritrea", d: "M86.2 34.9 L85.1 33.6 L84.1 32.7 L81.9 32.1 L80.7 32.2 L79.4 32.6 L77.6 31.8 L78.4 28.8 L79.9 28.2 L81.4 29.0 L82.6 30.9 L85.3 33.0 L86.6 34.2 L86.8 35.0 L86.2 34.9 Z", cfa: false },
  { name: "Ethiopia", d: "M79.9 31.6 L81.6 31.9 L82.9 32.2 L84.5 33.2 L85.7 34.4 L85.7 35.5 L85.3 36.5 L86.2 36.9 L86.8 37.1 L87.0 38.3 L88.1 39.5 L94.0 41.1 L88.1 45.3 L85.9 46.3 L84.5 46.7 L82.6 46.8 L81.3 47.3 L80.6 47.1 L78.4 46.0 L76.9 45.5 L76.1 44.5 L74.6 42.7 L73.7 41.5 L73.3 40.6 L74.2 40.2 L74.7 37.5 L75.5 36.5 L76.9 34.8 L77.8 32.3 L79.9 31.6 L79.9 31.6 Z", cfa: false },
  { name: "Gabon", d: "M41.6 57.5 L39.2 55.0 L38.3 53.1 L39.0 51.7 L39.8 50.6 L41.8 49.0 L43.4 49.1 L44.4 48.9 L44.7 50.3 L46.1 50.4 L46.2 52.8 L46.1 54.8 L44.4 55.4 L43.6 55.3 L42.1 55.8 L41.6 57.5 L41.6 57.5 Z", cfa: true },
  { name: "Gambia", d: "M1.7 34.0 L1.8 33.4 L3.4 33.4 L3.7 33.1 L4.2 33.0 L4.7 33.4 L5.2 33.4 L5.6 33.2 L5.9 33.6 L5.3 33.9 L4.7 33.8 L4.1 33.5 L3.6 33.9 L3.3 33.9 L3.0 34.1 L1.7 34.0 Z", cfa: false },
  { name: "Ghana", d: "M27.2 43.9 L24.2 45.2 L21.6 45.2 L21.1 43.5 L22.1 40.8 L21.5 37.8 L24.0 37.0 L25.1 36.9 L25.6 37.4 L26.2 39.1 L26.7 40.7 L26.5 42.6 L27.2 43.9 L27.2 43.9 Z", cfa: false },
  { name: "Guinea", d: "M13.7 41.5 L13.0 42.0 L12.3 41.7 L11.8 40.4 L11.1 40.5 L10.7 40.1 L10.5 39.4 L9.8 38.3 L8.4 38.5 L7.7 38.9 L6.8 39.9 L5.6 38.5 L4.9 38.1 L4.5 37.2 L4.7 36.3 L5.5 36.1 L6.1 35.9 L6.1 35.3 L6.8 34.8 L8.2 35.1 L9.1 35.1 L9.3 35.5 L9.9 35.3 L10.6 35.7 L11.6 35.5 L12.4 35.2 L13.0 35.5 L13.7 36.4 L13.4 37.2 L13.9 37.3 L14.2 38.1 L13.8 38.6 L14.5 40.3 L13.9 40.7 L13.9 41.5 L13.7 41.5 Z", cfa: false },
  { name: "Ivory Coast", d: "M21.6 45.2 L20.0 45.0 L17.4 45.2 L15.0 46.1 L14.8 44.9 L14.9 44.2 L13.8 43.6 L13.7 42.6 L13.7 41.5 L14.0 40.9 L14.0 40.5 L14.2 39.2 L14.0 38.2 L14.4 37.9 L15.9 38.2 L16.4 37.8 L17.1 38.2 L18.0 37.8 L18.9 38.6 L20.0 38.5 L21.7 38.8 L21.5 41.9 L21.7 44.7 L21.6 45.2 Z", cfa: true },
  { name: "Kenya", d: "M84.3 53.2 L84.1 54.9 L83.2 55.6 L82.6 57.1 L81.7 58.5 L79.6 56.3 L74.1 53.4 L74.5 51.3 L75.8 49.4 L75.0 47.2 L75.2 45.4 L76.9 44.7 L77.4 46.0 L80.2 47.1 L81.0 47.1 L82.2 47.4 L84.0 46.2 L85.5 46.7 L84.3 53.2 L84.3 53.2 Z", cfa: false },
  { name: "Lesotho", d: "M67.1 91.7 L67.6 92.1 L67.2 92.8 L66.9 93.2 L66.1 93.5 L65.9 93.9 L65.4 94.0 L64.3 93.0 L65.0 92.1 L65.8 91.6 L66.5 91.3 L67.1 91.7 Z", cfa: false },
  { name: "Liberia", d: "M14.7 46.1 L12.9 45.4 L10.3 43.6 L9.7 42.3 L10.4 41.2 L11.4 40.5 L12.4 41.2 L12.6 42.0 L13.3 41.5 L13.6 41.9 L13.4 43.2 L14.3 43.7 L14.9 44.8 L14.7 46.1 L14.7 46.1 Z", cfa: false },
  { name: "Libya", d: "M46.9 20.7 L45.1 20.5 L42.2 19.0 L40.4 18.7 L39.9 17.3 L39.6 15.7 L39.7 14.1 L39.8 12.4 L39.3 10.5 L40.1 9.6 L40.9 8.5 L42.0 7.7 L43.8 7.1 L45.6 7.2 L48.2 9.1 L51.5 9.9 L53.7 10.2 L54.0 8.6 L55.5 7.3 L58.4 7.3 L59.4 8.0 L61.3 8.4 L61.1 9.5 L61.0 10.9 L61.4 16.9 L61.4 24.7 L59.8 25.2 L48.4 20.0 L46.9 20.7 Z", cfa: false },
  { name: "Madagascar", d: "M96.5 69.1 L97.2 70.6 L97.8 72.9 L97.4 74.0 L96.7 73.6 L96.8 75.2 L96.3 76.6 L95.1 80.1 L93.6 84.6 L91.8 86.5 L89.8 86.8 L88.2 85.6 L87.6 83.3 L87.8 81.3 L88.4 80.6 L89.2 78.7 L88.6 77.2 L89.0 75.1 L89.9 74.2 L91.2 73.7 L92.7 72.9 L94.3 71.4 L94.7 70.9 L95.5 69.2 L96.5 69.1 L96.5 69.1 Z", cfa: false },
  { name: "Malawi", d: "M75.1 67.8 L75.1 70.7 L76.1 71.1 L76.8 73.8 L75.8 75.1 L74.7 73.3 L74.9 72.1 L74.0 71.9 L72.4 70.8 L73.3 69.1 L73.3 66.8 L73.2 65.3 L73.9 65.0 L74.7 66.0 L75.1 67.8 Z", cfa: false },
  { name: "Mali", d: "M8.3 32.0 L9.0 31.0 L10.5 31.3 L11.9 31.1 L17.8 30.8 L17.9 29.7 L16.5 17.9 L23.5 20.8 L28.7 24.5 L30.2 25.1 L31.8 25.8 L31.0 29.9 L29.6 30.9 L27.2 31.6 L25.3 31.6 L24.2 31.5 L22.6 32.5 L21.3 33.5 L20.0 33.6 L19.4 34.9 L18.3 36.5 L18.0 37.8 L17.1 38.2 L16.4 37.8 L15.9 38.2 L14.4 37.9 L13.8 37.7 L13.7 37.1 L13.5 36.8 L13.2 35.9 L12.7 35.2 L12.0 35.4 L11.2 35.8 L10.2 35.4 L9.6 35.5 L9.3 35.0 L9.2 34.1 L8.4 32.9 L8.3 32.0 Z", cfa: true },
  { name: "Mauritania", d: "M8.3 32.0 L6.5 30.1 L4.9 29.3 L3.4 29.6 L2.2 30.0 L2.5 28.5 L2.5 25.9 L2.5 24.5 L1.3 23.3 L7.2 22.8 L7.3 20.2 L8.6 16.5 L13.3 14.5 L16.5 17.9 L17.9 29.7 L17.8 30.8 L11.9 31.1 L10.5 31.3 L9.0 31.0 L8.3 32.0 L8.3 32.0 Z", cfa: false },
  { name: "Morocco", d: "M18.3 3.1 L20.5 3.6 L22.6 3.9 L23.2 5.6 L24.1 7.3 L22.0 8.1 L20.5 8.7 L18.8 10.3 L17.1 11.3 L13.3 12.5 L13.1 14.2 L13.2 14.9 L11.8 15.3 L10.6 15.1 L9.0 16.3 L7.9 18.1 L5.4 21.5 L4.6 22.6 L1.4 22.7 L2.0 21.7 L2.4 20.5 L3.7 18.7 L4.5 17.7 L5.1 16.1 L6.9 14.2 L7.7 13.6 L10.1 12.6 L12.1 11.0 L12.2 8.2 L13.3 6.5 L15.8 5.3 L17.2 3.1 L18.3 3.1 Z", cfa: false },
  { name: "Mozambique", d: "M75.1 67.8 L77.9 68.1 L79.2 67.9 L80.6 67.5 L83.3 66.2 L83.5 68.2 L83.7 71.5 L83.5 73.2 L82.1 75.0 L79.2 76.1 L77.0 77.9 L75.4 79.2 L76.0 81.2 L76.3 82.4 L76.5 83.7 L76.6 84.5 L75.8 85.6 L72.9 86.8 L72.4 87.9 L72.6 88.7 L71.4 88.1 L71.1 87.0 L71.0 84.5 L71.8 81.0 L72.4 79.9 L72.3 78.7 L72.6 76.7 L71.9 74.5 L70.9 74.1 L69.1 73.8 L68.8 72.3 L74.0 71.9 L74.9 72.1 L74.7 73.3 L75.8 75.1 L76.8 73.8 L76.1 71.1 L75.1 70.7 L75.1 67.8 L75.1 67.8 Z", cfa: false },
  { name: "Namibia", d: "M49.1 91.2 L47.4 89.2 L46.8 86.8 L46.3 83.1 L45.5 81.8 L44.0 79.0 L42.6 76.8 L43.2 75.5 L44.9 75.3 L46.0 75.8 L52.8 76.4 L58.9 76.1 L61.0 75.8 L61.5 76.2 L60.3 76.6 L58.9 76.5 L55.6 77.1 L54.1 82.0 L54.1 91.0 L52.1 91.8 L50.6 91.5 L49.7 90.5 L49.1 91.2 Z", cfa: false },
  { name: "Niger", d: "M28.8 35.7 L27.2 34.4 L26.3 32.9 L26.2 31.6 L27.7 31.1 L30.9 30.7 L31.8 29.0 L33.8 25.2 L42.9 19.9 L45.9 21.2 L47.3 22.9 L47.8 23.7 L48.1 24.7 L47.5 29.3 L45.1 32.4 L45.6 33.8 L46.4 34.4 L46.0 35.0 L44.7 33.5 L43.3 34.2 L41.4 33.7 L40.2 33.9 L38.6 34.5 L36.2 34.1 L34.9 33.6 L32.0 33.2 L31.4 34.3 L30.9 36.1 L29.3 35.3 L28.8 35.7 Z", cfa: true },
  { name: "Nigeria", d: "M37.9 45.5 L35.8 45.9 L34.1 46.2 L32.9 44.4 L30.8 43.5 L29.6 41.3 L29.9 39.5 L31.0 38.3 L31.1 37.3 L30.9 36.1 L31.4 34.3 L32.0 33.2 L34.9 33.6 L36.2 34.1 L38.6 34.5 L40.2 33.9 L41.4 33.7 L43.3 34.2 L44.7 33.5 L46.0 35.0 L46.4 35.7 L45.1 37.3 L44.5 38.8 L43.9 40.1 L42.9 41.4 L42.5 42.5 L40.7 42.4 L39.3 43.2 L38.2 44.5 L37.9 45.5 Z", cfa: false },
  { name: "Rwanda", d: "M69.2 53.6 L69.7 54.4 L69.7 55.2 L69.2 55.4 L68.5 55.3 L68.0 56.1 L67.2 55.9 L67.3 55.2 L67.5 55.1 L67.6 54.3 L68.0 53.9 L68.3 54.0 L69.2 53.6 Z", cfa: false },
  { name: "Senegal", d: "M1.8 33.4 L0.5 31.9 L1.9 30.7 L2.7 29.5 L4.1 29.3 L5.6 29.7 L7.4 31.1 L8.4 32.9 L9.2 34.1 L9.3 35.0 L8.3 35.0 L7.9 35.2 L6.1 34.8 L3.1 34.9 L1.9 35.1 L3.0 34.1 L3.6 33.9 L4.7 33.8 L5.9 33.6 L5.2 33.4 L4.2 33.0 L3.4 33.4 L1.8 33.4 Z", cfa: true },
  { name: "Sierra Leone", d: "M9.4 42.8 L8.0 42.1 L7.0 40.9 L7.6 39.3 L8.0 38.6 L8.7 38.3 L10.2 38.8 L10.5 39.8 L10.7 40.6 L10.4 41.2 L9.7 42.3 L9.4 42.8 Z", cfa: false },
  { name: "Somalia", d: "M96.8 36.2 L98.2 35.6 L98.8 36.0 L98.6 37.5 L97.9 39.5 L96.4 42.7 L93.9 46.3 L90.8 49.3 L87.3 51.7 L85.4 54.0 L84.3 53.2 L85.5 46.7 L86.8 46.2 L89.9 45.2 L95.0 39.9 L95.6 38.4 L95.6 36.4 L96.1 36.4 L96.8 36.2 Z", cfa: false },
  { name: "South Africa", d: "M70.7 92.1 L69.9 93.0 L68.7 94.7 L66.0 96.9 L63.5 98.1 L62.5 98.6 L61.0 98.6 L58.6 98.5 L56.5 99.0 L54.4 99.7 L53.1 99.3 L52.0 98.6 L51.8 98.4 L51.3 96.7 L51.7 95.4 L50.1 93.0 L49.1 91.2 L50.3 90.9 L51.2 91.6 L52.9 91.7 L54.1 86.0 L55.4 87.5 L55.6 88.8 L57.3 88.1 L58.3 87.0 L59.6 86.8 L61.5 87.3 L62.5 86.5 L63.6 85.8 L64.5 84.3 L67.8 82.3 L69.0 82.6 L70.3 82.5 L71.3 85.4 L71.2 87.5 L70.1 87.3 L69.5 88.2 L70.4 89.4 L71.5 88.7 L72.3 89.7 L71.7 91.4 L70.7 92.1 Z M67.1 91.7 L66.5 91.3 L65.8 91.6 L65.0 92.1 L64.3 93.0 L65.4 94.0 L65.9 93.9 L66.1 93.5 L66.9 93.2 L67.2 92.8 L67.6 92.1 L67.1 91.7 Z", cfa: false },
  { name: "South Sudan", d: "M74.2 39.1 L74.0 40.6 L72.8 41.4 L74.4 42.2 L75.3 43.0 L75.2 45.4 L73.4 46.9 L71.3 47.2 L69.8 47.2 L68.2 45.8 L66.7 46.0 L65.7 46.0 L64.6 44.5 L63.2 43.1 L61.6 41.8 L60.8 40.8 L60.3 40.1 L61.1 38.6 L62.6 37.8 L63.5 39.0 L64.4 38.9 L65.7 39.2 L67.1 38.9 L68.0 38.2 L69.8 38.8 L71.2 37.6 L71.9 36.1 L72.4 35.6 L73.2 35.4 L73.2 37.4 L74.1 38.4 L74.2 39.1 L74.2 39.1 Z", cfa: false },
  { name: "Sudan", d: "M74.2 39.1 L74.1 38.4 L73.2 37.4 L73.2 35.4 L72.4 35.6 L71.9 36.1 L71.2 37.6 L69.8 38.8 L68.0 38.2 L67.1 38.9 L65.7 39.2 L64.4 38.9 L63.5 39.0 L62.6 37.8 L61.1 38.6 L60.3 40.1 L59.7 40.2 L59.1 39.4 L59.4 38.2 L58.4 36.8 L57.9 36.1 L57.6 34.7 L57.2 34.3 L57.4 33.2 L57.6 32.4 L58.6 30.6 L59.8 25.2 L61.4 24.7 L67.2 21.9 L78.4 21.9 L78.5 23.5 L79.3 26.6 L80.6 27.4 L78.8 28.4 L78.2 29.7 L77.8 32.3 L76.9 34.8 L75.5 36.5 L74.7 37.5 L74.2 39.1 L74.2 39.1 Z", cfa: false },
  { name: "Swaziland", d: "M71.5 88.7 L71.2 89.3 L70.4 89.4 L69.6 88.7 L69.5 88.2 L69.9 87.7 L70.1 87.3 L70.5 87.2 L71.2 87.5 L71.4 88.1 L71.5 88.7 Z", cfa: false },
  { name: "Togo", d: "M28.4 43.6 L27.2 43.9 L26.9 43.5 L26.5 42.6 L26.4 41.9 L26.7 40.7 L26.4 40.2 L26.2 39.1 L26.2 38.1 L25.6 37.4 L25.7 37.0 L27.0 37.0 L26.8 37.7 L27.3 38.1 L27.8 38.6 L27.8 39.3 L28.1 39.5 L28.0 42.7 L28.4 43.6 Z", cfa: true },
  { name: "Tunisia", d: "M39.3 10.5 L37.8 7.5 L36.6 6.4 L37.3 4.6 L37.5 2.1 L39.3 0.9 L40.3 1.7 L41.6 1.5 L40.8 2.8 L41.2 4.3 L40.5 5.8 L41.6 6.4 L42.0 7.7 L40.9 8.5 L40.1 9.6 L39.3 10.5 L39.3 10.5 Z", cfa: false },
  { name: "Uganda", d: "M71.2 53.5 L69.2 53.6 L68.0 53.9 L68.3 52.3 L68.7 50.6 L69.8 49.5 L69.7 48.8 L70.4 46.9 L72.4 46.9 L74.3 46.2 L75.1 47.9 L75.2 50.4 L74.1 51.9 L71.2 53.5 L71.2 53.5 Z", cfa: false },
  { name: "Western Sahara", d: "M13.2 14.9 L13.3 14.2 L13.3 14.5 L8.6 16.5 L7.3 20.2 L7.2 22.8 L1.3 23.3 L1.4 22.7 L4.8 22.1 L5.9 19.6 L8.5 16.4 L9.4 15.2 L11.2 15.3 L12.3 14.9 L13.2 14.9 Z", cfa: false },
  { name: "Zambia", d: "M72.5 64.7 L73.6 66.5 L73.0 68.0 L72.8 69.6 L73.2 71.2 L69.0 73.3 L67.1 74.0 L66.4 74.6 L64.3 76.6 L63.4 76.5 L61.5 76.2 L61.0 75.8 L58.9 76.1 L57.0 74.1 L60.0 69.7 L60.1 68.8 L60.0 67.4 L60.4 67.1 L61.1 67.5 L62.5 68.2 L64.5 68.0 L65.9 68.9 L67.0 70.2 L68.0 68.7 L66.6 68.5 L66.4 66.8 L66.4 64.6 L67.1 63.6 L69.6 63.5 L70.8 64.1 L72.5 64.7 L72.5 64.7 Z", cfa: false },
  { name: "Zimbabwe", d: "M70.3 82.5 L69.0 82.6 L67.8 82.3 L65.7 81.5 L65.3 80.1 L63.1 78.5 L62.4 77.4 L63.4 76.5 L64.3 76.6 L66.4 74.6 L67.1 74.0 L69.0 73.3 L70.2 73.8 L71.2 74.4 L72.6 74.9 L72.4 77.6 L72.5 79.1 L72.2 80.0 L70.3 82.5 L70.3 82.5 Z", cfa: false },

];

// Villes zone CFA — positions réelles projetées avec la même formule que les frontières,
// pour un alignement précis sur la carte.
const CFA_CITIES = [
  { name: "Libreville", country: "Gabon", x: 39.2, y: 51.5 },
  { name: "Douala", country: "Cameroun", x: 39.6, y: 46.5 },
  { name: "Yaoundé", country: "Cameroun", x: 42.2, y: 46.8 },
  { name: "N'Djamena", country: "Tchad", x: 47.2, y: 35.5 },
  { name: "Bangui", country: "RCA", x: 52.2, y: 46.1 },
  { name: "Brazzaville", country: "Congo", x: 47.5, y: 57.9 },
  { name: "Malabo", country: "Guinée Éq.", x: 38.3, y: 46.9 },
  { name: "Dakar", country: "Sénégal", x: 0.8, y: 31.9 },
  { name: "Abidjan", country: "Côte d'Ivoire", x: 20.0, y: 44.8 },
  { name: "Ouagadougou", country: "Burkina Faso", x: 23.5, y: 35.1 },
  { name: "Bamako", country: "Mali", x: 14.3, y: 34.7 },
  { name: "Lomé", country: "Togo", x: 27.5, y: 43.7 },
  { name: "Cotonou", country: "Bénin", x: 29.2, y: 43.3 },
  { name: "Niamey", country: "Niger", x: 28.7, y: 33.5 },
];

export const AfricaMap: React.FC<AfricaMapProps> = ({
  developers,
  onSelectDeveloper,
  selectedCountry
}) => {
  return (
    <div className="relative w-full aspect-[4/3] max-w-3xl mx-auto bg-[#0A0A0F] rounded-3xl p-4 sm:p-8 border border-[#0066FF]/30 overflow-hidden shadow-[inset_0_0_50px_rgba(13,27,42,0.8)]">

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0066FF10_1px,transparent_1px),linear-gradient(to_bottom,#0066FF10_1px,transparent_1px)] bg-[size:24px_24px] opacity-60"></div>

      <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-[#0D1B2A] border border-[#0066FF]/40 text-[11px] font-mono text-[#00FF88] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping"></span>
        <span>GHULABE Pan-African Backbone</span>
      </div>

      <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-[#0D1B2A] border border-[#FFD700]/40 text-[9px] font-mono text-[#FFD700] flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#FFD700]"></span>
        <span>Zone CFA</span>
      </div>

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_20px_rgba(0,102,255,0.25)] select-none"
      >
        {/* Pays hors zone CFA — contours discrets */}
        {COUNTRIES.filter(c => !c.cfa).map((c, idx) => (
          <path
            key={`o-${idx}`}
            d={c.d}
            fill="#0D1B2A"
            stroke="#0066FF"
            strokeWidth="0.3"
            strokeOpacity="0.4"
            className="transition-all duration-300 hover:fill-[#122438]"
          />
        ))}

        {/* Pays zone CFA — surlignés en doré */}
        {COUNTRIES.filter(c => c.cfa).map((c, idx) => (
          <path
            key={`c-${idx}`}
            d={c.d}
            fill="#FFD700"
            fillOpacity="0.18"
            stroke="#FFD700"
            strokeWidth="0.4"
            strokeOpacity="0.7"
            className="transition-all duration-300 hover:fill-opacity-30"
          />
        ))}

        {/* Villes zone CFA — points dorés animés */}
        {CFA_CITIES.map((node, idx) => {
          const matchingDevs = developers.filter(d => d.city.toLowerCase() === node.name.toLowerCase());
          const isSelected = selectedCountry === node.country;
          return (
            <g
              key={`city-${idx}`}
              className="cursor-pointer group"
              onClick={() => matchingDevs.length > 0 && onSelectDeveloper(matchingDevs[0])}
            >
              <circle cx={node.x} cy={node.y} r={isSelected ? '3.2' : '2'} fill="#FFD700" opacity="0.3" className="animate-ping" />
              <circle cx={node.x} cy={node.y} r={isSelected ? '1.6' : '1'} fill={isSelected ? '#00FF88' : '#FFD700'} stroke="#0A0A0F" strokeWidth="0.25" className="transition-all duration-300 group-hover:fill-[#00FF88]" />
              <text x={node.x + 1.8} y={node.y + 0.8} fill="white" fontSize="2.4" fontFamily="Space Grotesk, sans-serif" fontWeight="700" className="drop-shadow-[0_1px_2px_rgba(0,0,0,1)] select-none group-hover:fill-[#00FF88] transition-colors">
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-4 left-4 bg-[#0D1B2A]/90 px-3 py-1.5 rounded-xl border border-[#FFD700]/30 text-[9px] font-mono text-[#FFD700]">
        ● {CFA_CITIES.length} villes zone CFA (CEMAC + UEMOA)
      </div>
      <div className="absolute bottom-4 right-4 bg-[#0D1B2A]/90 px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-gray-300">
        📍 {CFA_CITIES.length} Nœuds Actifs • Latence &lt; 25ms
      </div>
    </div>
  );
};
