const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxVyjxuu-wfJVsziHC71LP1J1dPP3J1eHWVtlGeN-oARVtTJPtoTJJ_pRf_PB5fPwR9/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(APPS_SCRIPT_URL, { signal: controller.signal });
    clearTimeout(timeout);
    const json = await resp.json();
    return res.status(200).json({ numeros: json.numeros || [] });
  } catch (e) {
    return res.status(200).json({ numeros: [] });
  }
}
