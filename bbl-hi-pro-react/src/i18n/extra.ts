// Bilingual text for features added after the generated dictionary. Keep the Thai and English pair together.
import type { Lang } from '../utils/format';

export const EXTRA = {
  acct_title: { th: 'บัญชีของคุณ', en: 'Your accounts' },
  acct_note: { th: 'เลขบัญชีถูกปิดบางส่วน ข้อมูลทั้งหมดเป็นข้อมูลจำลอง', en: 'Account numbers are partly masked. All data is simulated.' },
  acct_group: { th: 'เลือกบัญชี', en: 'Choose an account' },
  acct_hide: { th: 'ซ่อนยอดเงิน', en: 'Hide balances' },
  acct_show: { th: 'แสดงยอดเงิน', en: 'Show balances' },
  pdf_btn: { th: 'ดาวน์โหลด PDF (ตัวอย่างจำลอง)', en: 'Download PDF (sample)' },
  pdf_note: { th: 'ไฟล์นี้สร้างจากข้อมูลจำลองเพื่อการสาธิต ไม่ใช่เอกสารจริง', en: 'This file is generated from simulated data for demonstration. It is not a real document.' },
  pdf_heading: { th: 'เอกสารตัวอย่าง', en: 'Sample document' },
  pdf_brand_sub: { th: 'ต้นแบบเว็บแอปพลิเคชันธนาคาร · ข้อมูลจำลอง', en: 'Banking web prototype · simulated data' },
  pdf_watermark: { th: 'ตัวอย่างจำลอง · SAMPLE', en: 'SAMPLE · SIMULATED' },
  pdf_applicant: { th: 'ผู้ขอ (จำลอง)', en: 'Applicant (simulated)' },
  pdf_row_ref: { th: 'เลขที่อ้างอิง', en: 'Reference' },
  pdf_row_type: { th: 'ประเภทเอกสาร', en: 'Document type' },
  pdf_row_date: { th: 'วันที่ออก', en: 'Issue date' },
  pdf_row_status: { th: 'สถานะ', en: 'Status' },
  pdf_status_ready: { th: 'พร้อมรับเอกสาร', en: 'Ready for pick-up or download' },
  pdf_applicant_name: { th: 'ตัวอย่าง ผู้ใช้งาน', en: 'Sample User' },
  pdf_footer: { th: 'เอกสารนี้สร้างจากข้อมูลจำลองเพื่อการสาธิตต้นแบบ ไม่มีผลทางกฎหมาย', en: 'Generated from simulated data for a prototype demo. Has no legal effect.' },
  wq_title: { th: 'แบบประเมินตนเอง', en: 'Self-assessment' },
  wq_sub: { th: 'ตอบทีละชุด แต่ละข้อเลือกได้ 5 ระดับ', en: 'Answer one set at a time. Each item has five levels.' },
  wq_answered: { th: 'ตอบแล้ว', en: 'Answered' },
  wq_score: { th: 'คะแนนชุดนี้', en: 'Set score' },
  wq_overall: { th: 'คะแนนรวม', en: 'Overall' },
  wq_reset: { th: 'เริ่มใหม่', en: 'Reset' },
  wq_source: { th: 'แนวคิดได้รับแรงบันดาลใจจาก CFPB Financial Well-Being Scale ของสำนักคุ้มครองผู้บริโภคการเงินสหรัฐฯ ข้อคำถามเขียนขึ้นใหม่สำหรับการสาธิต คะแนนนี้ไม่ได้ใช้ในคะแนนหลักด้านบน', en: 'Inspired by the CFPB Financial Well-Being Scale (US Consumer Financial Protection Bureau). Questions are newly written for this demo. This score is not used in the main score above.' },
  scale_0: { th: 'ไม่เลย', en: 'Never' },
  scale_1: { th: 'ไม่ค่อย', en: 'Rarely' },
  scale_2: { th: 'บางครั้ง', en: 'Sometimes' },
  scale_3: { th: 'บ่อย', en: 'Often' },
  scale_4: { th: 'เป็นประจำ', en: 'Always' },
} as const;

export type ExtraKey = keyof typeof EXTRA;
export const SCALE_KEYS: readonly ExtraKey[] = ['scale_0', 'scale_1', 'scale_2', 'scale_3', 'scale_4'];
export const tx = (lang: Lang, key: ExtraKey): string => EXTRA[key][lang];
