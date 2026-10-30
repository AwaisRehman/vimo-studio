// Numbers transcribed from arXiv:2504.13936v2. Used on the Overview and Results pages.

export const paper = {
  title: 'A Generative Visual GUI World Model for App Agents',
  authors:
    'Dezhao Luo, Bohan Tang, Kang Li, Georgios Papoudakis, Jifei Song, Shaogang Gong, Jianye Hao, Jun Wang, Kun Shao',
  arxiv: 'https://arxiv.org/abs/2504.13936',
  project: 'https://ai-agents-2030.github.io/ViMo/',
}

/** Table 1 — GUI quality (automatic metrics + user study). */
export const table1 = [
  { method: 'HTML-vision', auto: { sgc: 0.7, sia: 85.77, sar: 62.79, sh: 0.72 }, user: { sgc: 0.31, sia: 11.32, sar: 9.01, sh: 0.23 } },
  { method: 'IP2P*', auto: { sgc: 0.74, sia: 63.57, sar: 70.15, sh: 0.69 }, user: { sgc: 0.82, sia: 58.92, sar: 52.81, sh: 0.63 } },
  { method: 'UI-diffuser', auto: { sgc: 0.6, sia: 39.61, sar: 38.75, sh: 0.44 }, user: { sgc: 0.36, sia: 14.32, sar: 8.56, sh: 0.27 } },
  { method: 'ViMo', auto: { sgc: 0.74, sia: 75.39, sar: 78.68, sh: 0.76 }, user: { sgc: 0.89, sia: 91.12, sar: 84.71, sh: 0.88 } },
]

/** Table 2 — step accuracy of App agents with / without ViMo. */
export const table2 = [
  { agent: 'ER', type: 'Language', leisure: 31.76, work: 46.15, system: 34.13, overall: 34.5 },
  { agent: 'AutoDroid', type: 'Language', leisure: 35.81, work: 46.15, system: 31.75, overall: 35.46 },
  { agent: 'T3A', type: 'Language', leisure: 41.22, work: 51.28, system: 42.86, overall: 43.13 },
  { agent: 'T3A + ViMo', type: 'Language', leisure: 50.0, work: 58.97, system: 45.24, overall: 49.2, ours: true },
  { agent: 'APP-Agent', type: 'Multi-modal', leisure: 43.24, work: 51.28, system: 39.68, overall: 42.81 },
  { agent: 'Mobile-Agent-v2', type: 'Multi-modal', leisure: 43.92, work: 53.85, system: 39.68, overall: 43.45 },
  { agent: 'M3A', type: 'Multi-modal', leisure: 46.62, work: 51.28, system: 43.65, overall: 46.01 },
  { agent: 'M3A + ViMo', type: 'Multi-modal', leisure: 53.38, work: 53.85, system: 45.24, overall: 50.16, ours: true },
]

/** Table 3 — world models plugged into M3A. */
export const table3 = [
  { wm: 'w/o WM', modality: '—', acc: 46.01 },
  { wm: 'Change-text', modality: 'Language', acc: 47.28 },
  { wm: 'HTML-text', modality: 'Language', acc: 46.65 },
  { wm: 'HTML-vision', modality: 'Vision', acc: 48.89 },
  { wm: 'UI-diffuser', modality: 'Vision', acc: 47.6 },
  { wm: 'IP2P*', modality: 'Vision', acc: 48.56 },
  { wm: 'ViMo', modality: 'Vision', acc: 50.16, ours: true },
]

/** Table 5 — online AndroidWorld task success. */
export const table5 = [
  { agent: 'SeeAct · GPT-4-Turbo', acc: 15.5 },
  { agent: 'M3A · Gemini-1.5-Pro', acc: 22.8 },
  { agent: 'M3A · GPT-4-Turbo', acc: 25.4 },
  { agent: 'T3A · Gemini-1.5-Pro', acc: 19.4 },
  { agent: 'T3A · GPT-4-Turbo', acc: 30.6 },
  { agent: 'T3A · Gemini-2.0-Flash', acc: 33.19 },
  { agent: 'T3A + ViMo · Gemini-2.0-Flash', acc: 40.95, ours: true },
]

/** Table 7 — roll-out iterations. */
export const table7 = [
  { it: 'No WM', acc: 39.94 },
  { it: '1 step', acc: 46.06 },
  { it: '2 steps', acc: 46.65 },
  { it: '3 steps', acc: 45.05 },
]

/** Table 10 — trajectory synthesis accuracy for horizon T+L. */
export const table10 = [
  { wm: 'w/o WM', t1: 22.81, t2: 14.04, t3: 7.02, t4: 0 },
  { wm: 'Change-text', t1: 52.63, t2: 26.32, t3: 10.53, t4: 5.26 },
  { wm: 'HTML-text', t1: 38.6, t2: 14.04, t3: 12.28, t4: 7.02 },
  { wm: 'HTML-vision', t1: 43.86, t2: 19.3, t3: 10.53, t4: 10.53 },
  { wm: 'UI-diffuser', t1: 52.63, t2: 29.82, t3: 12.28, t4: 5.26 },
  { wm: 'IP2P*', t1: 56.14, t2: 21.05, t3: 10.53, t4: 7.02 },
  { wm: 'ViMo', t1: 57.89, t2: 36.84, t3: 14.03, t4: 12.28 },
]

export const dataset = { apps: 19, episodes: 3550, images: 23620, instructions: 18450 }
