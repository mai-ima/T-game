/** i18n基盤：ロケール辞書を追加するだけで他言語へ拡張できる。未訳キーは日本語へフォールバックする。 */
import { ja } from './ja';
import { en } from './en';

export type Locale = 'ja' | 'en';
export type Dict = Record<string, string>;
const dicts: Record<Locale, Dict> = { ja, en };
let current: Locale = 'ja';

export function setLocale(l: Locale) { current = l; }
export function getLocale() { return current; }
export function t(key: string, params: Record<string, string | number> = {}): string {
  const raw = dicts[current][key] ?? ja[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}
export const locales: { id: Locale; label: string; complete: boolean }[] = [{ id: 'ja', label: '日本語', complete: true }, { id: 'en', label: 'English（一部のみ）', complete: false }];
