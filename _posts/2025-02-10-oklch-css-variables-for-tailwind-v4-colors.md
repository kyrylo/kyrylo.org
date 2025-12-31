---
layout: post
title: OKLCH CSS variables for Tailwind v4 colors
date: 2025-02-09
categories: css
image: assets/images/kyrylo-silin@2x.webp
---

For almost all my projects, I use [Tailwind](https://tailwindcss.com) as my CSS
framework. I love its ease of use and the development speed it provides.
Tailwind comes with a predefined set of colors, which I stick to in my designs.

Sometimes, I need to use these colors outside of Tailwind — in JavaScript, plain
HTML, or standalone CSS files. To make that easier, I wanted these colors
available as CSS variables.

I took the original Tailwind RGB colors and converted them to
[OKLCH](https://www.w3.org/TR/css-color-4/#ok-lab) using the [OKLCH color
converter](https://oklch.com/). Below is a comprehensive list of Tailwind v4
colors as OKLCH CSS variables.

You can copy the entire list and paste it into your project:

```css
:root {
  /* White */
  --color-white: oklch(100% 0 0);

  /* Black */
  --color-black: oklch(0% 0 0)

  /* Slate */
  --color-slate-50: oklch(98.42% 0.0034 247.86);
  --color-slate-100: oklch(96.83% 0.0069 247.9);
  --color-slate-200: oklch(92.88% 0.0126 255.51);
  --color-slate-300: oklch(86.9% 0.0198 252.89);
  --color-slate-400: oklch(71.07% 0.0351 256.79);
  --color-slate-500: oklch(55.44% 0.0407 257.42);
  --color-slate-600: oklch(44.55% 0.0374 257.28);
  --color-slate-700: oklch(37.17% 0.0392 257.29);
  --color-slate-800: oklch(27.95% 0.0368 260.03);
  --color-slate-900: oklch(20.77% 0.0398 265.75);
  --color-slate-950: oklch(12.88% 0.0406 264.7);

  /* Gray */
  --color-gray-50: oklch(98.46% 0.0017 247.84);
  --color-gray-100: oklch(96.7% 0.0029 264.54);
  --color-gray-200: oklch(92.76% 0.0058 264.53);
  --color-gray-300: oklch(87.17% 0.0093 258.34);
  --color-gray-400: oklch(71.37% 0.0192 261.32);
  --color-gray-500: oklch(55.1% 0.0234 264.36);
  --color-gray-600: oklch(55.1% 0.0234 264.36);
  --color-gray-700: oklch(37.29% 0.0306 259.73);
  --color-gray-800: oklch(27.81% 0.0296 256.85);
  --color-gray-900: oklch(21.01% 0.0318 264.66);
  --color-gray-950: oklch(12.96% 0.0274 261.69);

  /* Zinc */
  --color-zinc-50: oklch(98.51% 0 0);
  --color-zinc-100: oklch(96.74% 0.0013 286.38);
  --color-zinc-200: oklch(91.97% 0.004 286.32);
  --color-zinc-300: oklch(87.11% 0.0055 286.29);
  --color-zinc-400: oklch(71.18% 0.0129 286.07);
  --color-zinc-500: oklch(55.17% 0.0138 285.94);
  --color-zinc-600: oklch(44.19% 0.0146 285.79);
  --color-zinc-700: oklch(37.03% 0.0119 285.81);
  --color-zinc-800: oklch(27.39% 0.0055 286.03);
  --color-zinc-900: oklch(21.03% 0.0059 285.89);
  --color-zinc-950: oklch(14.08% 0.0044 285.82);

  /* Neutral */
  --color-neutral-50: oklch(98.51% 0 0);
  --color-neutral-100: oklch(97.02% 0 0);
  --color-neutral-200: oklch(92.19% 0 0);
  --color-neutral-300: oklch(86.99% 0 0);
  --color-neutral-400: oklch(71.55% 0 0);
  --color-neutral-500: oklch(55.55% 0 0);
  --color-neutral-600: oklch(43.86% 0 0);
  --color-neutral-700: oklch(37.15% 0 0);
  --color-neutral-800: oklch(26.86% 0 0);
  --color-neutral-900: oklch(20.46% 0 0);
  --color-neutral-950: oklch(14.48% 0 0);

  /* Stone */
  --color-stone-50: oklch(98.48% 0.0013 106.42);
  --color-stone-100: oklch(96.99% 0.0013 106.42);
  --color-stone-200: oklch(92.32% 0.0026 48.72);
  --color-stone-300: oklch(86.87% 0.0043 56.37);
  --color-stone-400: oklch(71.61% 0.0091 56.26);
  --color-stone-500: oklch(55.34% 0.0116 58.07);
  --color-stone-600: oklch(44.44% 0.0096 73.64);
  --color-stone-700: oklch(37.41% 0.0087 67.56);
  --color-stone-800: oklch(26.85% 0.0063 34.3);
  --color-stone-900: oklch(21.61% 0.0061 56.04);
  --color-stone-950: oklch(14.69% 0.0041 49.25);

  /* Red */
  --color-red-50: oklch(97.05% 0.0129 17.38);
  --color-red-100: oklch(93.56% 0.0309 17.72);
  --color-red-200: oklch(88.45% 0.0593 18.33);
  --color-red-300: oklch(80.77% 0.1035 19.57);
  --color-red-400: oklch(71.06% 0.1661 22.22);
  --color-red-500: oklch(63.68% 0.2078 25.33);
  --color-red-600: oklch(57.71% 0.2152 27.33);
  --color-red-700: oklch(50.54% 0.1905 27.52);
  --color-red-800: oklch(44.37% 0.1613 26.9);
  --color-red-900: oklch(39.58% 0.1331 25.72);
  --color-red-950: oklch(25.75% 0.0886 26.04);

  /* Orange */
  --color-orange-50: oklch(97.96% 0.015771618519989913 73.68407794443895);
  --color-orange-100: oklch(95.42% 0.03715446392304164 75.16435946755645);
  --color-orange-200: oklch(90.15% 0.0729 70.7);
  --color-orange-300: oklch(83.66% 0.1165 66.29);
  --color-orange-400: oklch(75.76% 0.159 55.93);
  --color-orange-500: oklch(70.49% 0.1867 47.6);
  --color-orange-600: oklch(64.61% 0.1943 41.12);
  --color-orange-700: oklch(55.34% 0.1739 38.4);
  --color-orange-800: oklch(46.98% 0.143 37.3);
  --color-orange-900: oklch(40.84% 0.1165 38.17);
  --color-orange-950: oklch(26.59% 0.0762 36.26);

  /* Amber */
  --color-amber-50: oklch(98.69% 0.021403008259500936 95.27742336745216);
  --color-amber-100: oklch(96.19% 0.058 95.62);
  --color-amber-200: oklch(92.43% 0.1151 95.75);
  --color-amber-300: oklch(87.9% 0.1534 91.61);
  --color-amber-400: oklch(83.69% 0.1644 84.43);
  --color-amber-500: oklch(76.86% 0.1647 70.08);
  --color-amber-600: oklch(66.58% 0.1574 58.32);
  --color-amber-700: oklch(55.53% 0.1455 49);
  --color-amber-800: oklch(47.32% 0.1247 46.2);
  --color-amber-900: oklch(41.37% 0.1054 45.9);
  --color-amber-950: oklch(27.91% 0.0742 45.64);

  /* Yellow */
  --color-yellow-50: oklch(98.73% 0.0262 102.21);
  --color-yellow-100: oklch(97.29% 0.0693 103.19);
  --color-yellow-200: oklch(94.51% 0.1243 101.54);
  --color-yellow-300: oklch(90.52% 0.1657 98.11);
  --color-yellow-400: oklch(86.06% 0.1731 91.94);
  --color-yellow-500: oklch(79.52% 0.1617 86.05);
  --color-yellow-600: oklch(68.06% 0.1423 75.83);
  --color-yellow-700: oklch(55.38% 0.1207 66.44);
  --color-yellow-800: oklch(47.62% 0.1034 61.91);
  --color-yellow-900: oklch(42.1% 0.0897 57.71);
  --color-yellow-950: oklch(28.57% 0.0639 53.81);

  /* Lime */
  --color-lime-50: oklch(98.57% 0.031 120.76);
  --color-lime-100: oklch(96.69% 0.0659 122.33);
  --color-lime-200: oklch(93.82% 0.1217 124.32);
  --color-lime-300: oklch(89.72% 0.1786 126.67);
  --color-lime-400: oklch(84.93% 0.2073 128.85);
  --color-lime-500: oklch(76.81% 0.2044 130.85);
  --color-lime-600: oklch(64.82% 0.1754 131.68);
  --color-lime-700: oklch(53.22% 0.1405 131.59);
  --color-lime-800: oklch(45.28% 0.1129 130.93);
  --color-lime-900: oklch(40.5% 0.0956 131.06);
  --color-lime-950: oklch(27.41% 0.0688 132.11);

  /* Green */
  --color-green-50: oklch(98.19% 0.0181 155.83);
  --color-green-100: oklch(96.24% 0.0434 156.74);
  --color-green-200: oklch(92.5% 0.0806 155.99);
  --color-green-300: oklch(87.12% 0.1363 154.45);
  --color-green-400: oklch(80.03% 0.1821 151.71);
  --color-green-500: oklch(72.27% 0.192 149.58);
  --color-green-600: oklch(62.71% 0.1699 149.21);
  --color-green-700: oklch(52.73% 0.1371 150.07);
  --color-green-800: oklch(44.79% 0.1083 151.33);
  --color-green-900: oklch(39.25% 0.0896 152.54);
  --color-green-950: oklch(26.64% 0.0628 152.93);

  /* Emerald */
  --color-emerald-50: oklch(97.93% 0.0207 166.11);
  --color-emerald-100: oklch(95.05% 0.0507 163.05);
  --color-emerald-200: oklch(90.49% 0.0895 164.15);
  --color-emerald-300: oklch(84.52% 0.1299 164.98);
  --color-emerald-400: oklch(77.29% 0.1535 163.22);
  --color-emerald-500: oklch(69.59% 0.1491 162.48);
  --color-emerald-600: oklch(59.6% 0.1274 163.23);
  --color-emerald-700: oklch(50.81% 0.1049 165.61);
  --color-emerald-800: oklch(43.18% 0.0865 166.91);
  --color-emerald-900: oklch(37.8% 0.073 168.94);
  --color-emerald-950: oklch(26.21% 0.0487 172.55);

  /* Teal */
  --color-teal-50: oklch(98.36% 0.0142 180.72);
  --color-teal-100: oklch(95.27% 0.0498 180.8);
  --color-teal-200: oklch(91% 0.0927 180.43);
  --color-teal-300: oklch(85.49% 0.1251 181.07);
  --color-teal-400: oklch(78.45% 0.1325 181.91);
  --color-teal-500: oklch(70.38% 0.123 182.5);
  --color-teal-600: oklch(60.02% 0.1038 184.7);
  --color-teal-700: oklch(51.09% 0.0861 186.39);
  --color-teal-800: oklch(43.7% 0.0705 188.22);
  --color-teal-900: oklch(38.61% 0.059 188.42);
  --color-teal-950: oklch(27.73% 0.0447 192.52);

  /* Cyan */
  --color-cyan-50: oklch(98.41% 0.0189 200.87);
  --color-cyan-100: oklch(95.63% 0.0443 203.39);
  --color-cyan-200: oklch(91.67% 0.0772 205.04);
  --color-cyan-300: oklch(86.51% 0.1153 207.08);
  --color-cyan-400: oklch(79.71% 0.1339 211.53);
  --color-cyan-500: oklch(71.48% 0.1257 215.22);
  --color-cyan-600: oklch(60.89% 0.1109 221.72);
  --color-cyan-700: oklch(51.98% 0.0936 223.13);
  --color-cyan-800: oklch(45% 0.0771 224.28);
  --color-cyan-900: oklch(39.82% 0.0664 227.39);
  --color-cyan-950: oklch(30.18% 0.0541 229.7);

  /* Sky */
  --color-sky-50: oklch(97.71% 0.012485946526696063 236.61974498403976);
  --color-sky-100: oklch(95.14% 0.025 236.82);
  --color-sky-200: oklch(90.14% 0.0555 230.9);
  --color-sky-300: oklch(82.76% 0.1013 230.32);
  --color-sky-400: oklch(75.35% 0.139 232.66);
  --color-sky-500: oklch(68.47% 0.1479 237.32);
  --color-sky-600: oklch(58.76% 0.1389 241.97);
  --color-sky-700: oklch(50% 0.1193 242.75);
  --color-sky-800: oklch(44.34% 0.1 240.79);
  --color-sky-900: oklch(39.12% 0.0845 240.88);
  --color-sky-950: oklch(29.35% 0.0632 243.16);

  /* Blue */
  --color-blue-50: oklch(97.05% 0.01418224665972208 254.6041641690868);
  --color-blue-100: oklch(93.19% 0.0316 255.59);
  --color-blue-200: oklch(88.23% 0.0571 254.13);
  --color-blue-300: oklch(80.91% 0.0956 251.81);
  --color-blue-400: oklch(71.37% 0.1434 254.62);
  --color-blue-500: oklch(62.31% 0.188 259.81);
  --color-blue-600: oklch(54.61% 0.2152 262.88);
  --color-blue-700: oklch(48.82% 0.2172 264.38);
  --color-blue-800: oklch(42.44% 0.1809 265.64);
  --color-blue-900: oklch(37.91% 0.1378 265.52);
  --color-blue-950: oklch(28.23% 0.0874 267.94);

  /* Indigo */
  --color-indigo-50: oklch(96.19% 0.0179 272.31);
  --color-indigo-100: oklch(92.99% 0.0334 272.79);
  --color-indigo-200: oklch(86.99% 0.0622 274.04);
  --color-indigo-300: oklch(78.53% 0.1041 274.71);
  --color-indigo-400: oklch(68.01% 0.1583 276.93);
  --color-indigo-500: oklch(58.54% 0.2041 277.12);
  --color-indigo-600: oklch(51.06% 0.2301 276.97);
  --color-indigo-700: oklch(45.68% 0.2146 277.02);
  --color-indigo-800: oklch(39.84% 0.1773 277.37);
  --color-indigo-900: oklch(35.88% 0.1354 278.7);
  --color-indigo-950: oklch(25.73% 0.0861 281.29);

  /* Violet */
  --color-violet-50: oklch(96.19% 0.0179 272.31);
  --color-violet-100: oklch(94.33% 0.0284 294.59);
  --color-violet-200: oklch(89.43% 0.0549 293.28);
  --color-violet-300: oklch(81.12% 0.1013 293.57);
  --color-violet-400: oklch(70.9% 0.1592 293.54);
  --color-violet-500: oklch(60.56% 0.2189 292.72);
  --color-violet-600: oklch(54.13% 0.2466 293.01);
  --color-violet-700: oklch(49.07% 0.2412 292.58);
  --color-violet-800: oklch(43.2% 0.2106 292.76);
  --color-violet-900: oklch(37.96% 0.1783 293.74);
  --color-violet-950: oklch(28.27% 0.1351 291.09);

  /* Purple */
  --color-purple-50: oklch(97.68% 0.0142 308.3);
  --color-purple-100: oklch(94.64% 0.0327 307.17);
  --color-purple-200: oklch(90.24% 0.06040838720918992 306.7029975247675);
  --color-purple-300: oklch(82.68% 0.1082 306.38);
  --color-purple-400: oklch(72.17% 0.1767 305.5);
  --color-purple-500: oklch(62.68% 0.2325 303.9);
  --color-purple-600: oklch(55.75% 0.2525 302.32);
  --color-purple-700: oklch(49.55% 0.2369 301.92);
  --color-purple-800: oklch(43.83% 0.1983 303.72);
  --color-purple-900: oklch(38.07% 0.1661 304.99);
  --color-purple-950: oklch(29.05% 0.1432 302.72);

  /* Fuchsia */
  --color-fuchsia-50: oklch(97.73% 0.017319799618005262 320.057924702978);
  --color-fuchsia-100: oklch(95.2% 0.035966474160176905 318.851883433472);
  --color-fuchsia-200: oklch(90.3% 0.0732 319.62);
  --color-fuchsia-300: oklch(83.3% 0.1322 321.43);
  --color-fuchsia-400: oklch(74.77% 0.207 322.16);
  --color-fuchsia-500: oklch(66.68% 0.2591 322.15);
  --color-fuchsia-600: oklch(59.15% 0.2569 322.9);
  --color-fuchsia-700: oklch(51.8% 0.2258 323.95);
  --color-fuchsia-800: oklch(45.19% 0.1922 324.59);
  --color-fuchsia-900: oklch(40.07% 0.1601 325.61);
  --color-fuchsia-950: oklch(29.32% 0.1309 325.66);

  /* Pink */
  --color-pink-50: oklch(97.14% 0.0141 343.2);
  --color-pink-100: oklch(94.82% 0.0276 342.26);
  --color-pink-200: oklch(89.94% 0.0589 343.23);
  --color-pink-300: oklch(82.28% 0.1095 346.02);
  --color-pink-400: oklch(72.53% 0.1752 349.76);
  --color-pink-500: oklch(65.59% 0.2118 354.31);
  --color-pink-600: oklch(59.16% 0.218 0.58);
  --color-pink-700: oklch(52.46% 0.199 3.96);
  --color-pink-800: oklch(45.87% 0.1697 3.82);
  --color-pink-900: oklch(40.78% 0.1442 2.43);
  --color-pink-950: oklch(28.45% 0.1048 3.91);

  /* Rose */
  --color-rose-50: oklch(96.94% 0.0151 12.42);
  --color-rose-100: oklch(94.14% 0.0297 12.58);
  --color-rose-200: oklch(89.24% 0.0559 10);
  --color-rose-300: oklch(80.97% 0.1061 11.64);
  --color-rose-400: oklch(71.92% 0.169 13.43);
  --color-rose-500: oklch(64.5% 0.2154 16.44);
  --color-rose-600: oklch(58.58% 0.222 17.58);
  --color-rose-700: oklch(51.43% 0.1978 16.93);
  --color-rose-800: oklch(45.46% 0.1713 13.7);
  --color-rose-900: oklch(41.03% 0.1502 10.27);
  --color-rose-950: oklch(27.08% 0.1009 12.09);
}
```
