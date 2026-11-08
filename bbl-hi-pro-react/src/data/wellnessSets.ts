// Self-assessment question sets (fictional wording, prototype only). Options score 0–4 (Never … Always).
import type { Lang } from '../utils/format';

export type Bi = Record<Lang, string>;
export interface WellnessQuestion { id: string; text: Bi; /** True when a high answer is a bad sign. */ reverse?: boolean }
export interface WellnessSet { id: string; title: Bi; questions: WellnessQuestion[] }

export const WELLNESS_SETS: WellnessSet[] = [
  {
    id: 'knowledge', title: { th: 'ชุดที่ 1 · ความรู้และการวางแผน', en: 'Set 1 · Knowledge and planning' }, questions: [
      { id: 'k1', text: { th: 'ฉันรู้ว่าตัวเองมีรายรับและรายจ่ายเดือนละเท่าไร', en: 'I know how much I earn and spend each month' } },
      { id: 'k2', text: { th: 'ฉันตั้งงบประมาณสำหรับแต่ละเดือนไว้ล่วงหน้า', en: 'I set a budget for each month in advance' } },
      { id: 'k3', text: { th: 'ฉันเข้าใจดอกเบี้ยและค่าธรรมเนียมของสินเชื่อหรือบัตรเครดิตที่ใช้อยู่', en: 'I understand the interest and fees on the loans or credit cards I use' } },
      { id: 'k4', text: { th: 'ฉันมีเป้าหมายการเงินที่ชัดเจนพร้อมวันที่ต้องการ', en: 'I have clear financial goals with target dates' } },
      { id: 'k5', text: { th: 'ฉันเปรียบเทียบผลิตภัณฑ์การเงินก่อนตัดสินใจ', en: 'I compare financial products before deciding' } },
    ],
  },
  {
    id: 'habit', title: { th: 'ชุดที่ 2 · พฤติกรรมการใช้เงิน', en: 'Set 2 · Spending habits' }, questions: [
      { id: 'h1', text: { th: 'ฉันจ่ายบิลและค่างวดตรงเวลา', en: 'I pay bills and instalments on time' } },
      { id: 'h2', text: { th: 'ฉันออมเงินส่วนหนึ่งทุกครั้งที่ได้รับรายได้', en: 'I set aside part of my income whenever I get paid' } },
      { id: 'h3', text: { th: 'ฉันจ่ายตามอารมณ์หรือซื้อของที่ไม่ได้วางแผนไว้', en: 'I spend on impulse or buy things I did not plan for' }, reverse: true },
      { id: 'h4', text: { th: 'ฉันตรวจสอบยอดในบัญชีและรายการใช้จ่ายเป็นประจำ', en: 'I check my account balance and transactions regularly' } },
      { id: 'h5', text: { th: 'ฉันหลีกเลี่ยงการกู้ยืมเพิ่มเมื่อมีหนี้อยู่แล้ว', en: 'I avoid taking new loans while I already have debt' } },
    ],
  },
  {
    id: 'security', title: { th: 'ชุดที่ 3 · ความมั่นคงและความยืดหยุ่น', en: 'Set 3 · Security and resilience' }, questions: [
      { id: 's1', text: { th: 'ฉันมีเงินสำรองพอใช้จ่ายอย่างน้อย 3 เดือนเมื่อฉุกเฉิน', en: 'I have at least 3 months of expenses saved for emergencies' } },
      { id: 's2', text: { th: 'ฉันมั่นใจว่ารับมือค่าใช้จ่ายก้อนใหญ่ที่ไม่คาดคิดได้', en: 'I feel confident I can handle a large unexpected expense' } },
      { id: 's3', text: { th: 'ฉันสามารถจ่ายหนี้ที่ค้างทั้งหมดได้โดยไม่กระทบค่าใช้จ่ายจำเป็น', en: 'I could pay off my debts without affecting essential expenses' } },
      { id: 's4', text: { th: 'ฉันมีประกันสุขภาพหรือประกันชีวิตที่เพียงพอ', en: 'I have adequate health or life insurance' } },
      { id: 's5', text: { th: 'เรื่องเงินไม่ทำให้ฉันกังวลหรือนอนไม่หลับ', en: 'Money matters do not keep me worried or awake at night' } },
    ],
  },
];
