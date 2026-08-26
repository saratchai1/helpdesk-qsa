# Helpdesk QSA Monthly Report

Web app สำหรับสร้าง **Monthly QSA report** จาก raw Excel ที่ export จากระบบ โดยถอด logic จากไฟล์ `Report Monthly QSA Drive thru _Jun-2026.xlsx`.

## Flow

1. Upload `.xlsx` / `.xls`
2. ระบบเลือก sheet `Worksheet` อัตโนมัติ
3. คำนวณ Year/Month, Warranty ปี 1/2/3/Out Warranty, ServiceDesk Team และ waiting classification
4. สร้าง report tabs ตาม workbook เดิม
5. Export PDF ได้ทั้ง tab ปัจจุบันหรือทั้งรายงาน

ข้อมูลถูกประมวลผล **client-side ใน browser** และไม่ถูกส่งขึ้น backend.

## Report tabs

- Received Cases Trend
- จำแนก Type
- Cases Type + Warraty
- Category ALL
- Warranty ปีที่ 1 / 2 / 3
- รายละเอียด Warranty ปีที่ 1
- Out Warranty
- TOP 5 Category
- ผลต่าง Ref.รายปี
- TOP 5 Store
- Cases Pending Ditto
- Pending Table
- Detail Pending

## Validation baseline

สำหรับไฟล์ตัวอย่าง Jun-2026 engine ต้องได้อย่างน้อย:

- Total cases: `30`
- Warranty ปีที่ 1: `3`
- Warranty ปีที่ 2: `2`
- Warranty ปีที่ 3: `0`
- Out Warranty: `25`
- Pending as-of period: `9`
- Top categories: COD `9`, Dashboard DT `8`, Headset `7`, Loop Detector `3`, Battery Headset `2`

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Notes on raw data

ไฟล์ตัวอย่างมี helper columns ต่อจาก raw export เดิม (เช่น Warranty / Year / MM / อุปกรณ์เสีย-ไม่เสีย). แอปรองรับทั้งกรณีที่ helper columns มีอยู่แล้วและกรณี raw export ไม่มี โดยจะคำนวณส่วนที่จำเป็นจากวันที่แจ้งเคสและวันหมดประกันให้ใหม่.
